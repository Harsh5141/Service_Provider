using FixMate.Application.Interfaces.Repositories;
using FixMate.Domain.Entities;
using FixMate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixMate.Infrastructure.Repositories;

public class AddressRepository : IAddressRepository
{
    private readonly AppDbContext _context;

    public AddressRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Address>> GetByUserIdAsync(int userId, CancellationToken ct = default)
    {
        return await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Address?> GetByIdAsync(int id, int userId, CancellationToken ct = default)
    {
        return await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
    }

    public async Task<Address?> GetDefaultByUserIdAsync(int userId, CancellationToken ct = default)
    {
        var defaultAddr = await _context.Addresses
            .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault, ct);

        if (defaultAddr == null)
        {
            // Fallback to the most recent address
            defaultAddr = await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(ct);
        }

        return defaultAddr;
    }

    public async Task<Address> AddAsync(Address address, CancellationToken ct = default)
    {
        if (address.IsDefault)
        {
            // Unset previous defaults
            var existingDefaults = await _context.Addresses
                .Where(a => a.UserId == address.UserId && a.IsDefault)
                .ToListAsync(ct);

            foreach (var d in existingDefaults)
            {
                d.IsDefault = false;
                d.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            // If user has no other addresses, make this the default
            var hasAddresses = await _context.Addresses
                .AnyAsync(a => a.UserId == address.UserId, ct);
            if (!hasAddresses)
            {
                address.IsDefault = true;
            }
        }

        address.CreatedAt = DateTime.UtcNow;
        address.UpdatedAt = DateTime.UtcNow;
        _context.Addresses.Add(address);
        await _context.SaveChangesAsync(ct);
        return address;
    }

    public async Task UpdateAsync(Address address, CancellationToken ct = default)
    {
        if (address.IsDefault)
        {
            var otherDefaults = await _context.Addresses
                .Where(a => a.UserId == address.UserId && a.Id != address.Id && a.IsDefault)
                .ToListAsync(ct);

            foreach (var d in otherDefaults)
            {
                d.IsDefault = false;
                d.UpdatedAt = DateTime.UtcNow;
            }
        }

        address.UpdatedAt = DateTime.UtcNow;
        _context.Addresses.Update(address);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Address address, CancellationToken ct = default)
    {
        address.IsDeleted = true;
        address.DeletedAt = DateTime.UtcNow;
        address.UpdatedAt = DateTime.UtcNow;
        _context.Addresses.Update(address);

        if (address.IsDefault)
        {
            // Promote next available address to default
            var nextAddress = await _context.Addresses
                .Where(a => a.UserId == address.UserId && a.Id != address.Id && !a.IsDeleted)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (nextAddress != null)
            {
                nextAddress.IsDefault = true;
                nextAddress.UpdatedAt = DateTime.UtcNow;
                _context.Addresses.Update(nextAddress);
            }
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task SetDefaultAddressAsync(int addressId, int userId, CancellationToken ct = default)
    {
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .ToListAsync(ct);

        foreach (var a in addresses)
        {
            a.IsDefault = (a.Id == addressId);
            a.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);
    }
}
