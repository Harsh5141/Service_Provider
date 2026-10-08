using System.Security.Claims;
using FixMate.Application.Common;
using FixMate.Application.DTOs.Auth;
using FixMate.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Register a new customer.
    /// </summary>
    [HttpPost("register")]
    [EnableRateLimiting("AuthLimit")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        var (response, refreshToken) = await _authService.RegisterCustomerAsync(dto, ct);
        SetRefreshTokenCookie(refreshToken);
        return StatusCode(201, ApiResponse<AuthResponseDto>.Ok(response, "Registration successful", 201));
    }

    /// <summary>
    /// Register a new service provider with skills/experience.
    /// </summary>
    [HttpPost("register/provider")]
    [EnableRateLimiting("AuthLimit")]
    public async Task<IActionResult> RegisterProvider([FromBody] ProviderRegisterDto dto, CancellationToken ct)
    {
        var (response, refreshToken) = await _authService.RegisterProviderAsync(dto, ct);
        SetRefreshTokenCookie(refreshToken);
        return StatusCode(201, ApiResponse<AuthResponseDto>.Ok(response, "Provider registration submitted successfully", 201));
    }

    /// <summary>
    /// Login user or provider with email and password.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("AuthLimit")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var (response, refreshToken) = await _authService.LoginAsync(dto, ct);
        SetRefreshTokenCookie(refreshToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Login successful"));
    }

    /// <summary>
    /// Refresh access token using httpOnly refresh token cookie.
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken(CancellationToken ct)
    {
        var token = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Refresh token is required.", 400));
        }

        var (response, newRefreshToken) = await _authService.RefreshTokenAsync(token, ct);
        SetRefreshTokenCookie(newRefreshToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Token refreshed successfully"));
    }

    /// <summary>
    /// Logout and invalidate refresh token.
    /// </summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var token = Request.Cookies["refreshToken"];
        await _authService.LogoutAsync(token, ct);

        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax
        });

        return Ok(ApiResponse<bool>.Ok(true, "Logged out successfully"));
    }

    /// <summary>
    /// Get the current authenticated user profile.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<UserDto>.Fail("Unauthorized access.", 401));
        }

        var user = await _authService.GetCurrentUserAsync(userId, ct);
        return Ok(ApiResponse<UserDto>.Ok(user, "User profile retrieved successfully"));
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(7)
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
