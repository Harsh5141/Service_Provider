using FixMate.Domain.Common;
using FixMate.Domain.Enums;

namespace FixMate.Domain.Entities;

public class RequestStatusHistory : BaseEntity
{
    public int RequestId { get; set; }
    public ServiceRequest? Request { get; set; }

    public RequestStatus Status { get; set; }
    public string Note { get; set; } = string.Empty;
    public int ChangedByUserId { get; set; }
    public User? ChangedByUser { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

