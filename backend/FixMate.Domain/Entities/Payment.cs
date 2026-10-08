using FixMate.Domain.Common;
using FixMate.Domain.Enums;

namespace FixMate.Domain.Entities;

public class Payment : BaseEntity
{
    public int RequestId { get; set; }
    public ServiceRequest? Request { get; set; }

    public string RazorpayOrderId { get; set; } = string.Empty;
    public string? RazorpayPaymentId { get; set; }
    public string? RazorpaySignature { get; set; }

    public decimal Amount { get; set; }
    public decimal PlatformFee { get; set; } = 0.00m;
    public decimal ProviderPayout { get; set; } = 0.00m;

    public PaymentMethod Method { get; set; } = PaymentMethod.Online;
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public DateTime? PaidAt { get; set; }
    public string? FailureReason { get; set; }

    public byte[]? RowVersion { get; set; }

    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}

