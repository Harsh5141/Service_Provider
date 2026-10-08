using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FixMate.Infrastructure.Hubs;

/// <summary>
/// Real-time hub for service request status updates.
/// Clients join a group named by their requestId so updates are targeted.
/// Providers get updates for their assigned jobs; users for their requests.
/// </summary>
[Authorize]
public class ServiceRequestHub : Hub
{
    /// <summary>Called by the client to subscribe to a specific request's updates.</summary>
    public async Task JoinRequestGroup(string requestId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"request-{requestId}");

    public async Task LeaveRequestGroup(string requestId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"request-{requestId}");

    /// <summary>Called by the client (provider) to subscribe to all their assigned jobs.</summary>
    public async Task JoinProviderGroup(string providerId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"provider-{providerId}");
}
