using System.Security.Claims;
using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly AppDbContext _context;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        IPaymentService paymentService,
        AppDbContext context,
        ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a Razorpay order for a given ServiceRequest.
    /// Calculates financial snapshot (BasePrice, PlatformFee, Commission, ProviderEarnings) server-side.
    /// </summary>
    [HttpPost("create-order")]
    [Authorize]
    public async Task<IActionResult> CreateOrder([FromBody] CreatePaymentOrderDto dto)
    {
        if (dto == null || dto.RequestId <= 0)
        {
            return BadRequest(new { message = "Invalid request ID." });
        }

        var userId = GetCurrentUserId();
        var request = await _context.ServiceRequests.FirstOrDefaultAsync(r => r.Id == dto.RequestId);
        if (request == null)
        {
            return NotFound(new { message = "Service request not found." });
        }

        // Only the customer who owns the request or an Admin can create payment orders
        if (request.CustomerId != userId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        try
        {
            var result = await _paymentService.CreateOrderAsync(dto.RequestId, request.TotalAmount);
            return Ok(new
            {
                orderId = result.OrderId,
                amount = result.Amount,
                currency = result.Currency,
                keyId = result.KeyId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create payment order for request {RequestId}", dto.RequestId);
            return StatusCode(500, new { message = "Failed to initialize payment gateway order." });
        }
    }

    /// <summary>
    /// Verifies Razorpay payment signature and updates payment status.
    /// Idempotent: safe against duplicate callback attempts.
    /// </summary>
    [HttpPost("verify")]
    [Authorize]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
    {
        if (dto == null || dto.RequestId <= 0 || string.IsNullOrEmpty(dto.RazorpayOrderId) || string.IsNullOrEmpty(dto.RazorpayPaymentId))
        {
            return BadRequest(new { message = "Missing payment verification parameters." });
        }

        var verificationReq = new RazorpayVerificationRequest(
            dto.RequestId,
            dto.RazorpayOrderId,
            dto.RazorpayPaymentId,
            dto.RazorpaySignature ?? ""
        );

        var result = await _paymentService.VerifyAndProcessPaymentAsync(verificationReq);
        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            paymentId = result.PaymentId,
            transactionId = result.TransactionId
        });
    }

    /// <summary>
    /// Admin & Customer endpoint to retrieve payment details for a specific request.
    /// </summary>
    [HttpGet("request/{requestId}")]
    [Authorize]
    public async Task<IActionResult> GetPaymentByRequestId(int requestId)
    {
        var payment = await _context.Payments
            .Include(p => p.Request)
            .Include(p => p.Refunds)
            .FirstOrDefaultAsync(p => p.RequestId == requestId);

        if (payment == null)
            return NotFound(new { message = "Payment not found." });

        var userId = GetCurrentUserId();
        if (payment.Request?.CustomerId != userId && !User.IsInRole("Admin") && !User.IsInRole("Provider"))
        {
            return Forbid();
        }

        return Ok(new
        {
            id = payment.Id,
            requestId = payment.RequestId,
            razorpayOrderId = payment.RazorpayOrderId,
            razorpayPaymentId = payment.RazorpayPaymentId,
            amount = payment.Amount,
            platformFee = payment.PlatformFee,
            providerPayout = payment.ProviderPayout,
            taxAmount = payment.TaxAmount,
            taxableAmount = payment.TaxableAmount,
            taxRuleName = payment.Request?.TaxRuleName ?? "Standard Tax",
            taxRate = payment.Request?.TaxRate ?? 0m,
            cgstAmount = payment.Request?.CgstAmount ?? 0m,
            sgstAmount = payment.Request?.SgstAmount ?? 0m,
            igstAmount = payment.Request?.IgstAmount ?? 0m,
            placeOfSupply = payment.Request?.PlaceOfSupply ?? "Gujarat (Intra-State)",
            invoiceNumber = payment.Request?.InvoiceNumber ?? $"INV-FXM-{payment.RequestId.ToString().PadLeft(5, '0')}",
            status = payment.Status.ToString(),
            method = payment.Method.ToString(),
            paidAt = payment.PaidAt,
            failureReason = payment.FailureReason,
            refunds = payment.Refunds.Select(r => new
            {
                id = r.Id,
                amount = r.Amount,
                reason = r.Reason,
                status = r.Status.ToString(),
                processedAt = r.ProcessedAt
            })
        });
    }

    /// <summary>
    /// Admin endpoint: List all payments with full financial ledger details, filters, and pagination.
    /// Supports StartDate, EndDate, PaymentStatus, Provider, Service, and PaymentMethod filters.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPayments(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int? providerId,
        [FromQuery] int? serviceId,
        [FromQuery] string? method,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Payments
            .Include(p => p.Request)
                .ThenInclude(r => r!.Customer)
            .Include(p => p.Request)
                .ThenInclude(r => r!.ProviderProfile)
                    .ThenInclude(pp => pp!.User)
            .Include(p => p.Request)
                .ThenInclude(r => r!.Service)
            .Include(p => p.Refunds)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PaymentStatus>(status, true, out var pStatus))
        {
            query = query.Where(p => p.Status == pStatus);
        }

        if (!string.IsNullOrEmpty(method) && Enum.TryParse<PaymentMethod>(method, true, out var pMethod))
        {
            query = query.Where(p => p.Method == pMethod);
        }

        if (providerId.HasValue && providerId.Value > 0)
        {
            query = query.Where(p => p.Request != null && p.Request.ProviderProfileId == providerId.Value);
        }

        if (serviceId.HasValue && serviceId.Value > 0)
        {
            query = query.Where(p => p.Request != null && p.Request.ServiceId == serviceId.Value);
        }

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt <= endUtc);
        }

        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim();
            query = query.Where(p =>
                p.RazorpayOrderId.Contains(search) ||
                (p.RazorpayPaymentId != null && p.RazorpayPaymentId.Contains(search)) ||
                (p.Request != null && p.Request.TrackingNumber.Contains(search)) ||
                (p.Request != null && p.Request.Customer != null && p.Request.Customer.Name.Contains(search)) ||
                (p.Request != null && p.Request.ProviderProfile != null && p.Request.ProviderProfile.User != null && p.Request.ProviderProfile.User.Name.Contains(search)));
        }

        var total = await query.CountAsync();
        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                id = p.Id,
                requestId = p.RequestId,
                trackingNumber = p.Request != null ? p.Request.TrackingNumber : "N/A",
                customerName = p.Request != null && p.Request.Customer != null ? p.Request.Customer.Name : "N/A",
                customerEmail = p.Request != null && p.Request.Customer != null ? p.Request.Customer.Email : "N/A",
                providerId = p.Request != null ? p.Request.ProviderProfileId : null,
                providerName = p.Request != null && p.Request.ProviderProfile != null && p.Request.ProviderProfile.User != null 
                    ? p.Request.ProviderProfile.User.Name : "Unassigned",
                serviceId = p.Request != null ? p.Request.ServiceId : 0,
                serviceName = p.Request != null && p.Request.Service != null ? p.Request.Service.Name : "N/A",
                servicePrice = p.Request != null ? p.Request.BaseAmount : (p.Amount - p.PlatformFee),
                serviceChargeRate = p.Request != null ? (p.Request.ServiceChargeRate > 0 ? p.Request.ServiceChargeRate * 100 : 10m) : 10m,
                serviceChargeAmount = p.PlatformFee,
                customerTotalAmount = p.Amount,
                amount = p.Amount,
                platformFee = p.PlatformFee,
                providerPayout = p.ProviderPayout,
                commissionAmount = p.Request != null ? p.Request.CommissionAmount : 0m,
                taxRuleName = p.Request != null ? p.Request.TaxRuleName : "Standard Tax",
                taxRate = p.Request != null ? p.Request.TaxRate : 0m,
                taxableBase = p.Request != null ? p.Request.TaxableBase : p.TaxableAmount,
                taxAmount = p.Request != null ? p.Request.TaxAmount : p.TaxAmount,
                cgstAmount = p.Request != null ? p.Request.CgstAmount : 0m,
                sgstAmount = p.Request != null ? p.Request.SgstAmount : 0m,
                igstAmount = p.Request != null ? p.Request.IgstAmount : 0m,
                placeOfSupply = p.Request != null ? p.Request.PlaceOfSupply : "Gujarat (Intra-State)",
                invoiceNumber = p.Request != null && !string.IsNullOrEmpty(p.Request.InvoiceNumber) 
                    ? p.Request.InvoiceNumber 
                    : $"INV-FXM-{p.RequestId.ToString().PadLeft(5, '0')}",
                invoicedAt = p.Request != null ? p.Request.InvoicedAt : p.PaidAt,
                status = p.Status.ToString(),
                method = p.Method.ToString(),
                razorpayOrderId = p.RazorpayOrderId,
                razorpayPaymentId = p.RazorpayPaymentId,
                paidAt = p.PaidAt,
                createdAt = p.CreatedAt,
                refundCount = p.Refunds.Count,
                refundStatus = p.Refunds.Any() ? "Processed" : (p.Status == PaymentStatus.Refunded ? "Refunded" : "None"),
                totalRefunded = p.Refunds.Where(r => r.Status == "Processed").Sum(r => r.Amount)
            })
            .ToListAsync();

        return Ok(new
        {
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize),
            items = payments
        });
    }

    /// <summary>
    /// Admin endpoint: Get financial summary statistics calculated directly from actual DB records.
    /// Distinguishes successful, pending, failed, and refunded transactions.
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetFinancialSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var query = _context.Payments
            .Include(p => p.Refunds)
            .AsNoTracking();

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt <= endUtc);
        }

        var allPayments = await query.ToListAsync();

        var completedPayments = allPayments.Where(p => p.Status == PaymentStatus.Completed).ToList();
        var failedCount = allPayments.Count(p => p.Status == PaymentStatus.Failed);
        var pendingCount = allPayments.Count(p => p.Status == PaymentStatus.Pending);

        decimal totalCustomerPayments = completedPayments.Sum(p => p.Amount);
        decimal totalServiceCharge = completedPayments.Sum(p => p.PlatformFee);
        decimal pendingProviderPayouts = completedPayments.Sum(p => p.ProviderPayout);

        var allRefunds = await _context.Refunds
            .Where(r => r.Status == "Processed")
            .AsNoTracking()
            .ToListAsync();

        decimal totalRefunds = allRefunds.Sum(r => r.Amount);

        return Ok(new
        {
            totalCustomerPayments,
            totalServiceChargeCollected = totalServiceCharge,
            successfulPayments = completedPayments.Count,
            failedPayments = failedCount,
            pendingPayments = pendingCount,
            totalRefunds,
            pendingProviderPayouts
        });
    }

    /// <summary>
    /// Provider endpoint: Retrieve isolated payment and earnings history for authenticated provider.
    /// Enforces strict ownership so providers can only view their own earnings.
    /// </summary>
    [HttpGet("provider-history")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<IActionResult> GetProviderHistory(
        [FromQuery] string? search,
        [FromQuery] string? paymentStatus,
        [FromQuery] string? payoutStatus,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var providerProfile = await _context.ProviderProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (providerProfile == null && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        int targetProfileId = providerProfile?.Id ?? 0;

        var query = _context.ServiceRequests
            .Include(r => r.Customer)
            .Include(r => r.Service)
            .Include(r => r.Payment)
            .Where(r => r.ProviderProfileId == targetProfileId)
            .AsNoTracking();

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(r => r.CreatedAt >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(r => r.CreatedAt <= endUtc);
        }

        if (!string.IsNullOrEmpty(payoutStatus))
        {
            query = query.Where(r => r.PayoutStatus.ToLower() == payoutStatus.ToLower());
        }

        if (!string.IsNullOrEmpty(paymentStatus) && Enum.TryParse<PaymentStatus>(paymentStatus, true, out var pStat))
        {
            query = query.Where(r => r.Payment != null && r.Payment.Status == pStat);
        }

        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim();
            query = query.Where(r =>
                r.TrackingNumber.Contains(search) ||
                (r.Customer != null && r.Customer.Name.Contains(search)) ||
                (r.Service != null && r.Service.Name.Contains(search)));
        }

        var total = await query.CountAsync();
        var records = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                bookingId = r.Id,
                trackingNumber = r.TrackingNumber,
                customerName = r.Customer != null ? r.Customer.Name : "Customer",
                serviceName = r.Service != null ? r.Service.Name : "Service",
                servicePrice = r.BaseAmount,
                serviceCharge = r.PlatformFee,
                serviceChargeRate = r.ServiceChargeRate * 100,
                providerGrossEarnings = r.BaseAmount,
                commissionDeducted = r.CommissionAmount,
                otherDeductions = 0.00m,
                providerNetEarnings = r.ProviderEarnings,
                paymentStatus = r.Payment != null ? r.Payment.Status.ToString() : "Pending",
                payoutStatus = r.PayoutStatus,
                bookingCompletionDate = (r.Status == RequestStatus.Completed || r.Status == RequestStatus.Paid || r.Status == RequestStatus.Reviewed) ? r.UpdatedAt : (DateTime?)null,
                payoutDate = r.PayoutDate,
                createdAt = r.CreatedAt
            })
            .ToListAsync();

        // Calculate summary metrics for the provider within the filtered period
        var allFilteredRequests = await query.ToListAsync();
        var completedJobs = allFilteredRequests.Count(r => r.Status == RequestStatus.Completed || r.Status == RequestStatus.Paid || r.Status == RequestStatus.Reviewed);
        var totalEarnings = allFilteredRequests.Sum(r => r.ProviderEarnings);
        var totalPaidOut = allFilteredRequests.Where(r => r.PayoutStatus == "Paid").Sum(r => r.ProviderEarnings);
        var pendingPayout = allFilteredRequests.Where(r => r.PayoutStatus != "Paid" && r.Payment?.Status == PaymentStatus.Completed).Sum(r => r.ProviderEarnings);

        return Ok(new
        {
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize),
            summary = new
            {
                totalEarnings,
                completedJobs,
                totalPaidAmount = totalPaidOut,
                pendingPayoutAmount = pendingPayout
            },
            items = records
        });
    }

    /// <summary>
    /// Admin endpoint: Initiate full or partial refund.
    /// </summary>
    [HttpPost("{id}/refund")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ProcessRefund(int id, [FromBody] RefundRequestDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Invalid refund details." });

        var result = await _paymentService.ProcessRefundAsync(id, dto.Amount, dto.Reason ?? "Customer requested refund");
        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            refundId = result.RefundId,
            refundedAmount = result.Amount
        });
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }
}

public record CreatePaymentOrderDto(int RequestId);
public record VerifyPaymentDto(int RequestId, string RazorpayOrderId, string RazorpayPaymentId, string? RazorpaySignature);
public record RefundRequestDto(decimal? Amount, string? Reason);
