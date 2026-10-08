using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class Service : SoftDeletableEntity
{
    public int CategoryId { get; set; }
    public ServiceCategory? Category { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int EstimatedDurationMinutes { get; set; } = 60;
    public bool IsActive { get; set; } = true;
    public string? ImageUrl { get; set; }

    public ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
    public ICollection<ProviderSkill> ProviderSkills { get; set; } = new List<ProviderSkill>();
}

