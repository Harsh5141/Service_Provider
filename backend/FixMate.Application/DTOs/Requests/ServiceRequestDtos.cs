using FixMate.Domain.Enums;

namespace FixMate.Application.DTOs.Requests;

public class ServiceRequestDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;

    public int? ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public string? ProviderPhone { get; set; }
    public decimal? ProviderRating { get; set; }
    public int? ProviderExperienceYears { get; set; }

    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;

    public int? AddressId { get; set; }
    public string? AddressText { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }

    public int? ApplianceId { get; set; }
    public string? ApplianceName { get; set; }

    public RequestStatus Status { get; set; }
    public string StatusText => Status.ToString();

    public bool IsLocked { get; set; }
    public string? LockedByProviderName { get; set; }

    public decimal? DistanceKm { get; set; }
    public DateTime? AssignedAt { get; set; }
    public int? EstimatedArrivalMinutes { get; set; }
    public bool IsProviderAssigned => ProviderId.HasValue && ProviderId.Value > 0;

    public DateTime ScheduledDate { get; set; }
    public string PreferredTimeSlot { get; set; } = string.Empty;
    public string ProblemDescription { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
    public decimal? FinalCost { get; set; }
    public string? CancellationReason { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateServiceRequestDto
{
    public int ServiceId { get; set; }
    public int? AddressId { get; set; }
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public int? ApplianceId { get; set; }
    public int? ProviderProfileId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string PreferredTimeSlot { get; set; } = "Morning (9 AM - 12 PM)";
    public string ProblemDescription { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
}

public class UpdateRequestStatusDto
{
    public RequestStatus Status { get; set; }
    public string? Note { get; set; }
    public decimal? FinalCost { get; set; }
    public string? CancellationReason { get; set; }
}
