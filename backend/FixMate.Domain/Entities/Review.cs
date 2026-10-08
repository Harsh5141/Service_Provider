using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class Review : SoftDeletableEntity
{
    public int RequestId { get; set; }
    public ServiceRequest? Request { get; set; }

    public int CustomerId { get; set; }
    public User? Customer { get; set; }

    public int ProviderProfileId { get; set; }
    public ProviderProfile? ProviderProfile { get; set; }

    public int Rating { get; set; } // 1 - 5
    public string Comment { get; set; } = string.Empty;
    public bool IsVisible { get; set; } = true;
}

