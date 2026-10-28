using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class TaxAuditLog : BaseEntity
{
    public int? TaxRuleId { get; set; }
    public TaxRule? TaxRule { get; set; }

    public string Action { get; set; } = string.Empty; // Create, Update, Activate, Deactivate, ConfigChange
    public string RuleName { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string OldValueJson { get; set; } = string.Empty;
    public string NewValueJson { get; set; } = string.Empty;
    public int? PerformedByUserId { get; set; }
    public string? PerformedByName { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
