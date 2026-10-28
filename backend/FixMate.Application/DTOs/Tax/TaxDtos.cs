using FixMate.Domain.Entities;

namespace FixMate.Application.DTOs.Tax;

public class TaxCalculationRequest
{
    public int ServiceId { get; set; }
    public decimal ServicePrice { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal ExtraCharges { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? CustomerState { get; set; }
}

public class TaxCalculationResult
{
    public bool TaxEnabled { get; set; }
    public int? AppliedTaxRuleId { get; set; }
    public string TaxRuleName { get; set; } = "Exempt / No Tax";
    public TaxCalculationType CalculationType { get; set; } = TaxCalculationType.Percentage;
    public decimal TaxRate { get; set; }
    public decimal TaxableBase { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalPayable { get; set; }

    // Breakdown components (GST)
    public GstType GstTreatment { get; set; } = GstType.Standard;
    public string HsnSacCode { get; set; } = "9987";
    public bool IsInterState { get; set; }
    public string PlaceOfSupply { get; set; } = "Gujarat (24)";
    public string SupplierState { get; set; } = "Gujarat";
    public string CustomerState { get; set; } = "Gujarat";
    public decimal CgstRate { get; set; }
    public decimal CgstAmount { get; set; }
    public decimal SgstRate { get; set; }
    public decimal SgstAmount { get; set; }
    public decimal IgstRate { get; set; }
    public decimal IgstAmount { get; set; }

    // Applied mode info
    public string AppliedMode { get; set; } = "Global"; // "Global", "CustomOverride", "ZeroTax", "TaxDisabled"
    public string Explanation { get; set; } = string.Empty;
}

public class TaxRuleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CalculationType { get; set; } = "Percentage";
    public decimal Rate { get; set; }
    public bool IsActive { get; set; }
    public bool IsGlobalDefault { get; set; }

    public int? ServiceId { get; set; }
    public string? ServiceName { get; set; }

    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }

    public bool IncludeServicePriceInBase { get; set; } = true;
    public bool IncludePlatformFeeInBase { get; set; } = false;
    public bool IncludeExtraChargesInBase { get; set; } = true;

    public string GstTreatment { get; set; } = "Standard";
    public string? HsnSacCode { get; set; } = "9987";
    public decimal? CgstRate { get; set; }
    public decimal? SgstRate { get; set; }
    public decimal? IgstRate { get; set; }

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpsertTaxRuleDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CalculationType { get; set; } = "Percentage"; // "Percentage" or "Fixed"
    public decimal Rate { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsGlobalDefault { get; set; } = false;

    public int? ServiceId { get; set; }
    public int? CategoryId { get; set; }

    public bool IncludeServicePriceInBase { get; set; } = true;
    public bool IncludePlatformFeeInBase { get; set; } = false;
    public bool IncludeExtraChargesInBase { get; set; } = true;

    public string GstTreatment { get; set; } = "Standard"; // Standard, ZeroRated, Exempt
    public string? HsnSacCode { get; set; } = "9987";
    public decimal? CgstRate { get; set; }
    public decimal? SgstRate { get; set; }
    public decimal? IgstRate { get; set; }

    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class GlobalTaxConfigDto
{
    public bool GlobalTaxEnabled { get; set; } = true;
    public decimal GlobalTaxRate { get; set; } = 18.00m;
    public string TaxCalculationType { get; set; } = "Percentage";
    public bool AllowCustomTaxOverrides { get; set; } = true;
    public bool TaxOnPlatformFee { get; set; } = false;
    public bool TaxOnExtraCharges { get; set; } = true;
    public string SupplierState { get; set; } = "Gujarat";
    public string SupplierGstin { get; set; } = "24AAACF1234F1Z5";
    public string SupplierLegalName { get; set; } = "FixMate Home Solutions Private Limited";
}

public class TaxAuditLogDto
{
    public int Id { get; set; }
    public int? TaxRuleId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string OldValueJson { get; set; } = string.Empty;
    public string NewValueJson { get; set; } = string.Empty;
    public string? PerformedByName { get; set; }
    public DateTime Timestamp { get; set; }
}

public class TaxReportSummaryDto
{
    public decimal TotalCollectedTax { get; set; }
    public decimal TotalTaxableAmount { get; set; }
    public decimal TotalCgstAmount { get; set; }
    public decimal TotalSgstAmount { get; set; }
    public decimal TotalIgstAmount { get; set; }
    public int TotalInvoicedBookings { get; set; }

    public List<TaxByServiceDto> TaxByServices { get; set; } = new();
    public List<TaxByTypeDto> TaxByTypes { get; set; } = new();
    public List<PaymentStatusCountDto> PaymentStatusBreakdown { get; set; } = new();
}

public class TaxByServiceDto
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal TaxAmount { get; set; }
}

public class TaxByTypeDto
{
    public string TaxRuleName { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public int BookingCount { get; set; }
    public decimal TaxCollected { get; set; }
}

public class PaymentStatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
}
