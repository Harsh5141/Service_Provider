using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class Address : SoftDeletableEntity
{
    public int UserId { get; set; }
    public User? User { get; set; }

    public string Label { get; set; } = "Home"; // e.g. Home, Office, Other
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsDefault { get; set; } = false;
}

