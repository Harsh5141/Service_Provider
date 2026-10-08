using FixMate.Application.DTOs.Locations;

namespace FixMate.Application.Interfaces.Services;

public interface IGeoLocationService
{
    /// <summary>
    /// Look up city, district, state, and coordinates for an Indian 6-digit PIN code.
    /// If expectedState is provided, validates that the PIN code belongs to that state.
    /// </summary>
    Task<PinLookupResponseDto> LookupPostalCodeAsync(string postalCode, string? expectedState = null, CancellationToken ct = default);

    /// <summary>
    /// Validates whether a 6-digit Indian PIN code corresponds to the selected State/UT.
    /// </summary>
    bool ValidatePinBelongsToState(string postalCode, string state);

    /// <summary>
    /// Calculates geographical distance between two coordinates in Kilometers using Haversine formula.
    /// </summary>
    decimal CalculateDistanceKm(decimal lat1, decimal lon1, decimal lat2, decimal lon2);

    /// <summary>
    /// Resolves approximate latitude/longitude for an Indian city or 6-digit PIN code if coordinates are not provided.
    /// </summary>
    (decimal Latitude, decimal Longitude)? GetApproximateCoordinates(string? city, string? postalCode);

    /// <summary>
    /// Estimates technician arrival time in minutes based on distance and city traffic factor.
    /// </summary>
    int EstimateArrivalMinutes(decimal distanceKm);
}
