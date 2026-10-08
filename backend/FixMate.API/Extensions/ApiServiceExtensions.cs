using FixMate.Application.Common;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;

namespace FixMate.API.Extensions;

/// <summary>
/// Registers all API-layer services: JWT auth, Swagger, CORS, rate limiting, controllers.
/// </summary>
public static class ApiServiceExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddControllers()
            .AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                // Serialize enums as strings for readability in responses
                o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            });

        services.AddJwtAuthentication(config);
        services.AddSwaggerDocumentation();
        services.AddCorsPolicy(config);
        services.AddRateLimitingPolicy();
        services.AddSignalR();

        return services;
    }

    // ── JWT ───────────────────────────────────────────────────────────────────
    private static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration config)
    {
        var key = config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    ValidateIssuer           = true,
                    ValidIssuer              = config["Jwt:Issuer"],
                    ValidateAudience         = true,
                    ValidAudience            = config["Jwt:Audience"],
                    ValidateLifetime         = true,
                    ClockSkew                = TimeSpan.Zero // No tolerance for expiry
                };

                // Allow JWT via query-string for SignalR connections (websockets can't set headers)
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        var accessToken = ctx.Request.Query["access_token"];
                        var path        = ctx.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            ctx.Token = accessToken;
                        return Task.CompletedTask;
                    }
                };
            });

        // Role-based authorization policies
        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly",    p => p.RequireRole("Admin"));
            options.AddPolicy("ProviderOnly", p => p.RequireRole("Provider"));
            options.AddPolicy("UserOnly",     p => p.RequireRole("User"));
            options.AddPolicy("ProviderOrAdmin", p => p.RequireRole("Provider", "Admin"));
        });

        return services;
    }

    // ── Swagger ───────────────────────────────────────────────────────────────
    private static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title   = "FixMate API",
                Version = "v1",
                Description = "Smart Home & Local Service Management Platform"
            });

            // Add JWT bearer button in Swagger UI
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name         = "Authorization",
                Type         = SecuritySchemeType.Http,
                Scheme       = "bearer",
                BearerFormat = "JWT",
                In           = ParameterLocation.Header,
                Description  = "Enter: Bearer {token}"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }

    // ── CORS ──────────────────────────────────────────────────────────────────
    private static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration config)
    {
        var origins = config.GetSection("AllowedOrigins").Get<string[]>() ?? [];

        services.AddCors(options =>
        {
            options.AddPolicy("FixMatePolicy", policy =>
                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials()); // Required for SignalR
        });

        return services;
    }

    // ── Rate Limiting (built-in .NET 7+) ─────────────────────────────────────
    private static IServiceCollection AddRateLimitingPolicy(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            // Global sliding window: 100 requests / 60s per IP
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit          = 100,
                        Window               = TimeSpan.FromSeconds(60),
                        SegmentsPerWindow    = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit           = 10
                    }));

            // Stricter limit on auth endpoints to slow brute-force
            options.AddFixedWindowLimiter("AuthLimit", o =>
            {
                o.PermitLimit         = 10;
                o.Window              = TimeSpan.FromMinutes(1);
                o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                o.QueueLimit          = 0;
            });

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        return services;
    }
}
