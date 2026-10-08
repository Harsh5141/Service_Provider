using FixMate.Domain.Common;
using FixMate.Domain.Enums;

namespace FixMate.Domain.Entities;

public class RequestMedia : BaseEntity
{
    public int RequestId { get; set; }
    public ServiceRequest? Request { get; set; }

    public string MediaUrl { get; set; } = string.Empty;
    public MediaType MediaType { get; set; } = MediaType.Image;
    public int UploadStage { get; set; } = 1; // 1 = ProblemDescription, 2 = BeforeWork, 3 = AfterWork
    public int UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }
}

