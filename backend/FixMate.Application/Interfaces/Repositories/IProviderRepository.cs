using FixMate.Domain.Entities;

namespace FixMate.Application.Interfaces.Repositories;

public interface IProviderRepository
{
    Task<ProviderProfile?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ProviderProfile?> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<ProviderProfile> AddAsync(ProviderProfile profile, CancellationToken ct = default);
    Task UpdateAsync(ProviderProfile profile, CancellationToken ct = default);
}

