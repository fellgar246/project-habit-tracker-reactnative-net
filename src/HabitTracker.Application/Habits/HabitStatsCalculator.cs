using HabitTracker.Application.Habits.DTOs;
using HabitTracker.Domain.Entities;
using HabitTracker.Domain.Streaks;

namespace HabitTracker.Application.Habits;

public static class HabitStatsCalculator
{
    public static HabitLogsResponse CalculateLogs(
        Habit habit,
        IReadOnlySet<DateOnly> completedDates,
        int year,
        int month)
    {
        var monthStart = new DateOnly(year, month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var scheduledDates = HabitScheduleHelper
            .GetScheduledDates(habit, monthStart, monthEnd)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .ToList();

        var completedInMonth = completedDates
            .Where(d => d.Year == year && d.Month == month)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .OrderBy(d => d)
            .ToList();

        return new HabitLogsResponse(
            $"{year:D4}-{month:D2}",
            scheduledDates,
            completedInMonth);
    }

    public static HabitStatsResponse CalculateHabitStats(
        Habit habit,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        var habitStartDate = DateOnly.FromDateTime(habit.CreatedAt);

        var streaks = completedDates.Count == 0
            ? new StreakResult(0, 0)
            : StreakCalculator.Calculate(
                habit.ScheduleType,
                habit.ScheduleDays,
                habitStartDate,
                completedDates,
                today);

        var windowStart = today.AddDays(-29);
        var scheduledInWindow = 0;
        var completedInWindow = 0;
        var last30Days = new List<HabitDayStatsDto>(30);

        for (var date = windowStart; date <= today; date = date.AddDays(1))
        {
            var scheduled = HabitScheduleHelper.IsScheduledOn(habit, date);
            var completed = date >= habitStartDate && completedDates.Contains(date);

            if (scheduled)
            {
                scheduledInWindow++;
                if (completed)
                    completedInWindow++;
            }

            last30Days.Add(new HabitDayStatsDto(
                date.ToString("yyyy-MM-dd"),
                scheduled,
                completed));
        }

        double? completionRate30d = scheduledInWindow > 0
            ? (double)completedInWindow / scheduledInWindow
            : null;

        var byWeekday = new List<WeekdayStatsDto>(7);
        for (var weekday = 0; weekday <= 6; weekday++)
        {
            var scheduled = 0;
            var completed = 0;

            for (var date = habitStartDate; date <= today; date = date.AddDays(1))
            {
                if ((int)date.DayOfWeek != weekday)
                    continue;

                if (!HabitScheduleHelper.IsScheduledOn(habit, date))
                    continue;

                scheduled++;
                if (completedDates.Contains(date))
                    completed++;
            }

            byWeekday.Add(new WeekdayStatsDto(weekday, scheduled, completed));
        }

        return new HabitStatsResponse(
            streaks.CurrentStreak,
            streaks.BestStreak,
            completedDates.Count,
            completionRate30d,
            byWeekday,
            last30Days);
    }

    public static StatsSummaryResponse CalculateSummary(
        IReadOnlyList<Habit> activeHabits,
        IReadOnlyDictionary<Guid, HashSet<DateOnly>> completedByHabit,
        DateOnly today)
    {
        var completedToday = 0;
        var scheduledToday = 0;
        LongestCurrentStreakDto? longestStreak = null;

        foreach (var habit in activeHabits)
        {
            if (HabitScheduleHelper.IsScheduledOn(habit, today))
            {
                scheduledToday++;
                var completedDates = completedByHabit.GetValueOrDefault(habit.Id);
                if (completedDates?.Contains(today) == true)
                    completedToday++;
            }

            var dates = completedByHabit.GetValueOrDefault(habit.Id);
            if (dates is null || dates.Count == 0)
                continue;

            var habitStartDate = DateOnly.FromDateTime(habit.CreatedAt);
            var streaks = StreakCalculator.Calculate(
                habit.ScheduleType,
                habit.ScheduleDays,
                habitStartDate,
                dates,
                today);

            if (longestStreak is null || streaks.CurrentStreak > longestStreak.Streak)
            {
                longestStreak = new LongestCurrentStreakDto(
                    habit.Id,
                    habit.Name,
                    streaks.CurrentStreak);
            }
        }

        var windowStart = today.AddDays(-29);
        var last30Days = new List<SummaryDayStatsDto>(30);
        var weekdayScheduled = new int[7];
        var weekdayCompleted = new int[7];

        for (var date = windowStart; date <= today; date = date.AddDays(1))
        {
            var scheduled = 0;
            var completed = 0;

            foreach (var habit in activeHabits)
            {
                if (!HabitScheduleHelper.IsScheduledOn(habit, date))
                    continue;

                scheduled++;
                var dates = completedByHabit.GetValueOrDefault(habit.Id);
                if (dates?.Contains(date) == true)
                    completed++;
            }

            last30Days.Add(new SummaryDayStatsDto(
                date.ToString("yyyy-MM-dd"),
                completed,
                scheduled));

            if (scheduled > 0 || completed > 0)
            {
                var weekday = (int)date.DayOfWeek;
                weekdayScheduled[weekday] += scheduled;
                weekdayCompleted[weekday] += completed;
            }
        }

        var byWeekday = Enumerable.Range(0, 7)
            .Select(weekday => new WeekdayStatsDto(weekday, weekdayScheduled[weekday], weekdayCompleted[weekday]))
            .ToList();

        return new StatsSummaryResponse(
            activeHabits.Count,
            completedToday,
            scheduledToday,
            longestStreak,
            last30Days,
            byWeekday);
    }
}
