using FixMate.Domain.Enums;
using FixMate.Application.DTOs.Requests;

namespace FixMate.Application.DTOs.Provider;

public class ProviderDashboardDto
{
    public int ProviderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal RatingAverage { get; set; }
    public int RatingCount { get; set; }
    public bool IsAvailable { get; set; }
    public decimal TodayEarnings { get; set; }
    public decimal TotalEarnings { get; set; }
    public int CompletedJobsCount { get; set; }
    public int ActiveJobsCount { get; set; }
    public List<ServiceRequestDto> IncomingRequests { get; set; } = new();
    public List<ServiceRequestDto> ActiveRequests { get; set; } = new();
    public List<ServiceRequestDto> RecentCompletedRequests { get; set; } = new();
}

public class UpdateAvailabilityDto
{
    public bool IsAvailable { get; set; }
}

public class CancelJobDto
{
    public string? Reason { get; set; }
}

public class ProviderProfileDetailsDto
{
    public int ProviderId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public decimal RatingAverage { get; set; }
    public int RatingCount { get; set; }
    public bool IsAvailable { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ServiceRadiusKm { get; set; }
    
    // Address
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    
    // Categories & Skills
    public int SelectedCategoryId { get; set; }
    public List<string> Skills { get; set; } = new();
    public List<int> SkillIds { get; set; } = new();
}

public class UpdateProviderProfileDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public int ServiceRadiusKm { get; set; }
    
    // Address
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    
    // Category & Skills
    public int? CategoryId { get; set; }
    public List<int>? SkillIds { get; set; }
    public List<string>? Skills { get; set; }
}

public class PublicProviderDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public int ServiceRadiusKm { get; set; }
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public decimal RatingAverage { get; set; }
    public int RatingCount { get; set; }
    public int CompletedJobsCount { get; set; }
    public bool IsAvailable { get; set; }
    public List<string> Skills { get; set; } = new();
    public List<string> CategoryNames { get; set; } = new();
    public int CategoryId { get; set; }
}


