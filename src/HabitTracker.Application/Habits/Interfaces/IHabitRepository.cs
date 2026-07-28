using HabitTracker.Domain.Entities;

namespace HabitTracker.Application.Habits.Interfaces;

public interface IHabitRepository
{
    Task<IReadOnlyList<Habit>> ListByUserAsync(
        Guid userId,
        bool includeArchived,
        CancellationToken cancellationToken = default);

    Task<Habit?> GetByIdForUserAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<Habit?> GetByIdForUserTrackedAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<int> CountActiveByUserAsync(Guid userId, CancellationToken cancellationToken = default);

    Task AddAsync(Habit habit, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
