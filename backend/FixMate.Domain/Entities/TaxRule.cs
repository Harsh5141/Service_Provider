using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public enum TaxCalculationType
{
    Percentage = 1,
    Fixed = 2
}

public enum TaxMode
{
    Global = 1,
    Custom = 2
}

public enum GstType
{
    None = 0,
    Standard = 1, // Auto splits into CGST + SGST (intra-state) or IGST (inter-state)
    ZeroRated = 2,
    Exempt = 3
}

public class TaxRule : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaxCalculationType CalculationType { get; set; } = TaxCalculationType.Percentage;
    public decimal Rate { get; set; } // e.g. 18 for 18% or fixed amount
    public bool IsActive { get; set; } = true;
    public bool IsGlobalDefault { get; set; } = false;

    // Scope: ServiceId or CategoryId override (Customizable Tax Mode)
    public int? ServiceId { get; set; }
    public Service? Service { get; set; }

    public int? CategoryId { get; set; }
    public ServiceCategory? Category { get; set; }

    // Configurable Taxable Base: whether platform fee or additional charges are included in taxable base
    public bool IncludeServicePriceInBase { get; set; } = true;
    public bool IncludePlatformFeeInBase { get; set; } = false; // By default commission / platform fee separate
    public bool IncludeExtraChargesInBase { get; set; } = true;

    // GST & India Tax Support
    public GstType GstTreatment { get; set; } = GstType.Standard;
    public string? HsnSacCode { get; set; } = "9987"; // Standard SAC for Maintenance & Repair Services
    public decimal? CgstRate { get; set; } // e.g. 9.00
    public decimal? SgstRate { get; set; } // e.g. 9.00
    public decimal? IgstRate { get; set; } // e.g. 18.00

    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveTo { get; set; }

    public ICollection<TaxAuditLog> AuditLogs { get; set; } = new List<TaxAuditLog>();
}
