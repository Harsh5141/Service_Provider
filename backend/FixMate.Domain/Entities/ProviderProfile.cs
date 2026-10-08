using FixMate.Domain.Common;
using FixMate.Domain.Enums;

namespace FixMate.Domain.Entities;

public class ProviderProfile : BaseEntity
{
    public int UserId { get; set; }
    public User? User { get; set; }

    public string Bio { get; set; } = string.Empty;
    public int ExperienceYears { get; set; } = 0;
    public decimal RatingAverage { get; set; } = 5.0m;
    public int RatingCount { get; set; } = 0;
    public ProviderStatus Status { get; set; } = ProviderStatus.PendingApproval;
    public bool IsAvailable { get; set; } = true;
    public int ServiceRadiusKm { get; set; } = 15; // Service radius in KM
    public decimal CommissionRate { get; set; } = 0.15m; // 15% platform commission

    public ICollection<ProviderSkill> Skills { get; set; } = new List<ProviderSkill>();
    public ICollection<ProviderDocument> Documents { get; set; } = new List<ProviderDocument>();
    public ICollection<ServiceRequest> AssignedRequests { get; set; } = new List<ServiceRequest>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

