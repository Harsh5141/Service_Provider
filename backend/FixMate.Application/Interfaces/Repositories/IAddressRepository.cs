using FixMate.Domain.Entities;

namespace FixMate.Application.Interfaces.Repositories;

public interface IAddressRepository
{
    Task<List<Address>> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<Address?> GetByIdAsync(int id, int userId, CancellationToken ct = default);
    Task<Address?> GetDefaultByUserIdAsync(int userId, CancellationToken ct = default);
    Task<Address> AddAsync(Address address, CancellationToken ct = default);
    Task UpdateAsync(Address address, CancellationToken ct = default);
    Task DeleteAsync(Address address, CancellationToken ct = default);
    Task SetDefaultAddressAsync(int addressId, int userId, CancellationToken ct = default);
}
