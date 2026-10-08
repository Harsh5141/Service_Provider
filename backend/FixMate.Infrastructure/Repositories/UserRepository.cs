using FixMate.Application.Interfaces.Repositories;
using FixMate.Domain.Entities;
using FixMate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixMate.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.Trim().ToLower(), ct);
    }

    public async Task<User?> GetByRefreshTokenAsync(string token, CancellationToken ct = default)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.RefreshToken == token, ct);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _db.Users.AnyAsync(u => u.Email.ToLower() == email.Trim().ToLower(), ct);
    }

    public async Task<User> AddAsync(User user, CancellationToken ct = default)
    {
        await _db.Users.AddAsync(user, ct);
        await _db.SaveChangesAsync(ct);
        return user;
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _db.SaveChangesAsync(ct);
    }
}

