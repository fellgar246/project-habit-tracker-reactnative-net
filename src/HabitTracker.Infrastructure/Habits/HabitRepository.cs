using HabitTracker.Application.Habits.Interfaces;
using HabitTracker.Domain.Entities;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Infrastructure.Habits;

public class HabitRepository(AppDbContext db) : IHabitRepository
{
    public async Task<IReadOnlyList<Habit>> ListByUserAsync(
        Guid userId,
        bool includeArchived,
        CancellationToken cancellationToken = default)
    {
        var habits = await db.Habits
            .AsNoTracking()
            .Where(h => h.UserId == userId && (includeArchived || !h.IsArchived))
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(cancellationToken);

        return habits;
    }

    public Task<Habit?> GetByIdForUserAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        db.Habits
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId, cancellationToken);

    public Task<Habit?> GetByIdForUserTrackedAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        db.Habits.FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId, cancellationToken);

    public Task<int> CountActiveByUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.Habits.CountAsync(h => h.UserId == userId && !h.IsArchived, cancellationToken);

    public async Task AddAsync(Habit habit, CancellationToken cancellationToken = default) =>
        await db.Habits.AddAsync(habit, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);

    public async Task<IReadOnlyList<(Guid HabitId, DateOnly Date)>> GetCompletedDatesByHabitIdsAsync(
        IReadOnlyCollection<Guid> habitIds,
        CancellationToken cancellationToken = default)
    {
        if (habitIds.Count == 0)
            return [];

        return await db.HabitLogs
            .AsNoTracking()
            .Where(l => habitIds.Contains(l.HabitId))
            .Select(l => new ValueTuple<Guid, DateOnly>(l.HabitId, l.Date))
            .ToListAsync(cancellationToken);
    }
}
