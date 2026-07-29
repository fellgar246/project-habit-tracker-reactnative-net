using HabitTracker.Domain.Enums;

namespace HabitTracker.Domain.Streaks;

public readonly record struct StreakResult(int CurrentStreak, int BestStreak);

public static class StreakCalculator
{
    public static StreakResult Calculate(
        ScheduleType scheduleType,
        int? scheduleDays,
        DateOnly habitStartDate,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        if (completedDates.Count == 0)
            return new StreakResult(0, 0);

        if (scheduleType == ScheduleType.SpecificDays && (!scheduleDays.HasValue || scheduleDays.Value == 0))
            return new StreakResult(0, 0);

        var currentStreak = CalculateCurrentStreak(
            scheduleType,
            scheduleDays,
            habitStartDate,
            completedDates,
            today);

        var bestStreak = CalculateBestStreak(
            scheduleType,
            scheduleDays,
            habitStartDate,
            completedDates,
            today);

        if (currentStreak > bestStreak)
            bestStreak = currentStreak;

        return new StreakResult(currentStreak, bestStreak);
    }

    private static int CalculateCurrentStreak(
        ScheduleType scheduleType,
        int? scheduleDays,
        DateOnly habitStartDate,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        var date = today;

        if (IsScheduledOn(scheduleType, scheduleDays, date, habitStartDate)
            && !IsCompletedOn(completedDates, date, habitStartDate))
        {
            date = FindPreviousScheduledDay(scheduleType, scheduleDays, habitStartDate, date);
            if (date == default)
                return 0;
        }

        var streak = 0;

        while (date >= habitStartDate)
        {
            if (!IsScheduledOn(scheduleType, scheduleDays, date, habitStartDate))
            {
                date = date.AddDays(-1);
                continue;
            }

            if (!IsCompletedOn(completedDates, date, habitStartDate))
                break;

            streak++;
            date = date.AddDays(-1);
        }

        return streak;
    }

    private static int CalculateBestStreak(
        ScheduleType scheduleType,
        int? scheduleDays,
        DateOnly habitStartDate,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        var bestStreak = 0;
        var currentRun = 0;

        for (var date = habitStartDate; date <= today; date = date.AddDays(1))
        {
            if (!IsScheduledOn(scheduleType, scheduleDays, date, habitStartDate))
                continue;

            if (IsCompletedOn(completedDates, date, habitStartDate))
            {
                currentRun++;
                if (currentRun > bestStreak)
                    bestStreak = currentRun;
            }
            else if (date < today)
            {
                currentRun = 0;
            }
        }

        return bestStreak;
    }

    private static DateOnly FindPreviousScheduledDay(
        ScheduleType scheduleType,
        int? scheduleDays,
        DateOnly habitStartDate,
        DateOnly fromDate)
    {
        var date = fromDate.AddDays(-1);

        while (date >= habitStartDate)
        {
            if (IsScheduledOn(scheduleType, scheduleDays, date, habitStartDate))
                return date;

            date = date.AddDays(-1);
        }

        return default;
    }

    private static bool IsScheduledOn(
        ScheduleType scheduleType,
        int? scheduleDays,
        DateOnly date,
        DateOnly habitStartDate)
    {
        if (date < habitStartDate)
            return false;

        return scheduleType switch
        {
            ScheduleType.Daily => true,
            ScheduleType.SpecificDays => scheduleDays.HasValue
                && WeekDays.Contains(scheduleDays.Value, date.DayOfWeek),
            _ => false
        };
    }

    private static bool IsCompletedOn(
        IReadOnlySet<DateOnly> completedDates,
        DateOnly date,
        DateOnly habitStartDate) =>
        date >= habitStartDate && completedDates.Contains(date);
}
