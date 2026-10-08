using FixMate.Infrastructure.Hubs;

namespace FixMate.API.Extensions;

/// <summary>Hub route registration kept separate so Program.cs stays clean.</summary>
public static class HubExtensions
{
    public static WebApplication MapHubs(this WebApplication app)
    {
        app.MapHub<ServiceRequestHub>("/hubs/service-requests");
        app.MapHub<NotificationHub>("/hubs/notifications");
        return app;
    }
}
