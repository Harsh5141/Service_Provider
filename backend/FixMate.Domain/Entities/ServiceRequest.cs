using FixMate.Domain.Common;
using FixMate.Domain.Enums;

namespace FixMate.Domain.Entities;

public class ServiceRequest : SoftDeletableEntity
{
    public string TrackingNumber { get; set; } = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    
    public int CustomerId { get; set; }
    public User? Customer { get; set; }

    public int? ProviderProfileId { get; set; }
    public ProviderProfile? ProviderProfile { get; set; }

    public int ServiceId { get; set; }
    public Service? Service { get; set; }

    public int AddressId { get; set; }
    public Address? Address { get; set; }

    public RequestStatus Status { get; set; } = RequestStatus.Created;
    public DateTime ScheduledDate { get; set; }
    public string TimeSlot { get; set; } = string.Empty;
    public string ProblemDescription { get; set; } = string.Empty;

    public decimal BaseAmount { get; set; }
    public decimal ExtraCharges { get; set; } = 0.00m;
    public decimal DiscountAmount { get; set; } = 0.00m;
    public decimal TotalAmount { get; set; }
    public DateTime? AssignedAt { get; set; }
    public decimal? DistanceKm { get; set; }

    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public int? CancelledByUserId { get; set; }

    public byte[]? RowVersion { get; set; }

    public ICollection<RequestMedia> Media { get; set; } = new List<RequestMedia>();
    public ICollection<RequestStatusHistory> StatusHistory { get; set; } = new List<RequestStatusHistory>();
    public Payment? Payment { get; set; }
    public Review? Review { get; set; }
    public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();
}

