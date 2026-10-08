using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using FixMate.Infrastructure.Persistence;
using FixMate.Infrastructure.Services.Matching;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace FixMate.Tests.Unit.Services;

public class ProviderMatchingServiceTests
{
    private readonly AppDbContext _dbContext;
    private readonly Mock<IGeoLocationService> _geoServiceMock = new();
    private readonly ProviderMatchingService _sut;

    public ProviderMatchingServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AppDbContext(options);

        _geoServiceMock
            .Setup(g => g.CalculateDistanceKm(It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>()))
            .Returns<decimal, decimal, decimal, decimal>((lat1, lon1, lat2, lon2) =>
            {
                var dLat = (double)(lat2 - lat1);
                var dLon = (double)(lon2 - lon1);
                return (decimal)Math.Round(Math.Sqrt(dLat * dLat + dLon * dLon) * 111.0, 2);
            });

        _geoServiceMock
            .Setup(g => g.EstimateArrivalMinutes(It.IsAny<decimal>()))
            .Returns<decimal>(dist => (int)Math.Max(15, Math.Ceiling((double)dist * 3.5)));

        _sut = new ProviderMatchingService(
            _dbContext,
            _geoServiceMock.Object,
            NullLogger<ProviderMatchingService>.Instance);
    }

    [Fact]
    public async Task FindBestProvider_ShouldMatchBySkill_AndRejectWrongSkillEvenIfCloser()
    {
        // Arrange
        var customerAddress = new Address
        {
            Id = 1,
            UserId = 10,
            Street = "12 Station Road",
            City = "Valsad",
            PostalCode = "396001",
            Latitude = 20.6139m,
            Longitude = 72.9342m
        };

        var acService = new Service { Id = 1, Name = "AC Repair", CategoryId = 1, BasePrice = 499 };
        var plumbingService = new Service { Id = 2, Name = "Plumbing", CategoryId = 1, BasePrice = 299 };
        await _dbContext.Services.AddRangeAsync(acService, plumbingService);

        // Rajesh: AC Repair, PIN 396001, 2 KM away
        var rajeshAddr = new Address { Id = 101, UserId = 101, City = "Valsad", PostalCode = "396001", Latitude = 20.6200m, Longitude = 72.9342m, IsDefault = true };
        var rajeshUser = new User { Id = 101, Name = "Rajesh", Email = "rajesh@test.com", Phone = "9876543210", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { rajeshAddr } };
        var rajeshProfile = new ProviderProfile
        {
            Id = 1,
            UserId = 101,
            User = rajeshUser,
            Status = ProviderStatus.Active,
            IsAvailable = true,
            ServiceRadiusKm = 10,
            RatingAverage = 4.8m,
            Skills = new List<ProviderSkill> { new() { ProviderProfileId = 1, ServiceId = 1 } }
        };

        // Vijay: Plumbing (WRONG SKILL), PIN 396001, 1 KM away (Closer!)
        var vijayAddr = new Address { Id = 102, UserId = 102, City = "Valsad", PostalCode = "396001", Latitude = 20.6150m, Longitude = 72.9342m, IsDefault = true };
        var vijayUser = new User { Id = 102, Name = "Vijay", Email = "vijay@test.com", Phone = "9876543211", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { vijayAddr } };
        var vijayProfile = new ProviderProfile
        {
            Id = 2,
            UserId = 102,
            User = vijayUser,
            Status = ProviderStatus.Active,
            IsAvailable = true,
            ServiceRadiusKm = 10,
            RatingAverage = 4.9m,
            Skills = new List<ProviderSkill> { new() { ProviderProfileId = 2, ServiceId = 2 } }
        };

        await _dbContext.Users.AddRangeAsync(rajeshUser, vijayUser);
        await _dbContext.ProviderProfiles.AddRangeAsync(rajeshProfile, vijayProfile);
        await _dbContext.SaveChangesAsync();

        _geoServiceMock.Setup(g => g.CalculateDistanceKm(20.6139m, 72.9342m, 20.6200m, 72.9342m)).Returns(2.0m);
        _geoServiceMock.Setup(g => g.CalculateDistanceKm(20.6139m, 72.9342m, 20.6150m, 72.9342m)).Returns(1.0m);

        // Act - Search for AC Repair (ServiceId = 1)
        var result = await _sut.FindBestMatchingProviderAsync(1, customerAddress);

        // Assert - Must pick Rajesh, never Vijay
        result.Should().NotBeNull();
        result!.ProviderProfileId.Should().Be(1);
        result.ProviderName.Should().Be("Rajesh");
        result.DistanceKm.Should().Be(2.0m);
    }

    [Fact]
    public async Task FindBestProvider_ShouldPrioritizeSamePinAndNearestDistance()
    {
        // Arrange
        var customerAddress = new Address
        {
            Id = 1,
            UserId = 10,
            Street = "12 Station Road",
            City = "Valsad",
            PostalCode = "396001",
            Latitude = 20.6139m,
            Longitude = 72.9342m
        };

        var acService = new Service { Id = 1, Name = "AC Repair", CategoryId = 1, BasePrice = 499 };
        await _dbContext.Services.AddAsync(acService);

        // Rajesh: AC Repair, PIN 396001, 2 KM
        var a1 = new Address { Id = 201, UserId = 201, City = "Valsad", PostalCode = "396001", Latitude = 20.62m, Longitude = 72.93m, IsDefault = true };
        var u1 = new User { Id = 201, Name = "Rajesh", Email = "u1@test.com", Phone = "111", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { a1 } };
        var p1 = new ProviderProfile { Id = 11, UserId = 201, User = u1, Status = ProviderStatus.Active, IsAvailable = true, ServiceRadiusKm = 10, RatingAverage = 4.8m, Skills = new List<ProviderSkill> { new() { ProviderProfileId = 11, ServiceId = 1 } } };

        // Amit: AC Repair, PIN 396001, 5 KM
        var a2 = new Address { Id = 202, UserId = 202, City = "Valsad", PostalCode = "396001", Latitude = 20.65m, Longitude = 72.93m, IsDefault = true };
        var u2 = new User { Id = 202, Name = "Amit", Email = "u2@test.com", Phone = "222", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { a2 } };
        var p2 = new ProviderProfile { Id = 12, UserId = 202, User = u2, Status = ProviderStatus.Active, IsAvailable = true, ServiceRadiusKm = 10, RatingAverage = 4.9m, Skills = new List<ProviderSkill> { new() { ProviderProfileId = 12, ServiceId = 1 } } };

        // Rahul: AC Repair, PIN 396002, 7 KM
        var a3 = new Address { Id = 203, UserId = 203, City = "Valsad", PostalCode = "396002", Latitude = 20.68m, Longitude = 72.93m, IsDefault = true };
        var u3 = new User { Id = 203, Name = "Rahul", Email = "u3@test.com", Phone = "333", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { a3 } };
        var p3 = new ProviderProfile { Id = 13, UserId = 203, User = u3, Status = ProviderStatus.Active, IsAvailable = true, ServiceRadiusKm = 10, RatingAverage = 4.7m, Skills = new List<ProviderSkill> { new() { ProviderProfileId = 13, ServiceId = 1 } } };

        await _dbContext.Users.AddRangeAsync(u1, u2, u3);
        await _dbContext.ProviderProfiles.AddRangeAsync(p1, p2, p3);
        await _dbContext.SaveChangesAsync();

        _geoServiceMock.Setup(g => g.CalculateDistanceKm(20.6139m, 72.9342m, 20.62m, 72.93m)).Returns(2.0m);
        _geoServiceMock.Setup(g => g.CalculateDistanceKm(20.6139m, 72.9342m, 20.65m, 72.93m)).Returns(5.0m);
        _geoServiceMock.Setup(g => g.CalculateDistanceKm(20.6139m, 72.9342m, 20.68m, 72.93m)).Returns(7.0m);

        // Act
        var result = await _sut.FindBestMatchingProviderAsync(1, customerAddress);

        // Assert - Rajesh is closest with same PIN
        result.Should().NotBeNull();
        result!.ProviderProfileId.Should().Be(11);
        result.ProviderName.Should().Be("Rajesh");
        result.DistanceKm.Should().Be(2.0m);
    }

    [Fact]
    public async Task FindBestProvider_ShouldEnforceServiceRadius()
    {
        // Arrange
        var customerAddress = new Address
        {
            Id = 1,
            UserId = 10,
            Street = "Distant Location",
            City = "Valsad",
            PostalCode = "396001",
            Latitude = 20.6139m,
            Longitude = 72.9342m
        };

        var acService = new Service { Id = 1, Name = "AC Repair", CategoryId = 1, BasePrice = 499 };
        await _dbContext.Services.AddAsync(acService);

        // Provider with 10 KM service radius
        var a = new Address { Id = 301, UserId = 301, City = "Valsad", PostalCode = "396001", Latitude = 20.80m, Longitude = 72.93m, IsDefault = true };
        var u = new User { Id = 301, Name = "Suresh", Email = "suresh@test.com", Phone = "444", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { a } };
        var p = new ProviderProfile { Id = 21, UserId = 301, User = u, Status = ProviderStatus.Active, IsAvailable = true, ServiceRadiusKm = 10, Skills = new List<ProviderSkill> { new() { ProviderProfileId = 21, ServiceId = 1 } } };

        await _dbContext.Users.AddAsync(u);
        await _dbContext.ProviderProfiles.AddAsync(p);
        await _dbContext.SaveChangesAsync();

        // Customer is 15 KM away (> 10 KM radius)
        _geoServiceMock.Setup(g => g.CalculateDistanceKm(20.6139m, 72.9342m, 20.80m, 72.93m)).Returns(15.0m);

        // Act
        var result = await _sut.FindBestMatchingProviderAsync(1, customerAddress);

        // Assert - Should be null because provider's radius is exceeded
        result.Should().BeNull();
    }

    [Fact]
    public async Task FindBestProvider_ShouldRejectUnapprovedOrUnavailableProvider()
    {
        // Arrange
        var customerAddress = new Address
        {
            Id = 1,
            UserId = 10,
            Street = "Main Street",
            City = "Valsad",
            PostalCode = "396001",
            Latitude = 20.6139m,
            Longitude = 72.9342m
        };

        var acService = new Service { Id = 1, Name = "AC Repair", CategoryId = 1, BasePrice = 499 };
        await _dbContext.Services.AddAsync(acService);

        // Unapproved provider
        var a1 = new Address { Id = 401, UserId = 401, City = "Valsad", PostalCode = "396001", IsDefault = true };
        var u1 = new User { Id = 401, Name = "Pending Provider", Email = "p1@test.com", Phone = "555", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { a1 } };
        var p1 = new ProviderProfile { Id = 31, UserId = 401, User = u1, Status = ProviderStatus.PendingApproval, IsAvailable = true, ServiceRadiusKm = 15, Skills = new List<ProviderSkill> { new() { ProviderProfileId = 31, ServiceId = 1 } } };

        // Unavailable provider (toggle off)
        var a2 = new Address { Id = 402, UserId = 402, City = "Valsad", PostalCode = "396001", IsDefault = true };
        var u2 = new User { Id = 402, Name = "Busy Provider", Email = "p2@test.com", Phone = "666", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { a2 } };
        var p2 = new ProviderProfile { Id = 32, UserId = 402, User = u2, Status = ProviderStatus.Active, IsAvailable = false, ServiceRadiusKm = 15, Skills = new List<ProviderSkill> { new() { ProviderProfileId = 32, ServiceId = 1 } } };

        await _dbContext.Users.AddRangeAsync(u1, u2);
        await _dbContext.ProviderProfiles.AddRangeAsync(p1, p2);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _sut.FindBestMatchingProviderAsync(1, customerAddress);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task FindBestProvider_WhenProviderHasActiveJob_ShouldRejectAsBusy()
    {
        // Arrange
        var customerAddress = new Address
        {
            Id = 1,
            UserId = 10,
            Street = "Main Street",
            City = "Valsad",
            PostalCode = "396001",
            Latitude = 20.6139m,
            Longitude = 72.9342m
        };

        var acService = new Service { Id = 1, Name = "AC Repair", CategoryId = 1, BasePrice = 499 };
        await _dbContext.Services.AddAsync(acService);

        var a = new Address { Id = 501, UserId = 501, City = "Valsad", PostalCode = "396001", Latitude = 20.63m, Longitude = 72.93m, IsDefault = true };
        var u = new User { Id = 501, Name = "Technician", Email = "tech@test.com", Phone = "777", Role = UserRole.Provider, IsActive = true, Addresses = new List<Address> { a } };
        var p = new ProviderProfile { Id = 41, UserId = 501, User = u, Status = ProviderStatus.Active, IsAvailable = true, ServiceRadiusKm = 15, Skills = new List<ProviderSkill> { new() { ProviderProfileId = 41, ServiceId = 1 } } };

        var ongoingJob = new ServiceRequest
        {
            Id = 999,
            CustomerId = 20,
            ProviderProfileId = 41,
            ServiceId = 1,
            AddressId = 1,
            Status = RequestStatus.InProgress,
            ScheduledDate = DateTime.UtcNow
        };

        await _dbContext.Users.AddAsync(u);
        await _dbContext.ProviderProfiles.AddAsync(p);
        await _dbContext.ServiceRequests.AddAsync(ongoingJob);
        await _dbContext.SaveChangesAsync();

        _geoServiceMock.Setup(g => g.CalculateDistanceKm(It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>())).Returns(3.0m);

        // Act
        var result = await _sut.FindBestMatchingProviderAsync(1, customerAddress);

        // Assert - Should be rejected because provider is busy with active job
        result.Should().BeNull();
    }
}
