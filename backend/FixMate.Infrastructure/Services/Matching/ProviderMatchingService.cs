using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FixMate.Infrastructure.Services.Matching;

public class ProviderMatchingService : IProviderMatchingService
{
    private readonly AppDbContext _context;
    private readonly IGeoLocationService _geoLocationService;
    private readonly ILogger<ProviderMatchingService> _logger;

    public ProviderMatchingService(
        AppDbContext context,
        IGeoLocationService geoLocationService,
        ILogger<ProviderMatchingService> logger)
    {
        _context = context;
        _geoLocationService = geoLocationService;
        _logger = logger;
    }

    public async Task<ProviderMatchResult?> FindBestMatchingProviderAsync(int serviceId, Address customerAddress, CancellationToken ct = default)
    {
        var candidates = await FindAllEligibleProvidersAsync(serviceId, customerAddress, ct);
        if (candidates.Count == 0)
        {
            _logger.LogInformation("No eligible matching service provider found for ServiceId: {ServiceId} at {City}, PIN: {PIN}",
                serviceId, customerAddress.City, customerAddress.PostalCode);
            return null;
        }

        // The candidates list is already sorted by highest suitability
        var bestCandidate = candidates.First();
        var provider = bestCandidate.ProviderProfile;
        var user = provider.User;

        var arrivalMinutes = _geoLocationService.EstimateArrivalMinutes(bestCandidate.DistanceKm);

        var matchReason = bestCandidate.SamePostalCode
            ? $"Exact PIN match ({customerAddress.PostalCode}) within {bestCandidate.DistanceKm:0.0} km"
            : bestCandidate.SameCity
                ? $"City match ({customerAddress.City}) within {bestCandidate.DistanceKm:0.0} km"
                : $"Nearest available specialist within {bestCandidate.DistanceKm:0.0} km";

        _logger.LogInformation("Best provider matched: ProviderId={ProviderId}, Name={Name}, Distance={Distance}km, Reason={Reason}",
            provider.Id, user?.Name, bestCandidate.DistanceKm, matchReason);

        return new ProviderMatchResult
        {
            ProviderProfileId = provider.Id,
            UserId = provider.UserId,
            ProviderName = user?.Name ?? "Service Partner",
            ProviderPhone = user?.Phone ?? string.Empty,
            RatingAverage = provider.RatingAverage,
            ExperienceYears = provider.ExperienceYears,
            DistanceKm = bestCandidate.DistanceKm,
            EstimatedArrivalMinutes = arrivalMinutes,
            MatchReason = matchReason
        };
    }

