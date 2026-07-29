using FluentValidation;
using FluentValidation.Results;
using HabitTracker.Application.Exceptions;
using HabitTracker.Application.Habits.DTOs;
using HabitTracker.Application.Habits.Interfaces;
using HabitTracker.Domain.Entities;
using HabitTracker.Domain.Enums;
using HabitTracker.Domain.Streaks;

namespace HabitTracker.Application.Habits;

public class HabitService(IHabitRepository habitRepository)
{
    private const int MaxActiveHabits = 50;
    private const string HabitNotFoundMessage = "Habit not found.";
    private const string ArchivedHabitMessage = "Cannot edit an archived habit. Unarchive it first.";
    private const string ArchivedCheckInMessage = "Cannot check in to an archived habit.";
    private const string ActiveHabitLimitMessage = "You have reached the maximum of 50 active habits.";
    private const string DuplicateCheckInMessage = "A check-in already exists for this date.";
    private const string CheckInNotFoundMessage = "Check-in not found.";

    public async Task<IReadOnlyList<HabitDto>> ListAsync(
        Guid userId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var habits = await habitRepository.ListByUserAsync(userId, includeArchived, cancellationToken);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var completedDatesByHabit = await LoadCompletedDatesAsync(habits, cancellationToken);

        return habits
            .Select(h => MapHabit(h, today, completedDatesByHabit.GetValueOrDefault(h.Id)))
            .ToList();
    }

    public async Task<HabitDto> GetByIdAsync(
        Guid userId,
        Guid habitId,
        CancellationToken cancellationToken = default)
    {
        var habit = await habitRepository.GetByIdForUserAsync(habitId, userId, cancellationToken);

        if (habit is null)
            throw new NotFoundException(HabitNotFoundMessage);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var completedDates = await LoadCompletedDatesAsync([habit], cancellationToken);

        return MapHabit(habit, today, completedDates.GetValueOrDefault(habit.Id));
    }

    public async Task<HabitDto> CreateAsync(
        Guid userId,
        CreateHabitRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await habitRepository.CountActiveByUserAsync(userId, cancellationToken) >= MaxActiveHabits)
            throw new ConflictException(ActiveHabitLimitMessage);

