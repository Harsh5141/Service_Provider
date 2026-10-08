using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class Appliance : SoftDeletableEntity
{
    public int UserId { get; set; }
    public User? User { get; set; }

    public string Name { get; set; } = string.Empty; // e.g. "Living Room AC", "Kitchen Refrigerator"
    public string Category { get; set; } = string.Empty; // e.g. AC, Washing Machine, Refrigerator, RO Purifier
    public string Brand { get; set; } = string.Empty; // e.g. LG, Samsung, Daikin
    public string? ModelNumber { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiryDate { get; set; }

    public ICollection<ServiceHistory> ServiceRecords { get; set; } = new List<ServiceHistory>();
}

