using FixMate.Application.Common;
using FixMate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;

    public HealthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var dbConnected = false;
        string? dbError = null;

        try
        {
            dbConnected = await _context.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            dbError = ex.Message;
        }

        var healthData = new
        {
            status = dbConnected ? "Healthy" : "Degraded",
            timestamp = DateTime.UtcNow,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
            database = new
            {
                provider = "Microsoft SQL Server",
                connected = dbConnected,
                error = dbError
            },
            version = "1.0.0"
        };

        return Ok(ApiResponse<object>.Ok(healthData, "System health status retrieved"));
    }
}

