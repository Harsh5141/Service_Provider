using FixMate.Application.Common;
using FixMate.Application.DTOs.Admin;
using FixMate.Application.DTOs.Auth;
using FixMate.Application.DTOs.Requests;
using FixMate.Domain.Enums;
using FixMate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<AdminDashboardStatsDto>>> GetDashboardStats()
    {
        var totalCustomers = await _context.Users.CountAsync(u => u.Role == UserRole.User);
        var totalProviders = await _context.Users.CountAsync(u => u.Role == UserRole.Provider);
        var activeRequests = await _context.ServiceRequests.CountAsync(r => r.Status == RequestStatus.Created || r.Status == RequestStatus.ProviderAssigned || r.Status == RequestStatus.OnTheWay || r.Status == RequestStatus.InProgress);
        var completedRequests = await _context.ServiceRequests.CountAsync(r => r.Status == RequestStatus.Completed || r.Status == RequestStatus.Paid || r.Status == RequestStatus.Reviewed);
        var pendingProvidersCount = await _context.ProviderProfiles.CountAsync(p => p.Status == ProviderStatus.PendingApproval);
        var openComplaintsCount = await _context.Complaints.CountAsync(c => c.Status == ComplaintStatus.Open || c.Status == ComplaintStatus.InReview);

        // Real financial metrics from Payment and ServiceRequest tables
        var completedPayments = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .ToListAsync();

        var totalRevenue = completedPayments.Sum(p => p.Amount);
        var totalPlatformFeeRevenue = completedPayments.Sum(p => p.PlatformFee);
        var totalProviderEarnings = completedPayments.Sum(p => p.ProviderPayout);

        var totalCommissionEarned = await _context.ServiceRequests
            .Where(r => r.Status == RequestStatus.Completed || r.Status == RequestStatus.Paid || r.Status == RequestStatus.Reviewed)
            .SumAsync(r => (decimal?)r.CommissionAmount) ?? 0m;

        var totalFixMateRevenue = totalPlatformFeeRevenue + totalCommissionEarned;

        var totalRefunded = await _context.Refunds
            .Where(r => r.Status == "Processed")
            .SumAsync(r => (decimal?)r.Amount) ?? 0m;

        // Pending payouts for providers on completed jobs
        var pendingPayouts = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .SumAsync(p => (decimal?)p.ProviderPayout) ?? 0m;

        var recent = await _context.ServiceRequests
            .AsNoTracking()
            .Include(r => r.Customer)
            .Include(r => r.ProviderProfile)
                .ThenInclude(p => p!.User)
            .Include(r => r.Service)
                .ThenInclude(s => s!.Category)
            .OrderByDescending(r => r.CreatedAt)
            .Take(6)
            .Select(r => new ServiceRequestDto
            {
                Id = r.Id,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer != null ? r.Customer.Name : "Customer",
                CustomerPhone = r.Customer != null ? r.Customer.Phone : "",
                ProviderId = r.ProviderProfile != null ? r.ProviderProfile.UserId : null,
                ProviderName = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Name : "Unassigned",
                ServiceId = r.ServiceId,
                ServiceName = r.Service != null ? r.Service.Name : "",
                CategoryName = r.Service != null && r.Service.Category != null ? r.Service.Category.Name : "",
                Status = r.Status,
                ScheduledDate = r.ScheduledDate,
                EstimatedCost = r.TotalAmount,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        var pendingProviders = await _context.ProviderProfiles
            .AsNoTracking()
            .Include(p => p.User)
                .ThenInclude(u => u!.Addresses)
            .Include(p => p.Skills)
                .ThenInclude(s => s.Service)
                    .ThenInclude(s => s!.Category)
            .Where(p => p.Status == ProviderStatus.PendingApproval)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .Select(p => new ProviderSummaryDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.User != null ? p.User.Name : "Provider",
                Email = p.User != null ? p.User.Email : "",
                Phone = p.User != null ? p.User.Phone : "",
                Bio = p.Bio,
                ExperienceYears = p.ExperienceYears,
                ServiceRadiusKm = p.ServiceRadiusKm,
                City = p.User != null && p.User.Addresses.Any() ? p.User.Addresses.First().City : null,
                PostalCode = p.User != null && p.User.Addresses.Any() ? p.User.Addresses.First().PostalCode : null,
                PrimaryCategory = p.Skills.Where(s => s.Service != null && s.Service.Category != null).Select(s => s.Service!.Category!.Name).FirstOrDefault() ?? "Home Services",
                Categories = p.Skills.Where(s => s.Service != null && s.Service.Category != null).Select(s => s.Service!.Category!.Name).Distinct().ToList(),
                Skills = p.Skills.Where(s => s.Service != null).Select(s => s.Service!.Name).ToList(),
                RatingAverage = p.RatingAverage,
                RatingCount = p.RatingCount,
                IsAvailable = p.IsAvailable,
                Status = p.Status,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        // Aggregate real weekly GMV from Payments table
        var now = DateTime.UtcNow;
        var w1Start = now.AddDays(-28);
        var w2Start = now.AddDays(-21);
        var w3Start = now.AddDays(-14);
        var w4Start = now.AddDays(-7);

        var trend = new List<RevenueTrendDto>
        {
            new RevenueTrendDto { Month = "W-3", Revenue = completedPayments.Where(p => p.CreatedAt >= w1Start && p.CreatedAt < w2Start).Sum(p => p.Amount) },
            new RevenueTrendDto { Month = "W-2", Revenue = completedPayments.Where(p => p.CreatedAt >= w2Start && p.CreatedAt < w3Start).Sum(p => p.Amount) },
            new RevenueTrendDto { Month = "W-1", Revenue = completedPayments.Where(p => p.CreatedAt >= w3Start && p.CreatedAt < w4Start).Sum(p => p.Amount) },
            new RevenueTrendDto { Month = "Current", Revenue = completedPayments.Where(p => p.CreatedAt >= w4Start).Sum(p => p.Amount) }
        };

        // If all payments occurred recently, show running cumulative totals
        if (trend.All(t => t.Revenue == 0) && totalRevenue > 0)
        {
            trend = new List<RevenueTrendDto>
            {
                new RevenueTrendDto { Month = "Initial", Revenue = 0 },
                new RevenueTrendDto { Month = "W-1", Revenue = completedPayments.Where(p => p.CreatedAt < w4Start).Sum(p => p.Amount) },
                new RevenueTrendDto { Month = "Current", Revenue = totalRevenue }
            };
        }

        var dto = new AdminDashboardStatsDto
        {
            TotalCustomers = totalCustomers,
            TotalProviders = totalProviders,
            ActiveRequests = activeRequests,
            CompletedRequests = completedRequests,
            TotalRevenue = totalRevenue,
            TotalPlatformFeeRevenue = totalPlatformFeeRevenue,
            TotalCommissionEarned = totalCommissionEarned,
            TotalFixMateRevenue = totalFixMateRevenue,
            TotalProviderEarnings = totalProviderEarnings,
            TotalRefunded = totalRefunded,
            PendingPayouts = pendingPayouts,
            PendingProviderApprovals = pendingProvidersCount,
            OpenComplaints = openComplaintsCount,
            RevenueTrend = trend,
            RecentRequests = recent,
            PendingProviders = pendingProviders
        };

        return Ok(ApiResponse<AdminDashboardStatsDto>.Ok(dto, "Admin dashboard stats loaded"));
    }

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<List<PlatformSettingDto>>>> GetSettings()
    {
        var settings = await _context.PlatformSettings
            .AsNoTracking()
            .Select(s => new PlatformSettingDto
            {
                Id = s.Id,
                Key = s.Key,
                Value = s.Value,
                Description = s.Description,
                DataType = s.DataType
            })
            .ToListAsync();

        return Ok(ApiResponse<List<PlatformSettingDto>>.Ok(settings, "Platform settings loaded"));
    }

    [HttpPut("settings/{key}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateSetting(string key, [FromBody] UpdateSettingDto dto)
    {
        var setting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null)
        {
            setting = new Domain.Entities.PlatformSetting
            {
                Key = key,
                Value = dto.Value,
                Description = "Custom platform parameter",
                DataType = "string",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.PlatformSettings.Add(setting);
        }
        else
        {
            setting.Value = dto.Value;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, $"Platform setting '{key}' updated successfully."));
    }

    [HttpGet("providers")]
    public async Task<ActionResult<ApiResponse<List<ProviderSummaryDto>>>> GetProviders()
    {
        var providers = await _context.ProviderProfiles
            .AsNoTracking()
            .Include(p => p.User)
                .ThenInclude(u => u!.Addresses)
            .Include(p => p.Skills)
                .ThenInclude(s => s.Service)
                    .ThenInclude(s => s!.Category)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProviderSummaryDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.User != null ? p.User.Name : "Provider",
                Email = p.User != null ? p.User.Email : "",
                Phone = p.User != null ? p.User.Phone : "",
                Bio = p.Bio,
                ExperienceYears = p.ExperienceYears,
                ServiceRadiusKm = p.ServiceRadiusKm,
                City = p.User != null && p.User.Addresses.Any() ? p.User.Addresses.First().City : null,
                PostalCode = p.User != null && p.User.Addresses.Any() ? p.User.Addresses.First().PostalCode : null,
                PrimaryCategory = p.Skills.Where(s => s.Service != null && s.Service.Category != null).Select(s => s.Service!.Category!.Name).FirstOrDefault() ?? "Home Services",
                Categories = p.Skills.Where(s => s.Service != null && s.Service.Category != null).Select(s => s.Service!.Category!.Name).Distinct().ToList(),
                Skills = p.Skills.Where(s => s.Service != null).Select(s => s.Service!.Name).ToList(),
                RatingAverage = p.RatingAverage,
                RatingCount = p.RatingCount,
                IsAvailable = p.IsAvailable,
                Status = p.Status,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ProviderSummaryDto>>.Ok(providers, "Providers retrieved"));
    }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role.ToString(),
                AvatarUrl = u.AvatarUrl,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<UserDto>>.Ok(users, "Users loaded"));
    }

    [HttpPut("providers/{id}/status")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateProviderStatus(int id, [FromBody] UpdateProviderStatusDto dto)
    {
        var profile = await _context.ProviderProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id || p.UserId == id);
        if (profile == null) return NotFound(ApiResponse<bool>.Fail("Provider not found", 404));

        if (Enum.TryParse<ProviderStatus>(dto.Status, true, out var status))
        {
            profile.Status = status;
        }
        else
        {
            profile.Status = dto.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)
                ? ProviderStatus.Active
                : ProviderStatus.Suspended;
        }

        if (profile.User != null)
        {
            profile.User.IsActive = profile.Status == ProviderStatus.Active;
            profile.User.UpdatedAt = DateTime.UtcNow;
        }

        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, $"Provider status set to {profile.Status}"));
    }

    [HttpPost("providers/{id}/approve")]
    public async Task<ActionResult<ApiResponse<bool>>> ApproveProvider(int id, [FromBody] ApproveProviderDto dto)
    {
        var profile = await _context.ProviderProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id || p.UserId == id);
        if (profile == null) return NotFound(ApiResponse<bool>.Fail("Provider not found", 404));

        profile.Status = dto.Approve ? ProviderStatus.Active : ProviderStatus.Suspended;
        if (profile.User != null)
        {
            profile.User.IsActive = dto.Approve;
            profile.User.UpdatedAt = DateTime.UtcNow;
        }

        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, $"Provider status set to {profile.Status}"));
    }

    [HttpGet("complaints")]
    public async Task<ActionResult<ApiResponse<List<AdminComplaintDto>>>> GetComplaints()
    {
        var complaints = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.Request)
                .ThenInclude(r => r!.Service)
            .Include(c => c.Request)
                .ThenInclude(r => r!.ProviderProfile)
                    .ThenInclude(p => p!.User)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new AdminComplaintDto
            {
                Id = c.Id,
                TicketNumber = $"TKT-{8900 + c.Id}",
                Customer = c.Customer != null ? c.Customer.Name : "Customer",
                Service = c.Request != null && c.Request.Service != null ? c.Request.Service.Name : "Service",
                Provider = c.Request != null && c.Request.ProviderProfile != null && c.Request.ProviderProfile.User != null ? c.Request.ProviderProfile.User.Name : "Unassigned Partner",
                Issue = c.Description,
                Status = c.Status.ToString(),
                Date = c.CreatedAt.ToString("yyyy-MM-dd")
            })
            .ToListAsync();

        return Ok(ApiResponse<List<AdminComplaintDto>>.Ok(complaints, "Complaints loaded successfully"));
    }

    [HttpPut("complaints/{id}/resolve")]
    public async Task<ActionResult<ApiResponse<bool>>> ResolveComplaint(int id)
    {
        var complaint = await _context.Complaints.FindAsync(id);
        if (complaint == null) return NotFound(ApiResponse<bool>.Fail("Complaint not found", 404));

        complaint.Status = ComplaintStatus.Resolved;
        complaint.ResolvedAt = DateTime.UtcNow;
        complaint.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, "Complaint resolved successfully"));
    }

    [HttpGet("reviews")]
    public async Task<ActionResult<ApiResponse<List<AdminReviewDto>>>> GetReviews()
    {
        var reviews = await _context.Reviews
            .AsNoTracking()
            .Include(r => r.Customer)
            .Include(r => r.ProviderProfile)
                .ThenInclude(p => p!.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new AdminReviewDto
            {
                Id = r.Id,
                Customer = r.Customer != null ? r.Customer.Name : "Customer",
                Provider = r.ProviderProfile != null && r.ProviderProfile.User != null ? r.ProviderProfile.User.Name : "Provider",
                Rating = r.Rating,
                Comment = r.Comment,
                Date = r.CreatedAt.ToString("yyyy-MM-dd"),
                IsVisible = r.IsVisible
            })
            .ToListAsync();

        return Ok(ApiResponse<List<AdminReviewDto>>.Ok(reviews, "Reviews loaded successfully"));
    }

    [HttpPut("reviews/{id}/visibility")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleReviewVisibility(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return NotFound(ApiResponse<bool>.Fail("Review not found", 404));

        review.IsVisible = !review.IsVisible;
        review.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(review.IsVisible, $"Review visibility updated to {review.IsVisible}"));
    }
}

public class AdminComplaintDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Issue { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}

public class AdminReviewDto
{
    public int Id { get; set; }
    public string Customer { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public bool IsVisible { get; set; }
}

public class UpdateProviderStatusDto
{
    public string Status { get; set; } = "Active";
}
