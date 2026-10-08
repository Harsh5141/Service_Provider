using AutoMapper;
using FixMate.Application.DTOs.Auth;
using FixMate.Application.DTOs.Locations;
using FixMate.Application.Interfaces.Repositories;
using FixMate.Application.Interfaces.Services;
using FixMate.Application.Mappings;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Domain.Exceptions;
using FixMate.Infrastructure.Persistence;
using FixMate.Infrastructure.Services.Auth;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace FixMate.Tests.Unit.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IProviderRepository> _providerRepoMock = new();
    private readonly Mock<IPasswordService> _passwordServiceMock = new();
    private readonly Mock<ITokenService> _tokenServiceMock = new();
    private readonly Mock<IGeoLocationService> _geoServiceMock = new();
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AppDbContext(options);

        _geoServiceMock
            .Setup(g => g.GetApproximateCoordinates(It.IsAny<string>(), It.IsAny<string>()))
            .Returns((20.6139m, 72.9342m));

        _geoServiceMock
            .Setup(g => g.LookupPostalCodeAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PinLookupResponseDto
            {
                IsValid = true,
                PostalCode = "396001",
                City = "Valsad",
                District = "Valsad",
                State = "Gujarat",
                Latitude = 20.6139m,
                Longitude = 72.9342m
            });

        _sut = new AuthService(
            _userRepoMock.Object,
            _providerRepoMock.Object,
            _passwordServiceMock.Object,
            _tokenServiceMock.Object,
            _geoServiceMock.Object,
            _dbContext,
            _mapper);
    }

    [Fact]
    public async Task RegisterCustomer_WhenEmailAlreadyExists_ShouldThrowDomainException()
    {
        // Arrange
        var dto = new RegisterDto
        {
            Name = "John Doe",
            Email = "john@fixmate.test",
            Phone = "+919876543210",
            Password = "Password123!"
        };

        _userRepoMock
            .Setup(r => r.ExistsByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var act = () => _sut.RegisterCustomerAsync(dto);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*email address already exists*");
    }

    [Fact]
    public async Task RegisterCustomer_WhenValid_ShouldCreateUserAndReturnTokens()
    {
        // Arrange
        var dto = new RegisterDto
        {
            Name = "John Doe",
            Email = "john@fixmate.test",
            Phone = "+919876543210",
            Password = "Password123!"
        };

        _userRepoMock
            .Setup(r => r.ExistsByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _passwordServiceMock
            .Setup(p => p.HashPassword(dto.Password))
            .Returns("hashed_pw");

        _tokenServiceMock
            .Setup(t => t.GenerateRefreshToken())
            .Returns("refresh_token_123");

        _tokenServiceMock
            .Setup(t => t.GenerateAccessToken(It.IsAny<User>()))
            .Returns("access_token_jwt");

        // Act
        var (response, refreshToken) = await _sut.RegisterCustomerAsync(dto);

        // Assert
        response.Should().NotBeNull();
        response.AccessToken.Should().Be("access_token_jwt");
        response.User.Email.Should().Be("john@fixmate.test");
        refreshToken.Should().Be("refresh_token_123");
        _userRepoMock.Verify(r => r.AddAsync(It.Is<User>(u => u.Email == "john@fixmate.test" && u.Role == UserRole.User), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnTokens()
    {
        // Arrange
        var dto = new LoginDto
        {
            Email = "john@fixmate.test",
            Password = "Password123!"
        };

        var existingUser = new User
        {
            Id = 10,
            Name = "John Doe",
            Email = "john@fixmate.test",
            PasswordHash = "hashed_pw",
            Role = UserRole.User,
            IsActive = true
        };

        _userRepoMock
            .Setup(r => r.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _passwordServiceMock
            .Setup(p => p.VerifyPassword(dto.Password, "hashed_pw"))
            .Returns(true);

        _tokenServiceMock
            .Setup(t => t.GenerateRefreshToken())
            .Returns("new_refresh_token");

        _tokenServiceMock
            .Setup(t => t.GenerateAccessToken(existingUser))
            .Returns("new_access_token");

        // Act
        var (response, refreshToken) = await _sut.LoginAsync(dto);

        // Assert
        response.Should().NotBeNull();
        response.AccessToken.Should().Be("new_access_token");
        refreshToken.Should().Be("new_refresh_token");
        _userRepoMock.Verify(r => r.UpdateAsync(It.Is<User>(u => u.Id == 10 && u.RefreshToken == "new_refresh_token"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldThrowDomainException()
    {
        // Arrange
        var dto = new LoginDto
        {
            Email = "john@fixmate.test",
            Password = "WrongPassword!"
        };

        var existingUser = new User
        {
            Id = 10,
            Name = "John Doe",
            Email = "john@fixmate.test",
            PasswordHash = "hashed_pw",
            Role = UserRole.User,
            IsActive = true
        };

        _userRepoMock
            .Setup(r => r.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _passwordServiceMock
            .Setup(p => p.VerifyPassword(dto.Password, "hashed_pw"))
            .Returns(false);

        // Act
        var act = () => _sut.LoginAsync(dto);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task RegisterCustomer_WithAddress_ShouldPersistAddressAndMarkAsDefault()
    {
        // Arrange
        var dto = new RegisterDto
        {
            Name = "Priya Sharma",
            Email = "priya@fixmate.test",
            Phone = "+919876543211",
            Password = "Password123!",
            Address = "12 Station Road",
            City = "Valsad",
            State = "Gujarat",
            PostalCode = "396001",
            IsDefaultAddress = true
        };

        _userRepoMock
            .Setup(r => r.ExistsByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _passwordServiceMock
            .Setup(p => p.HashPassword(dto.Password))
            .Returns("hashed_pw");

        _tokenServiceMock
            .Setup(t => t.GenerateRefreshToken())
            .Returns("refresh_token_xyz");

        _tokenServiceMock
            .Setup(t => t.GenerateAccessToken(It.IsAny<User>()))
            .Returns("access_token_jwt");

        // Act
        var (response, refreshToken) = await _sut.RegisterCustomerAsync(dto);

        // Assert
        response.Should().NotBeNull();
        _userRepoMock.Verify(r => r.AddAsync(It.Is<User>(u => u.Email == "priya@fixmate.test"), It.IsAny<CancellationToken>()), Times.Once);
        var savedAddr = _dbContext.Addresses.FirstOrDefault(a => a.City == "Valsad");
        savedAddr.Should().NotBeNull();
        savedAddr!.PostalCode.Should().Be("396001");
        savedAddr.IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task RegisterProvider_WithServiceAreaAndSkills_ShouldPersistProfileAndSkills()
    {
        // Arrange
        var category = new ServiceCategory { Id = 1, Name = "Home" };
        var service1 = new Service { Id = 1, Name = "AC Repair", CategoryId = 1, Category = category, BasePrice = 499 };
        var service2 = new Service { Id = 2, Name = "Plumbing", CategoryId = 1, Category = category, BasePrice = 299 };
        await _dbContext.Services.AddRangeAsync(service1, service2);
        await _dbContext.SaveChangesAsync();

        var dto = new ProviderRegisterDto
        {
            Name = "Rajesh Kumar",
            Email = "rajesh@fixmate.test",
            Phone = "+919876543212",
            Password = "Password123!",
            ExperienceYears = 6,
            Bio = "Professional AC technician",
            ServiceAddress = "12 Station Road",
            City = "Valsad",
            State = "Gujarat",
            PostalCode = "396001",
            ServiceRadiusKm = 15,
            SkillIds = new List<int> { 1, 2 }
        };

        _userRepoMock
            .Setup(r => r.ExistsByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _passwordServiceMock
            .Setup(p => p.HashPassword(dto.Password))
            .Returns("hashed_pw");

        _tokenServiceMock
            .Setup(t => t.GenerateRefreshToken())
            .Returns("refresh_token_prov");

        _tokenServiceMock
            .Setup(t => t.GenerateAccessToken(It.IsAny<User>()))
            .Returns("access_token_jwt");

        // Act
        var (response, refreshToken) = await _sut.RegisterProviderAsync(dto);

        // Assert
        response.Should().NotBeNull();
        _providerRepoMock.Verify(r => r.AddAsync(It.Is<ProviderProfile>(p =>
            p.ServiceRadiusKm == 15 &&
            p.Skills.Count == 2), It.IsAny<CancellationToken>()), Times.Once);
    }
}

