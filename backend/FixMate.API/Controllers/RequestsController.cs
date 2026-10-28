using System.Security.Claims;
using FixMate.Application.Common;
using FixMate.Application.DTOs.Requests;
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
[Authorize]
public class RequestsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IProviderMatchingService _matchingService;
    private readonly IGeoLocationService _geoLocationService;
    private readonly ITaxCalculationService _taxService;

    public RequestsController(
        AppDbContext context,
        IProviderMatchingService matchingService,
        IGeoLocationService geoLocationService,
        ITaxCalculationService taxService)
    {
        _context = context;
        _matchingService = matchingService;
        _geoLocationService = geoLocationService;
        _taxService = taxService;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ServiceRequestDto>>> CreateRequest([FromBody] CreateServiceRequestDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
        {
            return Unauthorized(ApiResponse<ServiceRequestDto>.Fail("Unauthorized user", 401));
        }

        var service = await _context.Services
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == dto.ServiceId, ct);

        if (service == null)
        {
            return BadRequest(ApiResponse<ServiceRequestDto>.Fail("Invalid service selected"));
        }

        // 1. Resolve Customer Address
        Address? address = null;
        if (dto.AddressId.HasValue && dto.AddressId.Value > 0)
        {
            address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == dto.AddressId.Value && a.UserId == userId, ct);
        }

        if (address == null && !string.IsNullOrWhiteSpace(dto.Street))
        {
            var approx = _geoLocationService.GetApproximateCoordinates(dto.City, dto.PostalCode);
            address = new Address
            {
                UserId = userId,
                Label = "Service Location",
                Street = dto.Street.Trim(),
                City = !string.IsNullOrWhiteSpace(dto.City) ? dto.City.Trim() : "Valsad",
                State = !string.IsNullOrWhiteSpace(dto.State) ? dto.State.Trim() : "Gujarat",
                PostalCode = !string.IsNullOrWhiteSpace(dto.PostalCode) ? dto.PostalCode.Trim() : "396001",
                Latitude = approx?.Latitude,
                Longitude = approx?.Longitude,
                IsDefault = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Addresses.Add(address);
            await _context.SaveChangesAsync(ct);
        }

        if (address == null)
        {
            // Try getting user's default saved address
            address = await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(ct);
        }

        if (address == null)
        {
            return BadRequest(ApiResponse<ServiceRequestDto>.Fail("Please provide or select a service address before booking."));
        }

        // Ensure address has coordinates if possible
        if (!address.Latitude.HasValue || !address.Longitude.HasValue)
        {
            var approx = _geoLocationService.GetApproximateCoordinates(address.City, address.PostalCode);
            if (approx.HasValue)
            {
                address.Latitude = approx.Value.Latitude;
                address.Longitude = approx.Value.Longitude;
                _context.Addresses.Update(address);
                await _context.SaveChangesAsync(ct);
            }
        }

        // 2. Perform Nearest Provider Matching to find eligible candidate providers
        var candidateList = await _matchingService.FindAllEligibleProvidersAsync(service.Id, address, ct);

        var baseCost = dto.EstimatedCost > 0 ? dto.EstimatedCost : service.BasePrice;

        int? assignedProviderId = null;
        var initialStatus = RequestStatus.Created;
        ProviderProfile? assignedProfile = null;

        if (dto.ProviderProfileId.HasValue && dto.ProviderProfileId.Value > 0)
        {
            assignedProfile = await _context.ProviderProfiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == dto.ProviderProfileId.Value && p.Status == ProviderStatus.Active, ct);

            if (assignedProfile != null)
            {
                assignedProviderId = assignedProfile.Id;
                initialStatus = RequestStatus.ProviderAssigned;
            }
        }

        // FixMate Service Charge & Commission Configuration Lookup
        var scEnabledSetting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "ServiceChargeEnabled", ct);
        var scPercentSetting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "ServiceChargePercentage", ct);
        var commSetting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "GlobalCommissionRate", ct);

        bool serviceChargeEnabled = scEnabledSetting == null || (bool.TryParse(scEnabledSetting.Value, out var sce) && sce);
        decimal serviceChargeRate = 0.10m; // Default 10%
        if (service.CustomPlatformFee.HasValue)
        {
            // If service specifies a custom percentage rate (as ratio e.g. 0.05 for 5%)
            serviceChargeRate = service.CustomPlatformFee.Value <= 1.0m 
                ? service.CustomPlatformFee.Value 
                : service.CustomPlatformFee.Value / 100m;
        }
        else if (scPercentSetting != null && decimal.TryParse(scPercentSetting.Value, out var scVal))
        {
            serviceChargeRate = scVal <= 1.0m ? scVal : scVal / 100m;
        }

        decimal serviceChargeAmount = 0.00m;
        if (serviceChargeEnabled)
        {
            serviceChargeAmount = Math.Round(baseCost * serviceChargeRate, 2);
        }

        decimal commRate = service.CustomCommissionRate 
            ?? (commSetting != null && decimal.TryParse(commSetting.Value, out var gc) ? gc : 0.15m);

        decimal commissionAmount = Math.Round(baseCost * commRate, 2);
        decimal providerEarnings = Math.Round(baseCost - commissionAmount, 2);

        // Server-Side Tax Calculation Engine (Never trust frontend tax values)
        var taxResult = await _taxService.CalculateTaxAsync(new Application.DTOs.Tax.TaxCalculationRequest
        {
            ServiceId = service.Id,
            ServicePrice = baseCost,
            PlatformFee = serviceChargeAmount,
            ExtraCharges = 0.00m,
            DiscountAmount = 0.00m,
            CustomerState = address.State
        }, ct);

        decimal totalAmount = taxResult.TotalPayable;

        var request = new ServiceRequest
        {
            CustomerId = userId,
            ServiceId = dto.ServiceId,
            AddressId = address.Id,
            ScheduledDate = dto.ScheduledDate == default ? DateTime.UtcNow.AddDays(1) : dto.ScheduledDate,
            TimeSlot = string.IsNullOrWhiteSpace(dto.PreferredTimeSlot) ? "Morning (9 AM - 12 PM)" : dto.PreferredTimeSlot,
            ProblemDescription = dto.ProblemDescription ?? string.Empty,
            BaseAmount = baseCost,
            ServiceChargeRate = serviceChargeRate,
            PlatformFee = serviceChargeAmount, // FixMate Service Charge amount
            CommissionRate = commRate,
            CommissionAmount = commissionAmount,
            ProviderEarnings = providerEarnings,
            PayoutStatus = "Pending",
            TotalAmount = totalAmount,

            // Tax Financial Snapshot (Immutable)
            AppliedTaxRuleId = taxResult.AppliedTaxRuleId,
            TaxRuleName = taxResult.TaxRuleName,
            TaxRate = taxResult.TaxRate,
            TaxableBase = taxResult.TaxableBase,
            TaxAmount = taxResult.TaxAmount,
            CgstRate = taxResult.CgstRate,
            CgstAmount = taxResult.CgstAmount,
            SgstRate = taxResult.SgstRate,
            SgstAmount = taxResult.SgstAmount,
            IgstRate = taxResult.IgstRate,
            IgstAmount = taxResult.IgstAmount,
            HsnSacCode = taxResult.HsnSacCode,
            PlaceOfSupply = taxResult.PlaceOfSupply,
            SupplierGstin = "24AAACF1234F1Z5",

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ProviderProfileId = assignedProviderId,
            Status = initialStatus,
            DistanceKm = candidateList.Count > 0 ? candidateList.First().DistanceKm : null,
            AssignedAt = assignedProviderId.HasValue ? DateTime.UtcNow : null
        };

        _context.ServiceRequests.Add(request);
        await _context.SaveChangesAsync(ct);

        // Generate official Tax Invoice Number
        request.InvoiceNumber = $"INV-FXM-{request.Id.ToString().PadLeft(5, '0')}";
        request.InvoicedAt = DateTime.UtcNow;

        // Add history log
        var historyNote = assignedProfile != null
            ? $"Service request #{request.Id} assigned directly to specialist {assignedProfile.User?.Name ?? "Technician"}."
            : candidateList.Count > 0
                ? $"Service request #{request.Id} broadcasted to {candidateList.Count} nearby technician(s). First provider to accept will be locked & assigned."
                : "Service booking request submitted by customer. Searching for nearby available technicians.";

        _context.RequestStatusHistory.Add(new RequestStatusHistory
        {
            RequestId = request.Id,
            Status = request.Status,
            ChangedByUserId = userId,
            Note = historyNote,
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync(ct);

        // Create and register Payment record for transaction audit & admin ledger
        var isOnline = string.Equals(dto.PaymentMethod, "Online", StringComparison.OrdinalIgnoreCase) ||
                       string.Equals(dto.PaymentMethod, "Razorpay", StringComparison.OrdinalIgnoreCase) ||
                       !string.IsNullOrEmpty(dto.RazorpayPaymentId);

        var payment = new Domain.Entities.Payment
        {
            RequestId = request.Id,
            Amount = request.TotalAmount,
            PlatformFee = request.PlatformFee,
            ProviderPayout = request.ProviderEarnings,
            TaxAmount = request.TaxAmount,
            TaxableAmount = request.TaxableBase,
            Method = isOnline ? Domain.Enums.PaymentMethod.Online : Domain.Enums.PaymentMethod.Cash,
            Status = !string.IsNullOrEmpty(dto.RazorpayPaymentId) ? Domain.Enums.PaymentStatus.Completed : Domain.Enums.PaymentStatus.Pending,
            RazorpayOrderId = !string.IsNullOrEmpty(dto.RazorpayPaymentId) ? $"order_{dto.RazorpayPaymentId}" : $"order_req_{request.Id}",
            RazorpayPaymentId = dto.RazorpayPaymentId,
            PaidAt = !string.IsNullOrEmpty(dto.RazorpayPaymentId) ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync(ct);

        var customer = await _context.Users.FindAsync(userId);

        var result = new ServiceRequestDto
        {
            Id = request.Id,
            CustomerId = userId,
            CustomerName = customer?.Name ?? "Customer",
            CustomerPhone = customer?.Phone ?? "",
            CustomerEmail = customer?.Email ?? "",
            ProviderId = assignedProfile?.UserId,
            ProviderName = assignedProfile?.User?.Name,
            ProviderPhone = assignedProfile?.User?.Phone,
            ProviderRating = assignedProfile?.RatingAverage,
            ProviderExperienceYears = assignedProfile?.ExperienceYears,
            ServiceId = service.Id,
            ServiceName = service.Name,
            CategoryName = service.Category?.Name ?? "General",
            AddressId = address.Id,
            AddressText = address.Street,
            City = address.City,
            State = address.State,
            PostalCode = address.PostalCode,
            ApplianceId = dto.ApplianceId,
            Status = request.Status,
            DistanceKm = request.DistanceKm,
            AssignedAt = request.AssignedAt,
            EstimatedArrivalMinutes = request.DistanceKm.HasValue ? (int)(request.DistanceKm.Value * 2.5m + 10) : 25,
            ScheduledDate = request.ScheduledDate,
            PreferredTimeSlot = request.TimeSlot,
            ProblemDescription = request.ProblemDescription,
            EstimatedCost = request.TotalAmount,
            FinalCost = request.TotalAmount,
            ServicePrice = request.BaseAmount,
            ServiceChargeRate = request.ServiceChargeRate,
            ServiceChargeAmount = request.PlatformFee,
            CommissionRate = request.CommissionRate,
            CommissionAmount = request.CommissionAmount,
            ProviderEarnings = request.ProviderEarnings,
            PayoutStatus = request.PayoutStatus,
            PayoutDate = request.PayoutDate,
            AppliedTaxRuleId = request.AppliedTaxRuleId,
            TaxRuleName = request.TaxRuleName,
            TaxRate = request.TaxRate,
            TaxableBase = request.TaxableBase,
            TaxAmount = request.TaxAmount,
            CgstRate = request.CgstRate,
            CgstAmount = request.CgstAmount,
            SgstRate = request.SgstRate,
            SgstAmount = request.SgstAmount,
            IgstRate = request.IgstRate,
            IgstAmount = request.IgstAmount,
            HsnSacCode = request.HsnSacCode,
            PlaceOfSupply = request.PlaceOfSupply,
            SupplierGstin = request.SupplierGstin,
            InvoiceNumber = request.InvoiceNumber,
            InvoicedAt = request.InvoicedAt,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt
        };

        var message = assignedProfile != null
            ? $"Request assigned directly to {assignedProfile.User?.Name ?? "technician"}. Partner notified."
            : candidateList.Count > 0
                ? $"Request broadcasted to {candidateList.Count} nearby technician(s). First provider to accept will be locked & assigned."
                : "Booking created. No provider currently available in your area.";

        return CreatedAtAction(nameof(GetRequestById), new { id = request.Id }, ApiResponse<ServiceRequestDto>.Ok(result, message));
    }

    /// <summary>
    /// Calculates transparent price breakdown before customer confirms booking.
    /// Returns service price, FixMate Service Charge (percentage & amount), and total payable.
    /// </summary>
    [HttpGet("calculate-price")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> CalculatePrice(
        [FromQuery] int serviceId,
        [FromQuery] decimal? customBasePrice,
        [FromQuery] string? state,
        CancellationToken ct)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == serviceId, ct);
        if (service == null)
            return NotFound(ApiResponse<object>.Fail("Service not found", 404));

        decimal basePrice = customBasePrice.HasValue && customBasePrice.Value > 0 
            ? customBasePrice.Value 
            : service.BasePrice;

        var scEnabledSetting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "ServiceChargeEnabled", ct);
        var scPercentSetting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "ServiceChargePercentage", ct);

        bool serviceChargeEnabled = scEnabledSetting == null || (bool.TryParse(scEnabledSetting.Value, out var sce) && sce);
        decimal serviceChargeRate = 0.10m; // Default 10%

        if (service.CustomPlatformFee.HasValue)
        {
            serviceChargeRate = service.CustomPlatformFee.Value <= 1.0m 
                ? service.CustomPlatformFee.Value 
                : service.CustomPlatformFee.Value / 100m;
        }
        else if (scPercentSetting != null && decimal.TryParse(scPercentSetting.Value, out var scVal))
        {
            serviceChargeRate = scVal <= 1.0m ? scVal : scVal / 100m;
        }

        decimal serviceChargeAmount = serviceChargeEnabled ? Math.Round(basePrice * serviceChargeRate, 2) : 0.00m;

        // Calculate Tax Breakdown
        var taxResult = await _taxService.CalculateTaxAsync(new Application.DTOs.Tax.TaxCalculationRequest
        {
            ServiceId = service.Id,
            ServicePrice = basePrice,
            PlatformFee = serviceChargeAmount,
            ExtraCharges = 0.00m,
            DiscountAmount = 0.00m,
            CustomerState = state
        }, ct);

        return Ok(ApiResponse<object>.Ok(new
        {
            serviceId = service.Id,
            serviceName = service.Name,
            servicePrice = basePrice,
            serviceChargeEnabled,
            serviceChargePercentage = Math.Round(serviceChargeRate * 100, 2),
            serviceChargeAmount,
            taxEnabled = taxResult.TaxEnabled,
            appliedTaxRuleId = taxResult.AppliedTaxRuleId,
            taxRuleName = taxResult.TaxRuleName,
            taxRate = taxResult.TaxRate,
            taxableBase = taxResult.TaxableBase,
            taxAmount = taxResult.TaxAmount,
            cgstRate = taxResult.CgstRate,
            cgstAmount = taxResult.CgstAmount,
            sgstRate = taxResult.SgstRate,
            sgstAmount = taxResult.SgstAmount,
            igstRate = taxResult.IgstRate,
            igstAmount = taxResult.IgstAmount,
            isInterState = taxResult.IsInterState,
            placeOfSupply = taxResult.PlaceOfSupply,
            hsnSacCode = taxResult.HsnSacCode,
            totalPayable = taxResult.TotalPayable,
            appliedMode = taxResult.AppliedMode,
            explanation = taxResult.Explanation
        }, "Price breakdown calculated successfully"));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ServiceRequestDto>>>> GetAllRequests()
    {
        var requests = await _context.ServiceRequests
            .AsNoTracking()
            .Include(r => r.Customer)
            .Include(r => r.ProviderProfile)
                .ThenInclude(p => p!.User)
            .Include(r => r.Service)
                .ThenInclude(s => s!.Category)
            .Include(r => r.Address)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ServiceRequestDto
            {
                Id = r.Id,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer != null ? r.Customer.Name : string.Empty,
                CustomerPhone = r.Customer != null ? r.Customer.Phone : string.Empty,
                CustomerEmail = r.Customer != null ? r.Customer.Email : string.Empty,
                ProviderId = r.ProviderProfile != null ? r.ProviderProfile.UserId : null,
                ProviderName = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Name : null,
                ProviderPhone = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Phone : null,
                ProviderRating = r.ProviderProfile != null ? r.ProviderProfile.RatingAverage : null,
                ProviderExperienceYears = r.ProviderProfile != null ? r.ProviderProfile.ExperienceYears : null,
                ServiceId = r.ServiceId,
                ServiceName = r.Service != null ? r.Service.Name : string.Empty,
                CategoryName = r.Service != null && r.Service.Category != null ? r.Service.Category.Name : string.Empty,
                AddressId = r.AddressId,
                AddressText = r.Address != null ? r.Address.Street : null,
                City = r.Address != null ? r.Address.City : null,
                State = r.Address != null ? r.Address.State : null,
                PostalCode = r.Address != null ? r.Address.PostalCode : null,
                Status = r.Status,
                DistanceKm = r.DistanceKm,
                AssignedAt = r.AssignedAt,
                EstimatedArrivalMinutes = r.DistanceKm.HasValue ? (int)(r.DistanceKm.Value * 2.5m + 10) : null,
                ScheduledDate = r.ScheduledDate,
                PreferredTimeSlot = r.TimeSlot,
                ProblemDescription = r.ProblemDescription,
                EstimatedCost = r.TotalAmount,
                FinalCost = r.TotalAmount,
                CancellationReason = r.CancellationReason,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ServiceRequestDto>>.Ok(requests, "All service requests retrieved successfully"));
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<List<ServiceRequestDto>>>> GetMyRequests()
    {
        var userId = GetCurrentUserId();
        var requests = await _context.ServiceRequests
            .AsNoTracking()
            .Include(r => r.Customer)
            .Include(r => r.ProviderProfile)
                .ThenInclude(p => p!.User)
            .Include(r => r.Service)
                .ThenInclude(s => s!.Category)
            .Include(r => r.Address)
            .Where(r => r.CustomerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ServiceRequestDto
            {
                Id = r.Id,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer != null ? r.Customer.Name : string.Empty,
                CustomerPhone = r.Customer != null ? r.Customer.Phone : string.Empty,
                CustomerEmail = r.Customer != null ? r.Customer.Email : string.Empty,
                ProviderId = r.ProviderProfile != null ? r.ProviderProfile.UserId : null,
                ProviderName = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Name : null,
                ProviderPhone = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Phone : null,
                ProviderRating = r.ProviderProfile != null ? r.ProviderProfile.RatingAverage : null,
                ProviderExperienceYears = r.ProviderProfile != null ? r.ProviderProfile.ExperienceYears : null,
                ServiceId = r.ServiceId,
                ServiceName = r.Service != null ? r.Service.Name : string.Empty,
                CategoryName = r.Service != null && r.Service.Category != null ? r.Service.Category.Name : string.Empty,
                AddressId = r.AddressId,
                AddressText = r.Address != null ? r.Address.Street : null,
                City = r.Address != null ? r.Address.City : null,
                State = r.Address != null ? r.Address.State : null,
                PostalCode = r.Address != null ? r.Address.PostalCode : null,
                Status = r.Status,
                DistanceKm = r.DistanceKm,
                AssignedAt = r.AssignedAt,
                EstimatedArrivalMinutes = r.DistanceKm.HasValue ? (int)(r.DistanceKm.Value * 2.5m + 10) : null,
                ScheduledDate = r.ScheduledDate,
                PreferredTimeSlot = r.TimeSlot,
                ProblemDescription = r.ProblemDescription,
                EstimatedCost = r.TotalAmount,
                FinalCost = r.TotalAmount,
                ServicePrice = r.BaseAmount,
                ServiceChargeRate = r.ServiceChargeRate,
                ServiceChargeAmount = r.PlatformFee,
                CommissionRate = r.CommissionRate,
                CommissionAmount = r.CommissionAmount,
                ProviderEarnings = r.ProviderEarnings,
                PayoutStatus = r.PayoutStatus,
                PayoutDate = r.PayoutDate,
                AppliedTaxRuleId = r.AppliedTaxRuleId,
                TaxRuleName = r.TaxRuleName,
                TaxRate = r.TaxRate,
                TaxableBase = r.TaxableBase,
                TaxAmount = r.TaxAmount,
                CgstRate = r.CgstRate,
                CgstAmount = r.CgstAmount,
                SgstRate = r.SgstRate,
                SgstAmount = r.SgstAmount,
                IgstRate = r.IgstRate,
                IgstAmount = r.IgstAmount,
                HsnSacCode = r.HsnSacCode,
                PlaceOfSupply = r.PlaceOfSupply,
                SupplierGstin = r.SupplierGstin,
                InvoiceNumber = r.InvoiceNumber,
                InvoicedAt = r.InvoicedAt,
                CancellationReason = r.CancellationReason,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ServiceRequestDto>>.Ok(requests, "Service requests retrieved successfully"));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ServiceRequestDto>>> GetRequestById(int id)
    {
        var request = await _context.ServiceRequests
            .AsNoTracking()
            .Include(r => r.Customer)
            .Include(r => r.ProviderProfile)
                .ThenInclude(p => p!.User)
            .Include(r => r.Service)
                .ThenInclude(s => s!.Category)
            .Include(r => r.Address)
            .Where(r => r.Id == id)
            .Select(r => new ServiceRequestDto
            {
                Id = r.Id,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer != null ? r.Customer.Name : "Customer",
                CustomerPhone = r.Customer != null ? r.Customer.Phone : "+91 98765 43211",
                CustomerEmail = r.Customer != null ? r.Customer.Email : "",
                ProviderId = r.ProviderProfile != null ? r.ProviderProfile.UserId : null,
                ProviderName = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Name : null,
                ProviderPhone = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Phone : null,
                ProviderRating = r.ProviderProfile != null ? r.ProviderProfile.RatingAverage : null,
                ProviderExperienceYears = r.ProviderProfile != null ? r.ProviderProfile.ExperienceYears : null,
                ServiceId = r.ServiceId,
                ServiceName = r.Service != null ? r.Service.Name : string.Empty,
                CategoryName = r.Service != null && r.Service.Category != null ? r.Service.Category.Name : string.Empty,
                AddressId = r.AddressId,
                AddressText = r.Address != null ? r.Address.Street : null,
                City = r.Address != null ? r.Address.City : null,
                State = r.Address != null ? r.Address.State : null,
                PostalCode = r.Address != null ? r.Address.PostalCode : null,
                Status = r.Status,
                DistanceKm = r.DistanceKm,
                AssignedAt = r.AssignedAt,
                EstimatedArrivalMinutes = r.DistanceKm.HasValue ? (int)(r.DistanceKm.Value * 2.5m + 10) : 25,
                ScheduledDate = r.ScheduledDate,
                PreferredTimeSlot = r.TimeSlot,
                ProblemDescription = r.ProblemDescription,
                EstimatedCost = r.TotalAmount,
                FinalCost = r.TotalAmount,
                ServicePrice = r.BaseAmount,
                ServiceChargeRate = r.ServiceChargeRate,
                ServiceChargeAmount = r.PlatformFee,
                CommissionRate = r.CommissionRate,
                CommissionAmount = r.CommissionAmount,
                ProviderEarnings = r.ProviderEarnings,
                PayoutStatus = r.PayoutStatus,
                PayoutDate = r.PayoutDate,
                AppliedTaxRuleId = r.AppliedTaxRuleId,
                TaxRuleName = r.TaxRuleName,
                TaxRate = r.TaxRate,
                TaxableBase = r.TaxableBase,
                TaxAmount = r.TaxAmount,
                CgstRate = r.CgstRate,
                CgstAmount = r.CgstAmount,
                SgstRate = r.SgstRate,
                SgstAmount = r.SgstAmount,
                IgstRate = r.IgstRate,
                IgstAmount = r.IgstAmount,
                HsnSacCode = r.HsnSacCode,
                PlaceOfSupply = r.PlaceOfSupply,
                SupplierGstin = r.SupplierGstin,
                InvoiceNumber = r.InvoiceNumber,
                InvoicedAt = r.InvoicedAt,
                CancellationReason = r.CancellationReason,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .FirstOrDefaultAsync();

        // If not found by exact ID, fallback to best matching seeded request or default
        if (request == null)
        {
            return NotFound(ApiResponse<ServiceRequestDto>.Fail($"Service request #{id} not found.", 404));
        }

        // Ownership & Role-Based Authorization:
        // Customer who owns request, assigned Provider, or Admin can access
        var userId = GetCurrentUserId();
        var isCustomerOwner = request.CustomerId == userId;
        var isAssignedProvider = request.ProviderId.HasValue && request.ProviderId.Value == userId;
        var isAdmin = User.IsInRole("Admin");

        if (!isCustomerOwner && !isAssignedProvider && !isAdmin)
        {
            return Forbid();
        }

        return Ok(ApiResponse<ServiceRequestDto>.Ok(request, "Request retrieved"));
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStatus(int id, [FromBody] UpdateRequestStatusDto dto)
    {
        var userId = GetCurrentUserId();
        var request = await _context.ServiceRequests.FindAsync(id);
        if (request == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Request not found", 404));
        }

        request.Status = dto.Status;
        if (dto.FinalCost.HasValue) request.TotalAmount = dto.FinalCost.Value;
        if (!string.IsNullOrWhiteSpace(dto.CancellationReason)) request.CancellationReason = dto.CancellationReason;
        request.UpdatedAt = DateTime.UtcNow;

        _context.RequestStatusHistory.Add(new RequestStatusHistory
        {
            RequestId = id,
            Status = dto.Status,
            ChangedByUserId = userId,
            Note = dto.Note ?? $"Status changed to {dto.Status}",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, $"Status updated to {dto.Status}"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRequest(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        var request = await _context.ServiceRequests
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (request == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Booking request not found", 404));
        }

        if (request.CustomerId != userId && userRole != "Admin")
        {
            return Forbid();
        }

        request.IsDeleted = true;
        request.DeletedAt = DateTime.UtcNow;
        request.Status = RequestStatus.Cancelled;
        request.CancellationReason = "Deleted by customer";
        request.UpdatedAt = DateTime.UtcNow;

        _context.RequestStatusHistory.Add(new RequestStatusHistory
        {
            RequestId = id,
            Status = RequestStatus.Cancelled,
            ChangedByUserId = userId,
            Note = $"Booking #{id} deleted by customer.",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, $"Booking #{id} deleted successfully"));
    }
}
