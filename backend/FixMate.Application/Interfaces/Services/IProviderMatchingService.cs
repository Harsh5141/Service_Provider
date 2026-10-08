using FixMate.Domain.Entities;

namespace FixMate.Application.Interfaces.Services;

public class ProviderMatchResult
{
    public int ProviderProfileId { get; set; }
    public int UserId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderPhone { get; set; } = string.Empty;
    public decimal RatingAverage { get; set; }
    public int ExperienceYears { get; set; }
    public decimal DistanceKm { get; set; }
    public int EstimatedArrivalMinutes { get; set; }
    public string MatchReason { get; set; } = string.Empty;
}

public class ProviderMatchCandidate
{
    public ProviderProfile ProviderProfile { get; set; } = null!;
    public decimal DistanceKm { get; set; }
    public bool SamePostalCode { get; set; }
    public bool SameCity { get; set; }
    public decimal Score { get; set; }
}

public interface IProviderMatchingService
{
    /// <summary>
    /// Finds the nearest, most suitable and available active service provider matching the requested service and location.
    /// Follows priority:
    /// 1. Skill Match
    /// 2. Approved (Active)
    /// 3. Available (not busy)
    /// 4. Same PIN code
    /// 5. Same City
    /// 6. Distance (Haversine)
    /// 7. Within Service Radius
    /// 8. Provider Rating
    /// </summary>
    Task<ProviderMatchResult?> FindBestMatchingProviderAsync(int serviceId, Address customerAddress, CancellationToken ct = default);

    /// <summary>
    /// Returns all eligible ranked candidates for a given service and location.
    /// </summary>
    Task<List<ProviderMatchCandidate>> FindAllEligibleProvidersAsync(int serviceId, Address customerAddress, CancellationToken ct = default);
}
