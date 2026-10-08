using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class ServiceHistory : BaseEntity
{
    public int ApplianceId { get; set; }
    public Appliance? Appliance { get; set; }

    public int? ServiceRequestId { get; set; }
    public ServiceRequest? ServiceRequest { get; set; }

    public string ServiceDone { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public string? ProviderName { get; set; }
    public int? ProviderId { get; set; }
    public DateTime ServiceDate { get; set; }
    public DateTime NextServiceRecommendedDate { get; set; }
    public bool ReminderSent { get; set; } = false;
    public string? Notes { get; set; }
}

