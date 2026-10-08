using FixMate.Application.DTOs.Auth;

namespace FixMate.Application.Interfaces.Services;

public interface IAuthService
{
    Task<(AuthResponseDto response, string refreshToken)> RegisterCustomerAsync(RegisterDto dto, CancellationToken ct = default);
    Task<(AuthResponseDto response, string refreshToken)> RegisterProviderAsync(ProviderRegisterDto dto, CancellationToken ct = default);
    Task<(AuthResponseDto response, string refreshToken)> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<(AuthResponseDto response, string refreshToken)> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string? refreshToken, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default);
}

