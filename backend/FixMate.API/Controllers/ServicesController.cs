using FixMate.Application.Common;
using FixMate.Application.DTOs.Services;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<ServiceCategoryDto>>>> GetCategories()
    {
        var categories = await _context.ServiceCategories
            .AsNoTracking()
            .Include(c => c.Services.Where(s => s.IsActive))
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new ServiceCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                IconName = c.IconName,
                ImageUrl = c.ImageUrl,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
                Services = c.Services.Select(s => new ServiceDto
                {
                    Id = s.Id,
                    CategoryId = s.CategoryId,
                    CategoryName = c.Name,
                    Name = s.Name,
                    Description = s.Description,
                    BasePrice = s.BasePrice,
                    EstimatedDurationMinutes = s.EstimatedDurationMinutes,
                    IsActive = s.IsActive,
                    ImageUrl = s.ImageUrl
                }).ToList()
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ServiceCategoryDto>>.Ok(categories, "Categories retrieved successfully"));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ServiceDto>>>> GetServices([FromQuery] int? categoryId, [FromQuery] string? search)
    {
        var query = _context.Services
            .AsNoTracking()
            .Include(s => s.Category)
            .Where(s => s.IsActive);

        if (categoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => s.Name.Contains(search) || s.Description.Contains(search));
        }

        var services = await query
            .Select(s => new ServiceDto
            {
                Id = s.Id,
                CategoryId = s.CategoryId,
                CategoryName = s.Category != null ? s.Category.Name : string.Empty,
                Name = s.Name,
                Description = s.Description,
                BasePrice = s.BasePrice,
                EstimatedDurationMinutes = s.EstimatedDurationMinutes,
                IsActive = s.IsActive,
                ImageUrl = s.ImageUrl
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ServiceDto>>.Ok(services, "Services retrieved successfully"));
    }

    [HttpGet("providers")]
    public async Task<ActionResult<ApiResponse<List<PublicProviderDto>>>> GetPublicProviders([FromQuery] int? categoryId)
    {
        var query = _context.ProviderProfiles
            .AsNoTracking()
            .Include(p => p.User)
                .ThenInclude(u => u!.Addresses)
            .Include(p => p.Skills)
                .ThenInclude(s => s.Service)
                    .ThenInclude(s => s!.Category)
            .Where(p => p.Status == ProviderStatus.Active && p.User != null && p.User.IsActive);

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            query = query.Where(p => p.Skills.Any(s => s.Service != null && s.Service.CategoryId == categoryId.Value));
        }

        var list = await query
            .OrderByDescending(p => p.RatingAverage)
            .ToListAsync();

        var providers = list.Select(p =>
        {
            var defaultAddr = p.User?.Addresses.FirstOrDefault(a => a.IsDefault) ?? p.User?.Addresses.FirstOrDefault();
            var skills = p.Skills.Where(s => s.Service != null).Select(s => s.Service!.Name).ToList();
            var catNames = p.Skills.Where(s => s.Service != null && s.Service.Category != null).Select(s => s.Service!.Category!.Name).Distinct().ToList();
            var primaryCatId = categoryId.HasValue && categoryId.Value > 0
                ? categoryId.Value
                : (p.Skills.FirstOrDefault(s => s.Service != null)?.Service?.CategoryId ?? 1);

            return new PublicProviderDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.User != null ? p.User.Name : "Provider",
                Email = p.User != null ? p.User.Email : "",
                Phone = p.User != null ? p.User.Phone : "",
                Bio = p.Bio,
                Specialization = catNames.Count > 0 ? string.Join(" & ", catNames) + " Specialist" : "Certified Service Specialist",
                ExperienceYears = p.ExperienceYears,
                ServiceRadiusKm = p.ServiceRadiusKm,
                Street = defaultAddr?.Street ?? "Station Road",
                City = defaultAddr?.City ?? "Valsad",
                State = defaultAddr?.State ?? "Gujarat",
                PostalCode = defaultAddr?.PostalCode ?? "396001",
                RatingAverage = p.RatingAverage,
                RatingCount = p.RatingCount,
                CompletedJobsCount = p.RatingCount > 0 ? p.RatingCount : 50,
                IsAvailable = p.IsAvailable,
                Skills = skills,
                CategoryNames = catNames,
                CategoryId = primaryCatId
            };
        }).ToList();

        return Ok(ApiResponse<List<PublicProviderDto>>.Ok(providers, "Providers retrieved successfully"));
    }

    [HttpGet("providers/{id}")]
    public async Task<ActionResult<ApiResponse<PublicProviderDto>>> GetPublicProviderById(int id)
    {
        var p = await _context.ProviderProfiles
            .AsNoTracking()
            .Include(p => p.User)
                .ThenInclude(u => u!.Addresses)
            .Include(p => p.Skills)
                .ThenInclude(s => s.Service)
                    .ThenInclude(s => s!.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null)
        {
            return NotFound(ApiResponse<PublicProviderDto>.Fail("Provider not found", 404));
        }

        var defaultAddr = p.User?.Addresses.FirstOrDefault(a => a.IsDefault) ?? p.User?.Addresses.FirstOrDefault();
        var skills = p.Skills.Where(s => s.Service != null).Select(s => s.Service!.Name).ToList();
        var catNames = p.Skills.Where(s => s.Service != null && s.Service.Category != null).Select(s => s.Service!.Category!.Name).Distinct().ToList();

        var dto = new PublicProviderDto
        {
            Id = p.Id,
            UserId = p.UserId,
            Name = p.User != null ? p.User.Name : "Provider",
            Email = p.User != null ? p.User.Email : "",
            Phone = p.User != null ? p.User.Phone : "",
            Bio = p.Bio,
            Specialization = catNames.Count > 0 ? string.Join(" & ", catNames) + " Specialist" : "Certified Service Specialist",
            ExperienceYears = p.ExperienceYears,
            ServiceRadiusKm = p.ServiceRadiusKm,
            Street = defaultAddr?.Street ?? "Station Road",
            City = defaultAddr?.City ?? "Valsad",
            State = defaultAddr?.State ?? "Gujarat",
            PostalCode = defaultAddr?.PostalCode ?? "396001",
            RatingAverage = p.RatingAverage,
            RatingCount = p.RatingCount,
            CompletedJobsCount = p.RatingCount > 0 ? p.RatingCount : 50,
            IsAvailable = p.IsAvailable,
            Skills = skills,
            CategoryNames = catNames,
            CategoryId = p.Skills.FirstOrDefault(s => s.Service != null)?.Service?.CategoryId ?? 1
        };

        return Ok(ApiResponse<PublicProviderDto>.Ok(dto, "Provider retrieved successfully"));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ServiceDto>>> GetServiceById(int id)
    {
        var service = await _context.Services
            .AsNoTracking()
            .Include(s => s.Category)
            .Where(s => s.Id == id)
            .Select(s => new ServiceDto
            {
                Id = s.Id,
                CategoryId = s.CategoryId,
                CategoryName = s.Category != null ? s.Category.Name : string.Empty,
                Name = s.Name,
                Description = s.Description,
                BasePrice = s.BasePrice,
                EstimatedDurationMinutes = s.EstimatedDurationMinutes,
                IsActive = s.IsActive,
                ImageUrl = s.ImageUrl
            })
            .FirstOrDefaultAsync();

        if (service == null)
        {
            return NotFound(ApiResponse<ServiceDto>.Fail("Service not found", 404));
        }

        return Ok(ApiResponse<ServiceDto>.Ok(service, "Service retrieved successfully"));
    }

    // ── CATEGORY MANAGEMENT (ADMIN) ──────────────────────────────────────────

    [HttpPost("categories")]
    public async Task<ActionResult<ApiResponse<ServiceCategoryDto>>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(ApiResponse<ServiceCategoryDto>.Fail("Category name is required"));
        }

        var slug = dto.Name.ToLowerInvariant().Replace(" ", "-").Replace("&", "and");
        var category = new ServiceCategory
        {
            Name = dto.Name.Trim(),
            Slug = slug,
            Description = dto.Description?.Trim() ?? string.Empty,
            IconName = string.IsNullOrWhiteSpace(dto.IconName) ? "Zap" : dto.IconName.Trim(),
            ImageUrl = dto.ImageUrl,
            DisplayOrder = dto.DisplayOrder > 0 ? dto.DisplayOrder : (await _context.ServiceCategories.CountAsync() + 1),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ServiceCategories.Add(category);
        await _context.SaveChangesAsync();

        var result = new ServiceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            IconName = category.IconName,
            ImageUrl = category.ImageUrl,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive,
            Services = new List<ServiceDto>()
        };

        return Ok(ApiResponse<ServiceCategoryDto>.Ok(result, "Category created successfully"));
    }

    [HttpPut("categories/{id}")]
    public async Task<ActionResult<ApiResponse<ServiceCategoryDto>>> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _context.ServiceCategories.FindAsync(id);
        if (category == null)
        {
            return NotFound(ApiResponse<ServiceCategoryDto>.Fail("Category not found", 404));
        }

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            category.Name = dto.Name.Trim();
            category.Slug = dto.Name.ToLowerInvariant().Replace(" ", "-").Replace("&", "and");
        }

        category.Description = dto.Description?.Trim() ?? category.Description;
        if (!string.IsNullOrWhiteSpace(dto.IconName)) category.IconName = dto.IconName.Trim();
        if (dto.DisplayOrder > 0) category.DisplayOrder = dto.DisplayOrder;
        category.IsActive = dto.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var result = new ServiceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            IconName = category.IconName,
            ImageUrl = category.ImageUrl,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive
        };

        return Ok(ApiResponse<ServiceCategoryDto>.Ok(result, "Category updated successfully"));
    }

    [HttpDelete("categories/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCategory(int id)
    {
        var category = await _context.ServiceCategories
            .Include(c => c.Services)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Category not found", 404));
        }

        if (category.Services.Any())
        {
            category.IsActive = false;
            foreach (var s in category.Services)
            {
                s.IsActive = false;
            }
        }
        else
        {
            _context.ServiceCategories.Remove(category);
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Category deleted successfully"));
    }

    // ── SERVICE MANAGEMENT (ADMIN) ───────────────────────────────────────────

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ServiceDto>>> CreateService([FromBody] CreateServiceDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(ApiResponse<ServiceDto>.Fail("Service name is required"));
        if (dto.CategoryId <= 0) return BadRequest(ApiResponse<ServiceDto>.Fail("Valid Category ID is required"));

        var cat = await _context.ServiceCategories.FindAsync(dto.CategoryId);
        if (cat == null) return BadRequest(ApiResponse<ServiceDto>.Fail("Selected category does not exist"));

        var service = new Service
        {
            CategoryId = dto.CategoryId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            BasePrice = dto.BasePrice > 0 ? dto.BasePrice : 199.00m,
            EstimatedDurationMinutes = dto.EstimatedDurationMinutes > 0 ? dto.EstimatedDurationMinutes : 45,
            ImageUrl = dto.ImageUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        var result = new ServiceDto
        {
            Id = service.Id,
            CategoryId = service.CategoryId,
            CategoryName = cat.Name,
            Name = service.Name,
            Description = service.Description,
            BasePrice = service.BasePrice,
            EstimatedDurationMinutes = service.EstimatedDurationMinutes,
            IsActive = service.IsActive,
            ImageUrl = service.ImageUrl
        };

        return Ok(ApiResponse<ServiceDto>.Ok(result, "Service created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ServiceDto>>> UpdateService(int id, [FromBody] UpdateServiceDto dto)
    {
        var service = await _context.Services.Include(s => s.Category).FirstOrDefaultAsync(s => s.Id == id);
        if (service == null) return NotFound(ApiResponse<ServiceDto>.Fail("Service not found", 404));

        if (dto.CategoryId > 0 && dto.CategoryId != service.CategoryId)
        {
            var cat = await _context.ServiceCategories.FindAsync(dto.CategoryId);
            if (cat != null) service.CategoryId = dto.CategoryId;
        }

        if (!string.IsNullOrWhiteSpace(dto.Name)) service.Name = dto.Name.Trim();
        service.Description = dto.Description?.Trim() ?? service.Description;
        if (dto.BasePrice > 0) service.BasePrice = dto.BasePrice;
        if (dto.EstimatedDurationMinutes > 0) service.EstimatedDurationMinutes = dto.EstimatedDurationMinutes;
        service.IsActive = dto.IsActive;
        service.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var result = new ServiceDto
        {
            Id = service.Id,
            CategoryId = service.CategoryId,
            CategoryName = service.Category?.Name ?? string.Empty,
            Name = service.Name,
            Description = service.Description,
            BasePrice = service.BasePrice,
            EstimatedDurationMinutes = service.EstimatedDurationMinutes,
            IsActive = service.IsActive,
            ImageUrl = service.ImageUrl
        };

        return Ok(ApiResponse<ServiceDto>.Ok(result, "Service updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteService(int id)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null) return NotFound(ApiResponse<bool>.Fail("Service not found", 404));

        service.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, "Service deleted successfully"));
    }
}
