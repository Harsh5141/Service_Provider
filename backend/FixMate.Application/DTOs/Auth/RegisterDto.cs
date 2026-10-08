namespace FixMate.Application.DTOs.Auth;

public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    // Service Location (Default Address)
    public string? Address { get; set; }
    public string? Street => Address; // Alias for compatibility
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public bool IsDefaultAddress { get; set; } = true;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

