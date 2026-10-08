namespace FixMate.Domain.Common;

/// <summary>
/// Base entity for all domain objects.
/// Uses int identity PK — simpler EF navigation, better SQL index performance than Guid.
/// Guid is used only for external-facing IDs (e.g., Razorpay order references).
/// </summary>
public abstract class BaseEntity
{
    public int      Id        { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Adds soft-delete support. Entities with this base are filtered globally in EF Core.</summary>
public abstract class SoftDeletableEntity : BaseEntity
{
    public bool      IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