    public async Task<List<ProviderMatchCandidate>> FindAllEligibleProvidersAsync(int serviceId, Address customerAddress, CancellationToken ct = default)
    {
        // 1. Resolve Customer Coordinates (from entity or approximation)
        decimal custLat = customerAddress.Latitude ?? 0;
        decimal custLon = customerAddress.Longitude ?? 0;

        if (custLat == 0 && custLon == 0)
        {
            var approx = _geoLocationService.GetApproximateCoordinates(customerAddress.City, customerAddress.PostalCode);
            if (approx.HasValue)
            {
                custLat = approx.Value.Latitude;
                custLon = approx.Value.Longitude;
            }
        }

        // 2. Fetch all providers who are Approved (Active) and Available
        var allApprovedProviders = await _context.ProviderProfiles
            .AsNoTracking()
            .Include(p => p.User)
                .ThenInclude(u => u!.Addresses)
            .Include(p => p.Skills)
                .ThenInclude(s => s.Service)
            .Where(p => p.Status == ProviderStatus.Active && p.IsAvailable)
            .ToListAsync(ct);

        if (allApprovedProviders.Count == 0)
        {
            return new List<ProviderMatchCandidate>();
        }

        // 3. Find IDs of providers who are currently busy with conflicting active jobs
        var busyProviderProfileIds = await _context.ServiceRequests
            .AsNoTracking()
            .Where(r => r.ProviderProfileId.HasValue &&
                        (r.Status == RequestStatus.ProviderAssigned ||
                         r.Status == RequestStatus.ProviderAccepted ||
                         r.Status == RequestStatus.OnTheWay ||
                         r.Status == RequestStatus.InProgress))
            .Select(r => r.ProviderProfileId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var candidateList = new List<ProviderMatchCandidate>();

        foreach (var provider in allApprovedProviders)
        {
            // Filter 1: Check availability against busy requests
            if (busyProviderProfileIds.Contains(provider.Id))
            {
                continue;
            }

            // Filter 2: SERVICE / SKILL MATCH
            // Check if provider has explicit skill for serviceId or broad category match
            var hasSkill = provider.Skills.Any(s => s.ServiceId == serviceId);
            if (!hasSkill)
            {
                // Also check if provider bio or skill names contain relevant keywords for backward compatibility
                var service = await _context.Services.Include(s => s.Category).FirstOrDefaultAsync(s => s.Id == serviceId, ct);
                if (service != null)
                {
                    var serviceName = service.Name;
                    var catName = service.Category?.Name ?? string.Empty;

                    hasSkill = provider.Skills.Any(s =>
                        s.Service != null && (
                            s.Service.CategoryId == service.CategoryId ||
                            serviceName.Contains(s.Service.Name, StringComparison.OrdinalIgnoreCase) ||
                            s.Service.Name.Contains(serviceName, StringComparison.OrdinalIgnoreCase)
                        ));
                }
            }

            if (!hasSkill)
            {
                // Skill does not match - skip
                continue;
            }

            // Get provider's address
            var providerAddress = provider.User?.Addresses
                .OrderByDescending(a => a.IsDefault)
                .FirstOrDefault();

            var provCity = providerAddress?.City ?? string.Empty;
            var provPin = providerAddress?.PostalCode ?? string.Empty;

            var samePin = !string.IsNullOrWhiteSpace(customerAddress.PostalCode) &&
                          !string.IsNullOrWhiteSpace(provPin) &&
                          string.Equals(customerAddress.PostalCode.Trim(), provPin.Trim(), StringComparison.OrdinalIgnoreCase);

            var sameCity = !string.IsNullOrWhiteSpace(customerAddress.City) &&
                           !string.IsNullOrWhiteSpace(provCity) &&
                           string.Equals(customerAddress.City.Trim(), provCity.Trim(), StringComparison.OrdinalIgnoreCase);

            // Calculate Distance
            decimal provLat = providerAddress?.Latitude ?? 0;
            decimal provLon = providerAddress?.Longitude ?? 0;

            if (provLat == 0 && provLon == 0)
            {
                var approxProv = _geoLocationService.GetApproximateCoordinates(provCity, provPin);
                if (approxProv.HasValue)
                {
                    provLat = approxProv.Value.Latitude;
                    provLon = approxProv.Value.Longitude;
                }
            }

            decimal distanceKm;
            if (custLat != 0 && custLon != 0 && provLat != 0 && provLon != 0)
            {
                distanceKm = _geoLocationService.CalculateDistanceKm(custLat, custLon, provLat, provLon);
            }
            else
            {
                // Fallback distance estimation when coordinates unavailable
                if (samePin)
                {
                    distanceKm = 2.0m;
                }
                else if (sameCity)
                {
                    distanceKm = 6.5m;
                }
                else
                {
                    distanceKm = 25.0m;
                }
            }

            // Filter 3: SERVICE RADIUS RESTRICTION
            var effectiveRadius = provider.ServiceRadiusKm > 0 ? provider.ServiceRadiusKm : 15;
            if (distanceKm > effectiveRadius)
            {
                // Provider is outside their configured service radius
                continue;
            }

            // Composite Score for fine-grained ranking
            // Higher score = better match
            // Factors: Same PIN (+1000), Same City (+500), Distance penalty (-10 * distanceKm), Rating bonus (+20 * Rating)
            decimal score = 0;
            if (samePin) score += 1000m;
            if (sameCity) score += 500m;
            score -= (distanceKm * 10m);
            score += (provider.RatingAverage * 20m);
            score += (provider.ExperienceYears * 2m);

            candidateList.Add(new ProviderMatchCandidate
            {
                ProviderProfile = provider,
                DistanceKm = distanceKm,
                SamePostalCode = samePin,
                SameCity = sameCity,
                Score = score
            });
        }

        // Rank by Priority:
        // 1. Same PIN (descending)
        // 2. Same City (descending)
        // 3. Distance (ascending)
        // 4. Rating (descending)
        // 5. Experience (descending)
        var ranked = candidateList
            .OrderByDescending(c => c.SamePostalCode)
            .ThenByDescending(c => c.SameCity)
            .ThenBy(c => c.DistanceKm)
            .ThenByDescending(c => c.ProviderProfile.RatingAverage)
            .ThenByDescending(c => c.ProviderProfile.ExperienceYears)
            .ToList();

        return ranked;
    }
}
