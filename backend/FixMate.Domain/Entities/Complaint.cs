using FixMate.Domain.Common;
using FixMate.Domain.Enums;

namespace FixMate.Domain.Entities;

public class Complaint : BaseEntity
{
    public int RequestId { get; set; }
    public ServiceRequest? Request { get; set; }

    public int CustomerId { get; set; }
    public User? Customer { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ComplaintStatus Status { get; set; } = ComplaintStatus.Open;

    public string? ResolutionNote { get; set; }
    public int? ResolvedByUserId { get; set; }
    public User? ResolvedByUser { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

