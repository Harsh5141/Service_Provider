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
}

public class UpdateProviderStatusDto
{
    public string Status { get; set; } = "Active";
}
