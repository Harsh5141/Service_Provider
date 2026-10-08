using FixMate.API.Extensions;
using FixMate.API.Middleware;
using FixMate.Application;
using FixMate.Infrastructure;
using Serilog;

// ─── Bootstrap logger (captures startup errors before DI is ready) ───────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting FixMate API");

    var builder = WebApplication.CreateBuilder(args);

    // ─── Serilog (replaces default logging) ───────────────────────────────────
    builder.Host.UseSerilog((ctx, services, config) =>
        config.ReadFrom.Configuration(ctx.Configuration)
              .ReadFrom.Services(services)
              .Enrich.FromLogContext());

    // ─── Register application layers ──────────────────────────────────────────
    builder.Services.AddApplicationServices();          // Application layer DI
    builder.Services.AddInfrastructureServices(builder.Configuration); // Infra DI

    // ─── API-layer services ────────────────────────────────────────────────────
    builder.Services.AddApiServices(builder.Configuration);

    var app = builder.Build();

    // ─── Middleware pipeline ───────────────────────────────────────────────────
    app.UseGlobalExceptionHandler();   // Always first — catches everything below

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "FixMate API v1");
            c.RoutePrefix = string.Empty; // Swagger at root in dev
        });
    }

    app.UseSerilogRequestLogging(); // Log HTTP request/response summary

    app.UseHttpsRedirection();
    app.UseCors("FixMatePolicy");

    app.UseRateLimiter();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHubs();   // SignalR hubs registered via extension method

    // ─── Auto-run EF migrations and seed on startup (dev only) ───────────────
    if (app.Environment.IsDevelopment())
    {
        await app.Services.InitialiseDatabaseAsync();
    }

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
