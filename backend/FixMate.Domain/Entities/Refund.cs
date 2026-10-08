using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class Refund : BaseEntity
{
    public int PaymentId { get; set; }
    public Payment? Payment { get; set; }

    public string RazorpayRefundId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Processed";
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

