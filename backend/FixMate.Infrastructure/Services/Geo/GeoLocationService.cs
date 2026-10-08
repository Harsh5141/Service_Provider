using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using FixMate.Application.DTOs.Locations;
using FixMate.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace FixMate.Infrastructure.Services.Geo;

public class GeoLocationService : IGeoLocationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeoLocationService> _logger;
    private static readonly ConcurrentDictionary<string, PinLookupResponseDto> PinCache = new(StringComparer.OrdinalIgnoreCase);

    public GeoLocationService(HttpClient httpClient, ILogger<GeoLocationService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _httpClient.Timeout = TimeSpan.FromSeconds(5);
    }

    public GeoLocationService(ILogger<GeoLocationService> logger) : this(new HttpClient(), logger)
    {
    }

    // Comprehensive prefix ranges mapping 2-digit and 3-digit prefixes to States/UTs and default districts/cities
    private static readonly List<(int StartPrefix, int EndPrefix, string State, string DefaultCity)> PinPrefixRanges = new()
    {
        // Delhi & Northern Circle
        (11, 11, "Delhi", "New Delhi"),
        (12, 13, "Haryana", "Gurugram"),
        (14, 15, "Punjab", "Ludhiana"),
        (16, 16, "Chandigarh", "Chandigarh"),
        (17, 17, "Himachal Pradesh", "Shimla"),
        (18, 19, "Jammu and Kashmir", "Srinagar"),
        (19, 19, "Ladakh", "Leh"),

        // Uttar Pradesh & Uttarakhand
        (20, 23, "Uttar Pradesh", "Kanpur"),
        (24, 25, "Uttar Pradesh", "Meerut"),
        (26, 28, "Uttar Pradesh", "Lucknow"),
        (24, 26, "Uttarakhand", "Dehradun"),

        // Rajasthan
        (30, 34, "Rajasthan", "Jaipur"),

        // Gujarat, Daman & Diu, Dadra & Nagar Haveli
        (36, 39, "Gujarat", "Ahmedabad"),
        (39, 39, "Dadra and Nagar Haveli and Daman and Diu", "Daman"),

        // Maharashtra & Goa
        (40, 44, "Maharashtra", "Mumbai"),
        (40, 40, "Goa", "Panaji"),

        // Madhya Pradesh & Chhattisgarh
        (45, 48, "Madhya Pradesh", "Indore"),
        (49, 49, "Chhattisgarh", "Raipur"),

        // Andhra Pradesh & Telangana
        (50, 50, "Telangana", "Hyderabad"),
        (51, 53, "Andhra Pradesh", "Visakhapatnam"),

        // Karnataka
        (56, 59, "Karnataka", "Bengaluru"),

        // Tamil Nadu & Puducherry
        (60, 64, "Tamil Nadu", "Chennai"),
        (60, 60, "Puducherry", "Puducherry"),

        // Kerala & Lakshadweep
        (67, 69, "Kerala", "Kochi"),
        (68, 68, "Lakshadweep", "Kavaratti"),

        // West Bengal & North East
        (70, 74, "West Bengal", "Kolkata"),
        (74, 74, "Andaman and Nicobar Islands", "Port Blair"),
        (75, 77, "Odisha", "Bhubaneswar"),
        (78, 78, "Assam", "Guwahati"),
        (79, 79, "Arunachal Pradesh", "Itanagar"),
        (79, 79, "Manipur", "Imphal"),
        (79, 79, "Meghalaya", "Shillong"),
        (79, 79, "Mizoram", "Aizawl"),
        (79, 79, "Nagaland", "Kohima"),
        (79, 79, "Tripura", "Agartala"),
        (73, 73, "Sikkim", "Gangtok"),

        // Bihar & Jharkhand
        (80, 85, "Bihar", "Patna"),
        (81, 83, "Jharkhand", "Ranchi"),
        (84, 85, "Bihar", "Muzaffarpur")
    };

    // Specific 3-digit district mapping
    private static readonly Dictionary<string, (string District, string State)> SpecificPrefixMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "396", ("Valsad", "Gujarat") },
        { "395", ("Surat", "Gujarat") },
        { "394", ("Surat", "Gujarat") },
        { "390", ("Vadodara", "Gujarat") },
        { "380", ("Ahmedabad", "Gujarat") },
        { "382", ("Gandhinagar", "Gujarat") },
        { "360", ("Rajkot", "Gujarat") },
        { "361", ("Jamnagar", "Gujarat") },
        { "364", ("Bhavnagar", "Gujarat") },
        { "388", ("Anand", "Gujarat") },
        { "392", ("Bharuch", "Gujarat") },
        { "396191", ("Vapi", "Gujarat") },
        { "396195", ("Vapi", "Gujarat") },
        { "400", ("Mumbai", "Maharashtra") },
        { "401", ("Thane", "Maharashtra") },
        { "411", ("Pune", "Maharashtra") },
        { "412", ("Pune", "Maharashtra") },
        { "422", ("Nashik", "Maharashtra") },
        { "431", ("Aurangabad", "Maharashtra") },
        { "440", ("Nagpur", "Maharashtra") },
        { "416", ("Kolhapur", "Maharashtra") },
        { "110", ("New Delhi", "Delhi") },
        { "122", ("Gurugram", "Haryana") },
        { "201", ("Noida", "Uttar Pradesh") },
        { "226", ("Lucknow", "Uttar Pradesh") },
        { "302", ("Jaipur", "Rajasthan") },
        { "560", ("Bengaluru", "Karnataka") },
        { "600", ("Chennai", "Tamil Nadu") },
        { "500", ("Hyderabad", "Telangana") },
        { "700", ("Kolkata", "West Bengal") },
        { "800", ("Patna", "Bihar") },
        { "682", ("Kochi", "Kerala") },
        { "403", ("North Goa", "Goa") },
        { "160", ("Chandigarh", "Chandigarh") }
    };

    private static readonly Dictionary<string, (decimal Lat, decimal Lon)> KnownCityCoordinates = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Valsad", (20.6139m, 72.9342m) },
        { "Vapi", (20.3893m, 72.9106m) },
        { "Navsari", (20.9467m, 72.9520m) },
        { "Surat", (21.1702m, 72.8311m) },
        { "Ahmedabad", (23.0225m, 72.5714m) },
        { "Vadodara", (22.3072m, 73.1812m) },
        { "Rajkot", (22.3039m, 70.8022m) },
        { "Gandhinagar", (23.2156m, 72.6369m) },
        { "Mumbai", (19.0760m, 72.8777m) },
        { "Thane", (19.2183m, 72.9781m) },
        { "Pune", (18.5204m, 73.8567m) },
        { "Nagpur", (21.1458m, 79.0882m) },
        { "Nashik", (19.9975m, 73.7898m) },
        { "Delhi", (28.6139m, 77.2090m) },
        { "New Delhi", (28.6139m, 77.2090m) },
        { "Bengaluru", (12.9716m, 77.5946m) },
        { "Bangalore", (12.9716m, 77.5946m) },
        { "Hyderabad", (17.3850m, 78.4867m) },
        { "Chennai", (13.0827m, 80.2707m) },
        { "Kolkata", (22.5726m, 88.3639m) },
        { "Jaipur", (26.9124m, 75.7873m) },
        { "Chandigarh", (30.7333m, 76.7794m) },
        { "Lucknow", (26.8467m, 80.9462m) },
        { "Indore", (22.7196m, 75.8577m) },
        { "Kochi", (9.9312m, 76.2673m) },
        { "Panaji", (15.4909m, 73.8278m) }
    };

    public async Task<PinLookupResponseDto> LookupPostalCodeAsync(string postalCode, string? expectedState = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(postalCode))
        {
            return new PinLookupResponseDto
            {
                IsValid = false,
                ErrorMessage = "PIN Code is required"
            };
        }

        var cleanPin = postalCode.Trim();

        if (!Regex.IsMatch(cleanPin, @"^[1-9][0-9]{5}$"))
        {
            return new PinLookupResponseDto
            {
                IsValid = false,
                PostalCode = cleanPin,
                ErrorMessage = "Enter a valid 6-digit PIN Code"
            };
        }

        // Check Cache first
        if (PinCache.TryGetValue(cleanPin, out var cached))
        {
            return ValidateExpectedState(cached, expectedState);
        }

        // 1. Try public postal PIN code API
        try
        {
            var url = $"https://api.postalpincode.in/pincode/{cleanPin}";
            var response = await _httpClient.GetAsync(url, ct);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(ct);
                var doc = JsonSerializer.Deserialize<List<PostalApiResponse>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (doc != null && doc.Count > 0 && string.Equals(doc[0].Status, "Success", StringComparison.OrdinalIgnoreCase) && doc[0].PostOffice != null && doc[0].PostOffice!.Count > 0)
                {
                    var po = doc[0].PostOffice![0];
                    var district = !string.IsNullOrWhiteSpace(po.District) ? po.District : po.Name;
                    var state = po.State;
                    var postOffices = doc[0].PostOffice!.Select(p => p.Name).Distinct().ToList();

                    var coords = GetApproximateCoordinates(district, cleanPin);

                    var result = new PinLookupResponseDto
                    {
                        IsValid = true,
                        PostalCode = cleanPin,
                        City = district,
                        District = district,
                        State = NormalizeStateName(state),
                        Latitude = coords?.Latitude,
                        Longitude = coords?.Longitude,
                        PostOffices = postOffices
                    };

                    PinCache[cleanPin] = result;
                    return ValidateExpectedState(result, expectedState);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Public PIN code API lookup failed for {PostalCode}. Falling back to internal directory.", cleanPin);
        }

        // 2. Fallback to comprehensive built-in directory
        var fallback = ResolveFallbackPin(cleanPin);
        if (fallback != null)
        {
            PinCache[cleanPin] = fallback;
            return ValidateExpectedState(fallback, expectedState);
        }

        return new PinLookupResponseDto
        {
            IsValid = false,
            PostalCode = cleanPin,
            ErrorMessage = "Invalid PIN Code or location not found"
        };
    }

    public bool ValidatePinBelongsToState(string postalCode, string state)
    {
        if (string.IsNullOrWhiteSpace(postalCode) || string.IsNullOrWhiteSpace(state) || !Regex.IsMatch(postalCode.Trim(), @"^[1-9][0-9]{5}$"))
        {
            return false;
        }

        var cleanPin = postalCode.Trim();
        var normState = NormalizeStateName(state);

        // Check cache if available
        if (PinCache.TryGetValue(cleanPin, out var cached))
        {
            return AreStatesMatching(cached.State, normState);
        }

        // Check fallback map
        var fallback = ResolveFallbackPin(cleanPin);
        if (fallback != null)
        {
            return AreStatesMatching(fallback.State, normState);
        }

        // Check prefix range
        if (int.TryParse(cleanPin[..2], out var prefix2))
        {
            foreach (var r in PinPrefixRanges)
            {
                if (prefix2 >= r.StartPrefix && prefix2 <= r.EndPrefix)
                {
                    if (AreStatesMatching(r.State, normState))
                        return true;
                }
            }
        }

        return false;
    }

    private PinLookupResponseDto ValidateExpectedState(PinLookupResponseDto dto, string? expectedState)
    {
        if (string.IsNullOrWhiteSpace(expectedState))
        {
            return dto;
        }

        var normExpected = NormalizeStateName(expectedState);
        if (!AreStatesMatching(dto.State, normExpected))
        {
            return new PinLookupResponseDto
            {
                IsValid = false,
                PostalCode = dto.PostalCode,
                City = string.Empty,
                State = dto.State,
                ErrorMessage = "PIN Code does not belong to the selected State"
            };
        }

        return dto;
    }

    private PinLookupResponseDto? ResolveFallbackPin(string postalCode)
    {
        // Check exact 6-digit or 3-digit prefix
        if (SpecificPrefixMap.TryGetValue(postalCode, out var exact))
        {
            var coords = GetApproximateCoordinates(exact.District, postalCode);
            return new PinLookupResponseDto
            {
                IsValid = true,
                PostalCode = postalCode,
                City = exact.District,
                District = exact.District,
                State = exact.State,
                Latitude = coords?.Latitude,
                Longitude = coords?.Longitude
            };
        }

        var prefix3 = postalCode[..3];
        if (SpecificPrefixMap.TryGetValue(prefix3, out var p3))
        {
            var coords = GetApproximateCoordinates(p3.District, postalCode);
            return new PinLookupResponseDto
            {
                IsValid = true,
                PostalCode = postalCode,
                City = p3.District,
                District = p3.District,
                State = p3.State,
                Latitude = coords?.Latitude,
                Longitude = coords?.Longitude
            };
        }

        // Check 2-digit range
        if (int.TryParse(postalCode[..2], out var prefix2))
        {
            foreach (var r in PinPrefixRanges)
            {
                if (prefix2 >= r.StartPrefix && prefix2 <= r.EndPrefix)
                {
                    var coords = GetApproximateCoordinates(r.DefaultCity, postalCode);
                    return new PinLookupResponseDto
                    {
                        IsValid = true,
                        PostalCode = postalCode,
                        City = r.DefaultCity,
                        District = r.DefaultCity,
                        State = r.State,
                        Latitude = coords?.Latitude,
                        Longitude = coords?.Longitude
                    };
                }
            }
        }

        return null;
    }

    public static string NormalizeStateName(string? state)
    {
        if (string.IsNullOrWhiteSpace(state)) return string.Empty;
        var s = state.Trim();

        if (s.Equals("NCT of Delhi", StringComparison.OrdinalIgnoreCase) || s.Equals("National Capital Territory of Delhi", StringComparison.OrdinalIgnoreCase))
            return "Delhi";
        if (s.Equals("Orissa", StringComparison.OrdinalIgnoreCase))
            return "Odisha";
        if (s.Equals("Uttaranchal", StringComparison.OrdinalIgnoreCase))
            return "Uttarakhand";
        if (s.Equals("Pondicherry", StringComparison.OrdinalIgnoreCase))
            return "Puducherry";
        if (s.Contains("Daman", StringComparison.OrdinalIgnoreCase) || s.Contains("Dadra", StringComparison.OrdinalIgnoreCase))
            return "Dadra and Nagar Haveli and Daman and Diu";
        if (s.Contains("Jammu", StringComparison.OrdinalIgnoreCase))
            return "Jammu and Kashmir";
        if (s.Contains("Andaman", StringComparison.OrdinalIgnoreCase))
            return "Andaman and Nicobar Islands";

        return s;
    }

    public static bool AreStatesMatching(string state1, string state2)
    {
        var n1 = NormalizeStateName(state1);
        var n2 = NormalizeStateName(state2);

        if (n1.Equals(n2, StringComparison.OrdinalIgnoreCase))
            return true;

        if (n1.Contains(n2, StringComparison.OrdinalIgnoreCase) || n2.Contains(n1, StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    public decimal CalculateDistanceKm(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        const double earthRadiusKm = 6371.0;

        double dLat = ToRadians((double)(lat2 - lat1));
        double dLon = ToRadians((double)(lon2 - lon1));

        double rLat1 = ToRadians((double)lat1);
        double rLat2 = ToRadians((double)lat2);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(rLat1) * Math.Cos(rLat2) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        double distance = earthRadiusKm * c;

        return Math.Round((decimal)distance, 2);
    }

    public (decimal Latitude, decimal Longitude)? GetApproximateCoordinates(string? city, string? postalCode)
    {
        if (!string.IsNullOrWhiteSpace(postalCode))
        {
            var cleanPin = postalCode.Trim();
            if (cleanPin.StartsWith("396"))
            {
                var offset = (decimal.TryParse(cleanPin[^2..], out var sub) ? sub : 0) * 0.003m;
                return (20.6139m + offset, 72.9342m + offset);
            }
            if (cleanPin.StartsWith("400"))
            {
                var offset = (decimal.TryParse(cleanPin[^2..], out var sub) ? sub : 0) * 0.002m;
                return (19.0760m + offset, 72.8777m + offset);
            }
            if (cleanPin.StartsWith("110"))
            {
                return (28.6139m, 77.2090m);
            }
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            var cleanCity = city.Trim();
            foreach (var kvp in KnownCityCoordinates)
            {
                if (cleanCity.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase) ||
                    kvp.Key.Contains(cleanCity, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Value;
                }
            }
        }

        return (20.6139m, 72.9342m);
    }

    public int EstimateArrivalMinutes(decimal distanceKm)
    {
        if (distanceKm <= 1.0m) return 15;
        if (distanceKm <= 3.0m) return 20;
        if (distanceKm <= 6.0m) return 30;
        if (distanceKm <= 10.0m) return 40;
        if (distanceKm <= 15.0m) return 50;
        if (distanceKm <= 25.0m) return 60;
        return (int)Math.Round(distanceKm * 2.2m + 15);
    }

    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }

    private class PostalApiResponse
    {
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public List<PostalOfficeItem>? PostOffice { get; set; }
    }

    private class PostalOfficeItem
    {
        public string Name { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
    }
}
