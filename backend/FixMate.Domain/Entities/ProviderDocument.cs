using FixMate.Domain.Common;
using FixMate.Domain.Enums;

namespace FixMate.Domain.Entities;

public class ProviderDocument : BaseEntity
{
    public int ProviderProfileId { get; set; }
    public ProviderProfile? ProviderProfile { get; set; }

    public DocumentType DocumentType { get; set; }
    public string DocumentUrl { get; set; } = string.Empty;
    public string? DocumentNumber { get; set; }
    public bool IsVerified { get; set; } = false;
    public string? RejectionReason { get; set; }
    public DateTime? VerifiedAt { get; set; }
}