        var habit = new Habit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Icon = request.Icon,
            Color = request.Color,
            ScheduleType = request.ScheduleType,
            ScheduleDays = request.ScheduleType == ScheduleType.Daily ? null : request.ScheduleDays,
            ReminderTime = ParseReminderTime(request.ReminderTime),
            IsArchived = false,
            CreatedAt = DateTime.UtcNow
        };

        await habitRepository.AddAsync(habit, cancellationToken);
        await habitRepository.SaveChangesAsync(cancellationToken);

        return MapHabit(habit, DateOnly.FromDateTime(DateTime.UtcNow), completedDates: null);
    }

    public async Task<HabitDto> UpdateAsync(
        Guid userId,
        Guid habitId,
        UpdateHabitRequest request,
        CancellationToken cancellationToken = default)
    {
        var habit = await habitRepository.GetByIdForUserTrackedAsync(habitId, userId, cancellationToken);

        if (habit is null)
            throw new NotFoundException(HabitNotFoundMessage);

        if (habit.IsArchived)
            throw new ConflictException(ArchivedHabitMessage);

        habit.Name = request.Name.Trim();
        habit.Description = request.Description?.Trim();
        habit.Icon = request.Icon;
        habit.Color = request.Color;
        habit.ScheduleType = request.ScheduleType;
        habit.ScheduleDays = request.ScheduleType == ScheduleType.Daily ? null : request.ScheduleDays;
        habit.ReminderTime = ParseReminderTime(request.ReminderTime);

        await habitRepository.SaveChangesAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var completedDates = await LoadCompletedDatesAsync([habit], cancellationToken);

        return MapHabit(habit, today, completedDates.GetValueOrDefault(habit.Id));
    }

    public async Task ArchiveAsync(
        Guid userId,
        Guid habitId,
        CancellationToken cancellationToken = default)
    {
        var habit = await habitRepository.GetByIdForUserTrackedAsync(habitId, userId, cancellationToken);

        if (habit is null)
            throw new NotFoundException(HabitNotFoundMessage);

        if (!habit.IsArchived)
        {
            habit.IsArchived = true;
            await habitRepository.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task UnarchiveAsync(
        Guid userId,
        Guid habitId,
        CancellationToken cancellationToken = default)
    {
        var habit = await habitRepository.GetByIdForUserTrackedAsync(habitId, userId, cancellationToken);

        if (habit is null)
            throw new NotFoundException(HabitNotFoundMessage);

        if (habit.IsArchived)
        {
            if (await habitRepository.CountActiveByUserAsync(userId, cancellationToken) >= MaxActiveHabits)
                throw new ConflictException(ActiveHabitLimitMessage);

            habit.IsArchived = false;
            await habitRepository.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<CheckInResponse> CheckInAsync(
        Guid userId,
        Guid habitId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var habit = await habitRepository.GetByIdForUserTrackedAsync(habitId, userId, cancellationToken);

        if (habit is null)
            throw new NotFoundException(HabitNotFoundMessage);

        if (habit.IsArchived)
            throw new ConflictException(ArchivedCheckInMessage);

        ValidateCheckInDate(date, habit);

        var existing = await habitRepository.GetLogAsync(habitId, date, cancellationToken);
        if (existing is not null)
            throw new ConflictException(DuplicateCheckInMessage);

        var log = new HabitLog
        {
            Id = Guid.NewGuid(),
            HabitId = habitId,
            Date = date,
            CompletedAt = DateTime.UtcNow
        };

        await habitRepository.AddLogAndSaveAsync(log, cancellationToken);

        var streaks = await CalculateStreaksAsync(habit, date, cancellationToken);

        return new CheckInResponse(date.ToString("yyyy-MM-dd"), streaks.CurrentStreak, streaks.BestStreak);
    }

    public async Task<UndoCheckInResponse> UndoCheckInAsync(
        Guid userId,
        Guid habitId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var habit = await habitRepository.GetByIdForUserAsync(habitId, userId, cancellationToken);

        if (habit is null)
            throw new NotFoundException(HabitNotFoundMessage);

        var log = await habitRepository.GetLogAsync(habitId, date, cancellationToken);

        if (log is null)
            throw new NotFoundException(CheckInNotFoundMessage);

        await habitRepository.RemoveLogAndSaveAsync(log, cancellationToken);

        var streaks = await CalculateStreaksAsync(habit, date, cancellationToken);

        return new UndoCheckInResponse(streaks.CurrentStreak, streaks.BestStreak);
    }

    private async Task<StreakResult> CalculateStreaksAsync(
        Habit habit,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var rows = await habitRepository.GetCompletedDatesByHabitIdsAsync([habit.Id], cancellationToken);
        var completedDates = rows.Select(row => row.Date).ToHashSet();

        if (completedDates.Count == 0)
            return new StreakResult(0, 0);

        var habitStartDate = DateOnly.FromDateTime(habit.CreatedAt);

        return StreakCalculator.Calculate(
            habit.ScheduleType,
            habit.ScheduleDays,
            habitStartDate,
            completedDates,
            today);
    }

    private static void ValidateCheckInDate(DateOnly date, Habit habit)
    {
        var serverToday = DateOnly.FromDateTime(DateTime.UtcNow);
        var habitStartDate = DateOnly.FromDateTime(habit.CreatedAt);

        if (date < habitStartDate)
        {
            throw new ValidationException([
                new ValidationFailure("Date", "Check-in date cannot be before the habit was created.")
            ]);
        }

        var dayDifference = Math.Abs(date.DayNumber - serverToday.DayNumber);
        if (dayDifference > 1)
        {
            throw new ValidationException([
                new ValidationFailure("Date", "Check-in date must be within one day of the server date.")
            ]);
        }
    }

    private async Task<IReadOnlyDictionary<Guid, HashSet<DateOnly>>> LoadCompletedDatesAsync(
        IReadOnlyList<Habit> habits,
        CancellationToken cancellationToken)
    {
        var habitIds = habits.Select(h => h.Id).ToList();
        var rows = await habitRepository.GetCompletedDatesByHabitIdsAsync(habitIds, cancellationToken);

        var completedDatesByHabit = new Dictionary<Guid, HashSet<DateOnly>>();

        foreach (var (habitId, date) in rows)
        {
            if (!completedDatesByHabit.TryGetValue(habitId, out var dates))
            {
                dates = [];
                completedDatesByHabit[habitId] = dates;
            }

            dates.Add(date);
        }

        return completedDatesByHabit;
    }

    private static HabitDto MapHabit(Habit habit, DateOnly today, HashSet<DateOnly>? completedDates)
    {
        var habitStartDate = DateOnly.FromDateTime(habit.CreatedAt);
        var isScheduledToday = habit.IsScheduledOn(today);
        var completedToday = completedDates?.Contains(today) ?? false;

        var streaks = completedDates is null || completedDates.Count == 0
            ? new StreakResult(0, 0)
            : StreakCalculator.Calculate(
                habit.ScheduleType,
                habit.ScheduleDays,
                habitStartDate,
                completedDates,
                today);

        return new HabitDto(
            habit.Id,
            habit.Name,
            habit.Description,
            habit.Icon,
            habit.Color,
            habit.ScheduleType,
            habit.ScheduleDays,
            habit.ReminderTime?.ToString("HH:mm"),
            habit.IsArchived,
            habit.CreatedAt,
            streaks.CurrentStreak,
            streaks.BestStreak,
            completedToday,
            isScheduledToday);
    }

    private static TimeOnly? ParseReminderTime(string? reminderTime) =>
        reminderTime is null
            ? null
            : TimeOnly.ParseExact(reminderTime, "HH:mm");
}
