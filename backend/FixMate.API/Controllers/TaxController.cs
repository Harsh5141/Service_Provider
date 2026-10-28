using System.Security.Claims;
using System.Text.Json;
using FixMate.Application.Common;
using FixMate.Application.DTOs.Tax;
using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using FixMate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TaxController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITaxCalculationService _taxService;
    private readonly ILogger<TaxController> _logger;

    public TaxController(
        AppDbContext context,
        ITaxCalculationService taxService,
        ILogger<TaxController> logger)
    {
        _context = context;
        _taxService = taxService;
        _logger = logger;
    }

    /// <summary>
    /// Calculate real-time tax breakdown for booking/checkout. Open to authenticated and guest customers.
    /// Never trust frontend tax amounts.
    /// </summary>
    [HttpPost("calculate")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TaxCalculationResult>>> CalculateTax([FromBody] TaxCalculationRequest request, CancellationToken ct)
    {
        if (request == null || request.ServiceId <= 0)
        {
            return BadRequest(ApiResponse<TaxCalculationResult>.Fail("Valid ServiceId is required for tax calculation."));
        }

        var result = await _taxService.CalculateTaxAsync(request, ct);
        return Ok(ApiResponse<TaxCalculationResult>.Ok(result, "Tax calculated successfully."));
    }

    /// <summary>
    /// Get current Global Tax Configuration.
    /// </summary>
    [HttpGet("config")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<GlobalTaxConfigDto>>> GetGlobalConfig(CancellationToken ct)
    {
        var config = await _taxService.GetGlobalTaxConfigAsync(ct);
        return Ok(ApiResponse<GlobalTaxConfigDto>.Ok(config, "Global tax configuration retrieved."));
    }

    /// <summary>
    /// Update Global Tax Configuration with audit trail.
    /// </summary>
    [HttpPut("config")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateGlobalConfig([FromBody] GlobalTaxConfigDto dto, CancellationToken ct)
    {
        if (dto.GlobalTaxRate < 0 || dto.GlobalTaxRate > 100)
        {
            return BadRequest(ApiResponse<bool>.Fail("Global tax rate must be between 0% and 100%."));
        }

        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);

        await _taxService.UpdateGlobalTaxConfigAsync(dto, userId, user?.Name, ct);
        return Ok(ApiResponse<bool>.Ok(true, "Global tax settings updated successfully."));
    }

    /// <summary>
    /// List all tax rules (Global and Custom) with service & category names.
    /// </summary>
    [HttpGet("rules")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<TaxRuleDto>>>> GetTaxRules(CancellationToken ct)
    {
        var rules = await _context.TaxRules
            .AsNoTracking()
            .Include(r => r.Service)
            .Include(r => r.Category)
            .OrderByDescending(r => r.IsGlobalDefault)
            .ThenByDescending(r => r.CreatedAt)
            .Select(r => new TaxRuleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                CalculationType = r.CalculationType.ToString(),
                Rate = r.Rate,
                IsActive = r.IsActive,
                IsGlobalDefault = r.IsGlobalDefault,
                ServiceId = r.ServiceId,
                ServiceName = r.Service != null ? r.Service.Name : null,
                CategoryId = r.CategoryId,
                CategoryName = r.Category != null ? r.Category.Name : null,
                IncludeServicePriceInBase = r.IncludeServicePriceInBase,
                IncludePlatformFeeInBase = r.IncludePlatformFeeInBase,
                IncludeExtraChargesInBase = r.IncludeExtraChargesInBase,
                GstTreatment = r.GstTreatment.ToString(),
                HsnSacCode = r.HsnSacCode,
                CgstRate = r.CgstRate,
                SgstRate = r.SgstRate,
                IgstRate = r.IgstRate,
                EffectiveFrom = r.EffectiveFrom,
                EffectiveTo = r.EffectiveTo,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<TaxRuleDto>>.Ok(rules, "Tax rules retrieved successfully."));
    }

    /// <summary>
    /// Create a new custom or category-level tax rule.
    /// </summary>
    [HttpPost("rules")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<TaxRuleDto>>> CreateTaxRule([FromBody] UpsertTaxRuleDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(ApiResponse<TaxRuleDto>.Fail("Tax rule name is required."));
        }

        if (dto.Rate < 0)
        {
            return BadRequest(ApiResponse<TaxRuleDto>.Fail("Tax rate cannot be negative."));
        }

        var calcType = string.Equals(dto.CalculationType, "Fixed", StringComparison.OrdinalIgnoreCase)
            ? TaxCalculationType.Fixed
            : TaxCalculationType.Percentage;

        var gstType = GstType.Standard;
        if (Enum.TryParse<GstType>(dto.GstTreatment, true, out var parsedGst))
        {
            gstType = parsedGst;
        }

        var rule = new TaxRule
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            CalculationType = calcType,
            Rate = dto.Rate,
            IsActive = dto.IsActive,
            IsGlobalDefault = dto.IsGlobalDefault,
            ServiceId = dto.ServiceId > 0 ? dto.ServiceId : null,
            CategoryId = dto.CategoryId > 0 ? dto.CategoryId : null,
            IncludeServicePriceInBase = dto.IncludeServicePriceInBase,
            IncludePlatformFeeInBase = dto.IncludePlatformFeeInBase,
            IncludeExtraChargesInBase = dto.IncludeExtraChargesInBase,
            GstTreatment = gstType,
            HsnSacCode = string.IsNullOrWhiteSpace(dto.HsnSacCode) ? "9987" : dto.HsnSacCode.Trim(),
            CgstRate = dto.CgstRate ?? (calcType == TaxCalculationType.Percentage ? Math.Round(dto.Rate / 2, 2) : 0m),
            SgstRate = dto.SgstRate ?? (calcType == TaxCalculationType.Percentage ? Math.Round(dto.Rate / 2, 2) : 0m),
            IgstRate = dto.IgstRate ?? dto.Rate,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.UtcNow,
            EffectiveTo = dto.EffectiveTo,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TaxRules.Add(rule);
        await _context.SaveChangesAsync(ct);

        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);

        // Audit Trail
        _context.TaxAuditLogs.Add(new TaxAuditLog
        {
            TaxRuleId = rule.Id,
            Action = "Create",
            RuleName = rule.Name,
            Details = $"Created tax rule '{rule.Name}' with rate {rule.Rate}% ({rule.CalculationType}).",
            OldValueJson = "{}",
            NewValueJson = JsonSerializer.Serialize(dto),
            PerformedByUserId = userId,
            PerformedByName = user?.Name ?? "Administrator",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<TaxRuleDto>.Ok(new TaxRuleDto
        {
            Id = rule.Id,
            Name = rule.Name,
            Description = rule.Description,
            CalculationType = rule.CalculationType.ToString(),
            Rate = rule.Rate,
            IsActive = rule.IsActive,
            IsGlobalDefault = rule.IsGlobalDefault,
            ServiceId = rule.ServiceId,
            CategoryId = rule.CategoryId,
            EffectiveFrom = rule.EffectiveFrom,
            CreatedAt = rule.CreatedAt,
            UpdatedAt = rule.UpdatedAt
        }, "Tax rule created successfully."));
    }

    /// <summary>
    /// Update an existing tax rule.
    /// </summary>
    [HttpPut("rules/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateTaxRule(int id, [FromBody] UpsertTaxRuleDto dto, CancellationToken ct)
    {
        var rule = await _context.TaxRules.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (rule == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Tax rule not found.", 404));
        }

        var oldStateJson = JsonSerializer.Serialize(new
        {
            rule.Name,
            rule.Rate,
            rule.IsActive,
            rule.CalculationType,
            rule.ServiceId,
            rule.CategoryId
        });

        rule.Name = dto.Name.Trim();
        rule.Description = dto.Description?.Trim() ?? string.Empty;
        rule.CalculationType = string.Equals(dto.CalculationType, "Fixed", StringComparison.OrdinalIgnoreCase)
            ? TaxCalculationType.Fixed
            : TaxCalculationType.Percentage;
        rule.Rate = dto.Rate;
        rule.IsActive = dto.IsActive;
        rule.IsGlobalDefault = dto.IsGlobalDefault;
        rule.ServiceId = dto.ServiceId > 0 ? dto.ServiceId : null;
        rule.CategoryId = dto.CategoryId > 0 ? dto.CategoryId : null;
        rule.IncludeServicePriceInBase = dto.IncludeServicePriceInBase;
        rule.IncludePlatformFeeInBase = dto.IncludePlatformFeeInBase;
        rule.IncludeExtraChargesInBase = dto.IncludeExtraChargesInBase;

        if (Enum.TryParse<GstType>(dto.GstTreatment, true, out var parsedGst))
        {
            rule.GstTreatment = parsedGst;
        }

        rule.HsnSacCode = string.IsNullOrWhiteSpace(dto.HsnSacCode) ? "9987" : dto.HsnSacCode.Trim();
        rule.CgstRate = dto.CgstRate;
        rule.SgstRate = dto.SgstRate;
        rule.IgstRate = dto.IgstRate;
        if (dto.EffectiveFrom.HasValue) rule.EffectiveFrom = dto.EffectiveFrom.Value;
        rule.EffectiveTo = dto.EffectiveTo;
        rule.UpdatedAt = DateTime.UtcNow;

        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);

        _context.TaxAuditLogs.Add(new TaxAuditLog
        {
            TaxRuleId = rule.Id,
            Action = "Update",
            RuleName = rule.Name,
            Details = $"Updated tax rule '{rule.Name}'. Rate: {rule.Rate}%, Active: {rule.IsActive}",
            OldValueJson = oldStateJson,
            NewValueJson = JsonSerializer.Serialize(dto),
            PerformedByUserId = userId,
            PerformedByName = user?.Name ?? "Administrator",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, "Tax rule updated successfully."));
    }

    /// <summary>
    /// Toggle tax rule active status.
    /// </summary>
    [HttpPatch("rules/{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleTaxRuleStatus(int id, CancellationToken ct)
    {
        var rule = await _context.TaxRules.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (rule == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Tax rule not found.", 404));
        }

        rule.IsActive = !rule.IsActive;
        rule.UpdatedAt = DateTime.UtcNow;

        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);

        _context.TaxAuditLogs.Add(new TaxAuditLog
        {
            TaxRuleId = rule.Id,
            Action = rule.IsActive ? "Activate" : "Deactivate",
            RuleName = rule.Name,
            Details = $"Tax rule '{rule.Name}' status toggled to {(rule.IsActive ? "Active" : "Inactive")}",
            OldValueJson = JsonSerializer.Serialize(new { IsActive = !rule.IsActive }),
            NewValueJson = JsonSerializer.Serialize(new { IsActive = rule.IsActive }),
            PerformedByUserId = userId,
            PerformedByName = user?.Name ?? "Administrator",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(rule.IsActive, $"Tax rule is now {(rule.IsActive ? "Active" : "Inactive")}."));
    }

    /// <summary>
    /// Soft delete tax rule.
    /// </summary>
    [HttpDelete("rules/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteTaxRule(int id, CancellationToken ct)
    {
        var rule = await _context.TaxRules.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (rule == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Tax rule not found.", 404));
        }

        if (rule.IsGlobalDefault)
        {
            return BadRequest(ApiResponse<bool>.Fail("Default global tax rule cannot be deleted. You may disable Global Tax in settings instead."));
        }

        rule.IsDeleted = true;
        rule.DeletedAt = DateTime.UtcNow;
        rule.IsActive = false;

        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);

        _context.TaxAuditLogs.Add(new TaxAuditLog
        {
            TaxRuleId = rule.Id,
            Action = "Delete",
            RuleName = rule.Name,
            Details = $"Tax rule '{rule.Name}' deleted by admin.",
            OldValueJson = JsonSerializer.Serialize(new { rule.Name, rule.Rate }),
            NewValueJson = "{}",
            PerformedByUserId = userId,
            PerformedByName = user?.Name ?? "Administrator",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, "Tax rule deleted successfully."));
    }

    /// <summary>
    /// View tax modification audit logs.
    /// </summary>
    [HttpGet("audit-logs")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<TaxAuditLogDto>>>> GetAuditLogs([FromQuery] int? ruleId, CancellationToken ct)
    {
        var query = _context.TaxAuditLogs.AsNoTracking();
        if (ruleId.HasValue && ruleId.Value > 0)
        {
            query = query.Where(a => a.TaxRuleId == ruleId.Value);
        }

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Take(100)
            .Select(a => new TaxAuditLogDto
            {
                Id = a.Id,
                TaxRuleId = a.TaxRuleId,
                Action = a.Action,
                RuleName = a.RuleName,
                Details = a.Details,
                OldValueJson = a.OldValueJson,
                NewValueJson = a.NewValueJson,
                PerformedByName = a.PerformedByName,
                Timestamp = a.Timestamp
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<TaxAuditLogDto>>.Ok(logs, "Audit logs retrieved."));
    }

    /// <summary>
    /// Financial tax statistics & report breakdown for Admin Dashboard.
    /// </summary>
    [HttpGet("reports/summary")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<TaxReportSummaryDto>>> GetTaxReportSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int? serviceId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var summary = await _taxService.GetTaxReportSummaryAsync(startDate, endDate, serviceId, status, ct);
        return Ok(ApiResponse<TaxReportSummaryDto>.Ok(summary, "Tax report summary generated."));
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }
}
