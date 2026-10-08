using FixMate.Application.Interfaces.Repositories;
using FixMate.Application.Interfaces.Services;
using FixMate.Infrastructure.Persistence;
using FixMate.Infrastructure.Repositories;
using FixMate.Infrastructure.Services.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FixMate.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Wires up all Infrastructure services: EF Core, repositories, external service clients.
    /// Keeps the API project clean — it only calls this one extension method.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration config)
    {
        // ── EF Core / SQL Server ──────────────────────────────────────────────
        var connectionString = config.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrEmpty(connectionString))
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    connectionString,
                    sqlOptions =>
                    {
                        sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                        // Automatically retry transient SQL Server failures (connection drops, deadlocks)
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    })
                // Log parameter values in Development — never enable in Production
                .EnableSensitiveDataLogging(false));
        }

        // ── Repositories ──────────────────────────────────────────────────────
        services.AddScoped<IUserRepository,            UserRepository>();
        services.AddScoped<IProviderRepository,        ProviderRepository>();
        services.AddScoped<IAddressRepository,         AddressRepository>();

        // ── Auth & Security Services ─────────────────────────────────────────
        services.AddScoped<ITokenService,              JwtTokenService>();
        services.AddScoped<IPasswordService,           BcryptPasswordService>();
        services.AddScoped<IAuthService,               AuthService>();
        services.AddScoped<IGeoLocationService,        FixMate.Infrastructure.Services.Geo.GeoLocationService>();
        services.AddScoped<IProviderMatchingService,   FixMate.Infrastructure.Services.Matching.ProviderMatchingService>();
        // services.AddScoped<IStorageService,   CloudinaryStorageService>();
        // services.AddScoped<IPaymentService,   RazorpayPaymentService>();
        // services.AddScoped<IEmailService,     MailKitEmailService>();
        // services.AddScoped<IPushNotificationService, FirebasePushService>();

        // ── Seeder (only injected; only called in dev from DatabaseExtensions) ─
        services.AddScoped<AppDbSeeder>();

        // ── Background Services ───────────────────────────────────────────────
        // services.AddHostedService<ServiceReminderBackgroundService>();

        return services;
    }
}

