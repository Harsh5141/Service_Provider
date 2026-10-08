using FixMate.Application.Interfaces.Repositories;
using FixMate.Domain.Entities;
using FixMate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixMate.Infrastructure.Repositories;

public class ProviderRepository : IProviderRepository
{
    private readonly AppDbContext _db;

    public ProviderRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ProviderProfile?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.ProviderProfiles
            .Include(p => p.User)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<ProviderProfile?> GetByUserIdAsync(int userId, CancellationToken ct = default)
    {
        return await _db.ProviderProfiles
            .Include(p => p.User)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
    }

    public async Task<ProviderProfile> AddAsync(ProviderProfile profile, CancellationToken ct = default)
    {
        await _db.ProviderProfiles.AddAsync(profile, ct);
        await _db.SaveChangesAsync(ct);
        return profile;
    }

    public async Task UpdateAsync(ProviderProfile profile, CancellationToken ct = default)
    {
        profile.UpdatedAt = DateTime.UtcNow;
        _db.ProviderProfiles.Update(profile);
        await _db.SaveChangesAsync(ct);
    }
}

