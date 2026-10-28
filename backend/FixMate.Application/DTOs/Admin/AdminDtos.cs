using FixMate.Application.DTOs.Requests;
using FixMate.Domain.Enums;

namespace FixMate.Application.DTOs.Admin;

public class AdminDashboardStatsDto
{
    public int TotalCustomers { get; set; }
    public int TotalProviders { get; set; }
    public int ActiveRequests { get; set; }
    public int CompletedRequests { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalPlatformFeeRevenue { get; set; }
    public decimal TotalCommissionEarned { get; set; }
    public decimal TotalFixMateRevenue { get; set; }
    public decimal TotalProviderEarnings { get; set; }
    public decimal TotalRefunded { get; set; }
    public decimal PendingPayouts { get; set; }
    public int PendingProviderApprovals { get; set; }
    public int OpenComplaints { get; set; }
    public List<RevenueTrendDto> RevenueTrend { get; set; } = new();
    public List<ServiceRequestDto> RecentRequests { get; set; } = new();
    public List<ProviderSummaryDto> PendingProviders { get; set; } = new();
}

public class RevenueTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}

public class PlatformSettingDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DataType { get; set; } = "string";
}

public class UpdateSettingDto
{
    public string Value { get; set; } = string.Empty;
}

public class ProviderSummaryDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string Bio { get; set; } = string.Empty;
    public int ServiceRadiusKm { get; set; } = 15;
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? PrimaryCategory { get; set; }
    public List<string> Categories { get; set; } = new();
    public List<string> Skills { get; set; } = new();
    public ProviderStatus Status { get; set; }
    public decimal RatingAverage { get; set; }
    public int RatingCount { get; set; }
    public bool IsAvailable { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApproveProviderDto
{
    public int ProviderProfileId { get; set; }
    public bool Approve { get; set; }
    public string? Reason { get; set; }
}
