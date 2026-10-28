using System.Text.Json;
using FixMate.Application.DTOs.Tax;
using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FixMate.Infrastructure.Services.Tax;

public class TaxCalculationService : ITaxCalculationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<TaxCalculationService> _logger;

    public TaxCalculationService(AppDbContext context, ILogger<TaxCalculationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<GlobalTaxConfigDto> GetGlobalTaxConfigAsync(CancellationToken ct = default)
    {
        var settings = await _context.PlatformSettings.AsNoTracking().ToListAsync(ct);

        bool globalTaxEnabled = GetBoolSetting(settings, "GlobalTaxEnabled", true);
        decimal globalTaxRate = GetDecimalSetting(settings, "GlobalTaxRate", 18.00m);
        string calcType = GetStringSetting(settings, "TaxCalculationType", "Percentage");
        bool allowCustom = GetBoolSetting(settings, "AllowCustomTaxOverrides", true);
        bool taxOnPlatform = GetBoolSetting(settings, "TaxOnPlatformFee", false);
        bool taxOnExtra = GetBoolSetting(settings, "TaxOnExtraCharges", true);
        string supplierState = GetStringSetting(settings, "SupplierState", "Gujarat");
        string supplierGstin = GetStringSetting(settings, "SupplierGstin", "24AAACF1234F1Z5");
        string supplierLegalName = GetStringSetting(settings, "SupplierLegalName", "FixMate Home Solutions Private Limited");

        return new GlobalTaxConfigDto
        {
            GlobalTaxEnabled = globalTaxEnabled,
            GlobalTaxRate = globalTaxRate,
            TaxCalculationType = calcType,
            AllowCustomTaxOverrides = allowCustom,
            TaxOnPlatformFee = taxOnPlatform,
            TaxOnExtraCharges = taxOnExtra,
            SupplierState = supplierState,
            SupplierGstin = supplierGstin,
            SupplierLegalName = supplierLegalName
        };
    }

    public async Task<bool> UpdateGlobalTaxConfigAsync(GlobalTaxConfigDto dto, int? userId, string? userName, CancellationToken ct = default)
    {
        var oldConfig = await GetGlobalTaxConfigAsync(ct);

        await SetSettingAsync("GlobalTaxEnabled", dto.GlobalTaxEnabled.ToString().ToLowerInvariant(), "Whether Global Tax calculation is enabled across the platform", "boolean", ct);
        await SetSettingAsync("GlobalTaxRate", dto.GlobalTaxRate.ToString("F2"), "Default global tax rate percentage", "decimal", ct);
        await SetSettingAsync("TaxCalculationType", dto.TaxCalculationType, "Calculation mode for taxes: 'Percentage' or 'Fixed'", "string", ct);
        await SetSettingAsync("AllowCustomTaxOverrides", dto.AllowCustomTaxOverrides.ToString().ToLowerInvariant(), "Whether custom service/category tax rules override the global rule", "boolean", ct);
        await SetSettingAsync("TaxOnPlatformFee", dto.TaxOnPlatformFee.ToString().ToLowerInvariant(), "Whether platform/service charge is subject to customer tax base", "boolean", ct);
        await SetSettingAsync("TaxOnExtraCharges", dto.TaxOnExtraCharges.ToString().ToLowerInvariant(), "Whether approved extra charges are included in customer taxable base", "boolean", ct);
        await SetSettingAsync("SupplierState", dto.SupplierState, "Registered home state of supplier for GST place-of-supply resolution", "string", ct);
        await SetSettingAsync("SupplierGstin", dto.SupplierGstin, "FixMate registered GSTIN", "string", ct);
        await SetSettingAsync("SupplierLegalName", dto.SupplierLegalName, "FixMate registered entity name for Tax Invoices", "string", ct);

        // Update default global tax rule if present
        var defaultRule = await _context.TaxRules.FirstOrDefaultAsync(r => r.IsGlobalDefault, ct);
        if (defaultRule != null)
        {
            defaultRule.Rate = dto.GlobalTaxRate;
            defaultRule.CalculationType = string.Equals(dto.TaxCalculationType, "Fixed", StringComparison.OrdinalIgnoreCase) 
                ? TaxCalculationType.Fixed 
                : TaxCalculationType.Percentage;
            defaultRule.IsActive = dto.GlobalTaxEnabled;
            defaultRule.IncludePlatformFeeInBase = dto.TaxOnPlatformFee;
            defaultRule.IncludeExtraChargesInBase = dto.TaxOnExtraCharges;
            defaultRule.CgstRate = Math.Round(dto.GlobalTaxRate / 2, 2);
            defaultRule.SgstRate = Math.Round(dto.GlobalTaxRate / 2, 2);
            defaultRule.IgstRate = dto.GlobalTaxRate;
            defaultRule.UpdatedAt = DateTime.UtcNow;
        }

        // Add Audit Log
        _context.TaxAuditLogs.Add(new TaxAuditLog
        {
            TaxRuleId = defaultRule?.Id,
            Action = "ConfigChange",
            RuleName = "Global Tax Configuration",
            Details = $"Global tax settings modified. Rate: {dto.GlobalTaxRate}%, Enabled: {dto.GlobalTaxEnabled}, Mode: {dto.TaxCalculationType}",
            OldValueJson = JsonSerializer.Serialize(oldConfig),
            NewValueJson = JsonSerializer.Serialize(dto),
            PerformedByUserId = userId,
            PerformedByName = userName ?? "Administrator",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<TaxCalculationResult> CalculateTaxAsync(TaxCalculationRequest request, CancellationToken ct = default)
    {
        var globalConfig = await GetGlobalTaxConfigAsync(ct);
        var service = await _context.Services
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, ct);

        var result = new TaxCalculationResult
        {
            SupplierState = globalConfig.SupplierState,
            CustomerState = string.IsNullOrWhiteSpace(request.CustomerState) ? globalConfig.SupplierState : request.CustomerState.Trim()
        };

        // Determine inter-state supply for Indian GST
        bool isInterState = !string.Equals(result.SupplierState, result.CustomerState, StringComparison.OrdinalIgnoreCase);
        result.IsInterState = isInterState;
        result.PlaceOfSupply = $"{result.CustomerState} ({(isInterState ? "Inter-State" : "Intra-State")})";

        // Step 1: Check if custom override rule applies
        TaxRule? applicableRule = null;
        string appliedMode = "TaxDisabled";

        if (globalConfig.AllowCustomTaxOverrides && service != null)
        {
            // First check service-specific rule
            applicableRule = await _context.TaxRules
                .Where(r => r.IsActive && r.ServiceId == service.Id && r.EffectiveFrom <= DateTime.UtcNow && (!r.EffectiveTo.HasValue || r.EffectiveTo >= DateTime.UtcNow))
                .OrderByDescending(r => r.EffectiveFrom)
                .FirstOrDefaultAsync(ct);

            // Second check category-specific rule
            if (applicableRule == null && service.CategoryId > 0)
            {
                applicableRule = await _context.TaxRules
                    .Where(r => r.IsActive && r.CategoryId == service.CategoryId && r.EffectiveFrom <= DateTime.UtcNow && (!r.EffectiveTo.HasValue || r.EffectiveTo >= DateTime.UtcNow))
                    .OrderByDescending(r => r.EffectiveFrom)
                    .FirstOrDefaultAsync(ct);
            }

            if (applicableRule != null)
            {
                appliedMode = "CustomOverride";
            }
        }

        // Step 2: Fallback to Global Tax rule if no custom override matched
        if (applicableRule == null)
        {
            if (globalConfig.GlobalTaxEnabled)
            {
                applicableRule = await _context.TaxRules
                    .Where(r => r.IsActive && r.IsGlobalDefault && r.EffectiveFrom <= DateTime.UtcNow && (!r.EffectiveTo.HasValue || r.EffectiveTo >= DateTime.UtcNow))
                    .OrderByDescending(r => r.EffectiveFrom)
                    .FirstOrDefaultAsync(ct);

                if (applicableRule == null)
                {
                    // Synthesize default global rule from platform settings
                    applicableRule = new TaxRule
                    {
                        Name = $"Global Tax {globalConfig.GlobalTaxRate}%",
                        CalculationType = string.Equals(globalConfig.TaxCalculationType, "Fixed", StringComparison.OrdinalIgnoreCase) ? TaxCalculationType.Fixed : TaxCalculationType.Percentage,
                        Rate = globalConfig.GlobalTaxRate,
                        IsActive = true,
                        IsGlobalDefault = true,
                        IncludeServicePriceInBase = true,
                        IncludePlatformFeeInBase = globalConfig.TaxOnPlatformFee,
                        IncludeExtraChargesInBase = globalConfig.TaxOnExtraCharges,
                        GstTreatment = GstType.Standard,
                        HsnSacCode = "9987",
                        CgstRate = Math.Round(globalConfig.GlobalTaxRate / 2, 2),
                        SgstRate = Math.Round(globalConfig.GlobalTaxRate / 2, 2),
                        IgstRate = globalConfig.GlobalTaxRate
                    };
                }
                appliedMode = "Global";
            }
            else
            {
                appliedMode = "TaxDisabled";
            }
        }

        result.AppliedMode = appliedMode;

        // If tax disabled or no rule applicable
        if (applicableRule == null || !applicableRule.IsActive || appliedMode == "TaxDisabled")
        {
            result.TaxEnabled = false;
            result.TaxRuleName = "Tax Disabled / Exempt";
            result.TaxRate = 0.00m;
            result.TaxableBase = request.ServicePrice;
            result.TaxAmount = 0.00m;
            result.TotalPayable = request.ServicePrice + request.PlatformFee + request.ExtraCharges - request.DiscountAmount;
            result.Explanation = "Tax calculation is disabled or service is non-taxable under current configuration.";
            return result;
        }

        // Step 3: Compute Configurable Taxable Base
        decimal taxableBase = 0.00m;
        if (applicableRule.IncludeServicePriceInBase)
        {
            taxableBase += request.ServicePrice;
        }

        if (applicableRule.IncludePlatformFeeInBase)
        {
            taxableBase += request.PlatformFee;
        }

        if (applicableRule.IncludeExtraChargesInBase)
        {
            taxableBase += request.ExtraCharges;
        }

        // Subtract discount from taxable base if applicable, ensuring non-negative
        if (request.DiscountAmount > 0)
        {
            taxableBase = Math.Max(0.00m, taxableBase - request.DiscountAmount);
        }

        taxableBase = Math.Round(taxableBase, 2);

        // Step 4: Calculate Tax Amount
        decimal taxAmount = 0.00m;
        if (applicableRule.GstTreatment == GstType.ZeroRated || applicableRule.GstTreatment == GstType.Exempt || applicableRule.Rate == 0)
        {
            taxAmount = 0.00m;
            result.AppliedMode = "ZeroTax";
        }
        else if (applicableRule.CalculationType == TaxCalculationType.Fixed)
        {
            taxAmount = Math.Round(applicableRule.Rate, 2);
        }
        else // Percentage
        {
            taxAmount = Math.Round(taxableBase * (applicableRule.Rate / 100m), 2);
        }

        // Step 5: GST Components Breakdown (Intra vs Inter state)
        decimal cgstRate = 0.00m;
        decimal cgstAmount = 0.00m;
        decimal sgstRate = 0.00m;
        decimal sgstAmount = 0.00m;
        decimal igstRate = 0.00m;
        decimal igstAmount = 0.00m;

        if (applicableRule.GstTreatment == GstType.Standard && taxAmount > 0)
        {
            if (isInterState)
            {
                igstRate = applicableRule.IgstRate ?? applicableRule.Rate;
                igstAmount = taxAmount;
            }
            else
            {
                cgstRate = applicableRule.CgstRate ?? Math.Round(applicableRule.Rate / 2, 2);
                sgstRate = applicableRule.SgstRate ?? (applicableRule.Rate - cgstRate);
                cgstAmount = Math.Round(taxableBase * (cgstRate / 100m), 2);
                sgstAmount = taxAmount - cgstAmount; // Avoid 1 paisa rounding disparity
            }
        }

        result.TaxEnabled = true;
        result.AppliedTaxRuleId = applicableRule.Id > 0 ? applicableRule.Id : null;
        result.TaxRuleName = applicableRule.Name;
        result.CalculationType = applicableRule.CalculationType;
        result.TaxRate = applicableRule.Rate;
        result.TaxableBase = taxableBase;
        result.TaxAmount = taxAmount;
        result.GstTreatment = applicableRule.GstTreatment;
        result.HsnSacCode = applicableRule.HsnSacCode ?? "9987";
        result.CgstRate = cgstRate;
        result.CgstAmount = cgstAmount;
        result.SgstRate = sgstRate;
        result.SgstAmount = sgstAmount;
        result.IgstRate = igstRate;
        result.IgstAmount = igstAmount;

        // Final Payable: Service Price + Platform Fee + Extra Charges + Tax - Discount
        result.TotalPayable = Math.Round(request.ServicePrice + request.PlatformFee + request.ExtraCharges + taxAmount - request.DiscountAmount, 2);
        result.Explanation = appliedMode == "CustomOverride"
            ? $"Custom tax rule '{applicableRule.Name}' ({applicableRule.Rate}%) applied specifically to {service?.Name ?? "selected service"}."
            : $"Global tax rule '{applicableRule.Name}' ({applicableRule.Rate}%) applied.";

        return result;
    }

    public async Task<TaxReportSummaryDto> GetTaxReportSummaryAsync(DateTime? startDate, DateTime? endDate, int? serviceId, string? status, CancellationToken ct = default)
    {
        var query = _context.ServiceRequests
            .AsNoTracking()
            .Include(r => r.Service)
                .ThenInclude(s => s!.Category)
            .Include(r => r.Payment)
            .Where(r => r.TaxAmount > 0 || r.Status == RequestStatus.Paid || r.Status == RequestStatus.Completed);

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(r => r.CreatedAt >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(r => r.CreatedAt <= endUtc);
        }

        if (serviceId.HasValue && serviceId.Value > 0)
        {
            query = query.Where(r => r.ServiceId == serviceId.Value);
        }

        var list = await query.ToListAsync(ct);

        var summary = new TaxReportSummaryDto
        {
            TotalCollectedTax = list.Sum(r => r.TaxAmount),
            TotalTaxableAmount = list.Sum(r => r.TaxableBase > 0 ? r.TaxableBase : r.BaseAmount),
            TotalCgstAmount = list.Sum(r => r.CgstAmount),
            TotalSgstAmount = list.Sum(r => r.SgstAmount),
            TotalIgstAmount = list.Sum(r => r.IgstAmount),
            TotalInvoicedBookings = list.Count
        };

        summary.TaxByServices = list
            .GroupBy(r => new { r.ServiceId, ServiceName = r.Service?.Name ?? "Unknown", CategoryName = r.Service?.Category?.Name ?? "General" })
            .Select(g => new TaxByServiceDto
            {
                ServiceId = g.Key.ServiceId,
                ServiceName = g.Key.ServiceName,
                CategoryName = g.Key.CategoryName,
                BookingCount = g.Count(),
                TaxableAmount = g.Sum(r => r.TaxableBase > 0 ? r.TaxableBase : r.BaseAmount),
                TaxAmount = g.Sum(r => r.TaxAmount)
            })
            .OrderByDescending(s => s.TaxAmount)
            .ToList();

        summary.TaxByTypes = list
            .GroupBy(r => new { r.TaxRuleName, r.TaxRate })
            .Select(g => new TaxByTypeDto
            {
                TaxRuleName = string.IsNullOrEmpty(g.Key.TaxRuleName) ? "Standard Tax" : g.Key.TaxRuleName,
                Rate = g.Key.TaxRate,
                BookingCount = g.Count(),
                TaxCollected = g.Sum(r => r.TaxAmount)
            })
            .OrderByDescending(t => t.TaxCollected)
            .ToList();

        var paymentQuery = _context.Payments.AsNoTracking();
        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            paymentQuery = paymentQuery.Where(p => p.CreatedAt >= startUtc);
        }
        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            paymentQuery = paymentQuery.Where(p => p.CreatedAt <= endUtc);
        }

        var allPayments = await paymentQuery.ToListAsync(ct);
        summary.PaymentStatusBreakdown = allPayments
            .GroupBy(p => p.Status.ToString())
            .Select(g => new PaymentStatusCountDto
            {
                Status = g.Key,
                Count = g.Count(),
                TotalAmount = g.Sum(p => p.Amount)
            })
            .ToList();

        return summary;
    }

    private static bool GetBoolSetting(IEnumerable<PlatformSetting> settings, string key, bool def)
    {
        var s = settings.FirstOrDefault(x => x.Key == key);
        return s != null && bool.TryParse(s.Value, out var val) ? val : def;
    }

    private static decimal GetDecimalSetting(IEnumerable<PlatformSetting> settings, string key, decimal def)
    {
        var s = settings.FirstOrDefault(x => x.Key == key);
        return s != null && decimal.TryParse(s.Value, out var val) ? val : def;
    }

    private static string GetStringSetting(IEnumerable<PlatformSetting> settings, string key, string def)
    {
        var s = settings.FirstOrDefault(x => x.Key == key);
        return s != null && !string.IsNullOrWhiteSpace(s.Value) ? s.Value : def;
    }

    private async Task SetSettingAsync(string key, string value, string description, string dataType, CancellationToken ct)
    {
        var setting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == key, ct);
        if (setting == null)
        {
            _context.PlatformSettings.Add(new PlatformSetting
            {
                Key = key,
                Value = value,
                Description = description,
                DataType = dataType,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            setting.Value = value;
            setting.Description = description;
            setting.DataType = dataType;
            setting.UpdatedAt = DateTime.UtcNow;
        }
    }
}
