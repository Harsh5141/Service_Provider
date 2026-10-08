using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Infrastructure.Services.Auth;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace FixMate.Tests.Unit.Services;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _sut;

    public JwtTokenServiceTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:Key", "FixMate_Super_Secret_Jwt_Signing_Key_2026_Smart_Platform!" },
                { "Jwt:Issuer", "FixMateAPI" },
                { "Jwt:Audience", "FixMateClient" },
                { "Jwt:ExpiryMinutes", "60" }
            })
            .Build();

        _sut = new JwtTokenService(configuration);
    }

    [Fact]
    public void GenerateAccessToken_ShouldReturnValidJwtString()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Name = "John Customer",
            Email = "john@fixmate.test",
            Role = UserRole.User
        };

        // Act
        var token = _sut.GenerateAccessToken(user);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        token.Split('.').Should().HaveCount(3); // Header.Payload.Signature
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnRandomBase64String()
    {
        // Act
        var token1 = _sut.GenerateRefreshToken();
        var token2 = _sut.GenerateRefreshToken();

        // Assert
        token1.Should().NotBeNullOrWhiteSpace();
        token2.Should().NotBeNullOrWhiteSpace();
        token1.Should().NotBe(token2);
    }
}
