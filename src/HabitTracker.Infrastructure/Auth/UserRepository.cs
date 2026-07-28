using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Domain.Entities;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Infrastructure.Auth;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default) =>
        db.Users.AnyAsync(u => u.Email == email, cancellationToken);

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public async Task AddAsync(User user, CancellationToken cancellationToken = default) =>
        await db.Users.AddAsync(user, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
