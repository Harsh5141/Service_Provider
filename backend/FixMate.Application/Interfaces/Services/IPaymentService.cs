namespace FixMate.Application.Interfaces.Services;

public record RazorpayOrderResult(
    string OrderId,
    decimal Amount,
    string Currency,
    string KeyId
);

public record RazorpayVerificationRequest(
    int RequestId,
    string RazorpayOrderId,
    string RazorpayPaymentId,
    string RazorpaySignature
);

public record RazorpayVerificationResult(
    bool IsSuccess,
    string? Message,
    int? PaymentId,
    string? TransactionId
);

public record RefundResult(
    bool IsSuccess,
    string? RefundId,
    decimal Amount,
    string? Message
);

public interface IPaymentService
{
    Task<RazorpayOrderResult> CreateOrderAsync(int serviceRequestId, decimal amount);
    Task<RazorpayVerificationResult> VerifyAndProcessPaymentAsync(RazorpayVerificationRequest request);
    bool VerifyWebhookSignature(string payload, string signature, string secret);
    Task<RefundResult> ProcessRefundAsync(int paymentId, decimal? amount, string reason);
}
