namespace FixMate.Application.DTOs.Auth;

public class ProviderRegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public int ExperienceYears { get; set; } = 1;
    public List<string>? DocumentUrls { get; set; } = new();

    // Service Area
    public string? ServiceAddress { get; set; }
    public string? Street => ServiceAddress;
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public int ServiceRadiusKm { get; set; } = 10;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    // Skills
    public List<int>? SkillIds { get; set; } = new();
    public List<string>? Skills { get; set; } = new();
}

