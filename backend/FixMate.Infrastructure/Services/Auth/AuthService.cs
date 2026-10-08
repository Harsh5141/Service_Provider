using AutoMapper;
using FixMate.Application.DTOs.Auth;
using FixMate.Application.Interfaces.Repositories;
using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Domain.Exceptions;
using FixMate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixMate.Infrastructure.Services.Auth;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IProviderRepository _providerRepo;
    private readonly IPasswordService _passwordService;
    private readonly ITokenService _tokenService;
    private readonly IGeoLocationService _geoLocationService;
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public AuthService(
        IUserRepository userRepo,
        IProviderRepository providerRepo,
        IPasswordService passwordService,
        ITokenService tokenService,
        IGeoLocationService geoLocationService,
        AppDbContext context,
        IMapper mapper)
    {
        _userRepo = userRepo;
        _providerRepo = providerRepo;
        _passwordService = passwordService;
        _tokenService = tokenService;
        _geoLocationService = geoLocationService;
        _context = context;
        _mapper = mapper;
    }

    public async Task<(AuthResponseDto response, string refreshToken)> RegisterCustomerAsync(RegisterDto dto, CancellationToken ct = default)
    {
        if (await _userRepo.ExistsByEmailAsync(dto.Email, ct))
        {
            throw new DomainException("An account with this email address already exists.");
        }

        var refreshToken = _tokenService.GenerateRefreshToken();

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Phone = dto.Phone.Trim(),
            PasswordHash = _passwordService.HashPassword(dto.Password),
            Role = UserRole.User,
            IsActive = true,
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepo.AddAsync(user, ct);

        // Save Customer Service Location if provided
        var street = dto.Address ?? dto.Street;
        if (!string.IsNullOrWhiteSpace(street) || !string.IsNullOrWhiteSpace(dto.PostalCode))
        {
            var lookup = await _geoLocationService.LookupPostalCodeAsync(dto.PostalCode ?? string.Empty, dto.State, ct);
            if (!lookup.IsValid && !string.IsNullOrWhiteSpace(dto.PostalCode))
            {
                throw new DomainException(lookup.ErrorMessage ?? "PIN Code does not belong to the selected State.");
            }

            var address = new Address
            {
                UserId = user.Id,
                Label = "Default Service Location",
                Street = !string.IsNullOrWhiteSpace(street) ? street.Trim() : "Service Address",
                City = lookup.IsValid ? lookup.City : (!string.IsNullOrWhiteSpace(dto.City) ? dto.City.Trim() : "Local City"),
                State = lookup.IsValid ? lookup.State : (!string.IsNullOrWhiteSpace(dto.State) ? dto.State.Trim() : "State"),
                PostalCode = lookup.IsValid ? lookup.PostalCode : (!string.IsNullOrWhiteSpace(dto.PostalCode) ? dto.PostalCode.Trim() : "100001"),
                Latitude = lookup.Latitude ?? dto.Latitude,
                Longitude = lookup.Longitude ?? dto.Longitude,
                IsDefault = dto.IsDefaultAddress,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync(ct);
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var userDto = _mapper.Map<UserDto>(user);

        return (new AuthResponseDto
        {
            User = userDto,
            AccessToken = accessToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60)
        }, refreshToken);
    }

    public async Task<(AuthResponseDto response, string refreshToken)> RegisterProviderAsync(ProviderRegisterDto dto, CancellationToken ct = default)
    {
        if (await _userRepo.ExistsByEmailAsync(dto.Email, ct))
        {
            throw new DomainException("An account with this email address already exists.");
        }

        var refreshToken = _tokenService.GenerateRefreshToken();

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Phone = dto.Phone.Trim(),
            PasswordHash = _passwordService.HashPassword(dto.Password),
            Role = UserRole.Provider,
            IsActive = true,
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepo.AddAsync(user, ct);

        var radius = dto.ServiceRadiusKm > 0 ? dto.ServiceRadiusKm : 10;

        var providerProfile = new ProviderProfile
        {
            UserId = user.Id,
            Bio = dto.Bio.Trim(),
            ExperienceYears = dto.ExperienceYears,
            RatingAverage = 5.0m,
            RatingCount = 0,
            Status = ProviderStatus.PendingApproval,
            IsAvailable = true,
            ServiceRadiusKm = radius,
            CommissionRate = 0.15m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add Documents if provided
        if (dto.DocumentUrls != null && dto.DocumentUrls.Any())
        {
            foreach (var url in dto.DocumentUrls)
            {
                providerProfile.Documents.Add(new ProviderDocument
                {
                    DocumentType = DocumentType.Aadhaar,
                    DocumentUrl = url,
                    IsVerified = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        // Add Skills from SkillIds or Skill Names
        var selectedServiceIds = new HashSet<int>();
        if (dto.SkillIds != null && dto.SkillIds.Count > 0)
        {
            foreach (var sId in dto.SkillIds)
            {
                selectedServiceIds.Add(sId);
            }
        }

        if (dto.Skills != null && dto.Skills.Count > 0)
        {
            var allServices = await _context.Services.Include(s => s.Category).ToListAsync(ct);
            foreach (var skillName in dto.Skills)
            {
                var cleanSkill = skillName.Trim();
                var matched = allServices.Where(s =>
                    s.Name.Contains(cleanSkill, StringComparison.OrdinalIgnoreCase) ||
                    cleanSkill.Contains(s.Name, StringComparison.OrdinalIgnoreCase) ||
                    (s.Category != null && cleanSkill.Contains(s.Category.Name, StringComparison.OrdinalIgnoreCase)) ||
                    (s.Category != null && s.Category.Name.Contains(cleanSkill, StringComparison.OrdinalIgnoreCase))
                ).Select(s => s.Id);

                foreach (var mId in matched)
                {
                    selectedServiceIds.Add(mId);
                }
            }
        }

        foreach (var serviceId in selectedServiceIds)
        {
            providerProfile.Skills.Add(new ProviderSkill
            {
                ServiceId = serviceId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await _providerRepo.AddAsync(providerProfile, ct);

        // Save Provider Service Area Address
        var street = dto.ServiceAddress ?? dto.Street;
        if (!string.IsNullOrWhiteSpace(street) || !string.IsNullOrWhiteSpace(dto.PostalCode))
        {
            var lookup = await _geoLocationService.LookupPostalCodeAsync(dto.PostalCode ?? string.Empty, dto.State, ct);
            if (!lookup.IsValid && !string.IsNullOrWhiteSpace(dto.PostalCode))
            {
                throw new DomainException(lookup.ErrorMessage ?? "PIN Code does not belong to the selected State.");
            }

            var providerAddress = new Address
            {
                UserId = user.Id,
                Label = "Service Base Location",
                Street = !string.IsNullOrWhiteSpace(street) ? street.Trim() : "Service Area",
                City = lookup.IsValid ? lookup.City : (!string.IsNullOrWhiteSpace(dto.City) ? dto.City.Trim() : "Local City"),
                State = lookup.IsValid ? lookup.State : (!string.IsNullOrWhiteSpace(dto.State) ? dto.State.Trim() : "State"),
                PostalCode = lookup.IsValid ? lookup.PostalCode : (!string.IsNullOrWhiteSpace(dto.PostalCode) ? dto.PostalCode.Trim() : "100001"),
                Latitude = lookup.Latitude ?? dto.Latitude,
                Longitude = lookup.Longitude ?? dto.Longitude,
                IsDefault = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Addresses.Add(providerAddress);
            await _context.SaveChangesAsync(ct);
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var userDto = _mapper.Map<UserDto>(user);

        return (new AuthResponseDto
        {
            User = userDto,
            AccessToken = accessToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60)
        }, refreshToken);
    }

    public async Task<(AuthResponseDto response, string refreshToken)> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email, ct);
        if (user == null || !_passwordService.VerifyPassword(dto.Password, user.PasswordHash))
        {
            throw new DomainException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new DomainException("Your account has been deactivated. Please contact support.");
        }

        var refreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await _userRepo.UpdateAsync(user, ct);

        var accessToken = _tokenService.GenerateAccessToken(user);
        var userDto = _mapper.Map<UserDto>(user);

        return (new AuthResponseDto
        {
            User = userDto,
            AccessToken = accessToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60)
        }, refreshToken);
    }

    public async Task<(AuthResponseDto response, string refreshToken)> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new DomainException("Refresh token is required.");
        }

        var user = await _userRepo.GetByRefreshTokenAsync(refreshToken, ct);
        if (user == null || user.RefreshTokenExpiresAt < DateTime.UtcNow)
        {
            throw new DomainException("Invalid or expired session. Please log in again.");
        }

        var newRefreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await _userRepo.UpdateAsync(user, ct);

        var accessToken = _tokenService.GenerateAccessToken(user);
        var userDto = _mapper.Map<UserDto>(user);

        return (new AuthResponseDto
        {
            User = userDto,
            AccessToken = accessToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60)
        }, newRefreshToken);
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(refreshToken)) return;

        var user = await _userRepo.GetByRefreshTokenAsync(refreshToken, ct);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiresAt = null;
            await _userRepo.UpdateAsync(user, ct);
        }
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user == null)
        {
            throw new DomainException("User not found.");
        }

        return _mapper.Map<UserDto>(user);
    }
}
