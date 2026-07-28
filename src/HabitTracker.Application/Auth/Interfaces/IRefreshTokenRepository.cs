using HabitTracker.Domain.Entities;

namespace HabitTracker.Application.Auth.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
