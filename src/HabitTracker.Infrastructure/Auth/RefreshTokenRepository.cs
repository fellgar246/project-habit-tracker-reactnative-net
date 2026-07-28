using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Domain.Entities;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Infrastructure.Auth;

public class RefreshTokenRepository(AppDbContext db) : IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default) =>
        db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token, cancellationToken);

    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default) =>
        await db.RefreshTokens.AddAsync(refreshToken, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
