using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string EntityName { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, StatusChange
    public string ChangesJson { get; set; } = string.Empty;
    public int? PerformedByUserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

