using HabitTracker.Domain.Entities;

namespace HabitTracker.Domain.Streaks;

public static class HabitScheduleHelper
{
    public static bool IsScheduledOn(Habit habit, DateOnly date)
    {
        var habitStartDate = DateOnly.FromDateTime(habit.CreatedAt);
        if (date < habitStartDate)
            return false;

        return habit.IsScheduledOn(date);
    }

    public static IEnumerable<DateOnly> GetScheduledDates(Habit habit, DateOnly from, DateOnly to)
    {
        var habitStartDate = DateOnly.FromDateTime(habit.CreatedAt);
        var start = from > habitStartDate ? from : habitStartDate;

        for (var date = start; date <= to; date = date.AddDays(1))
        {
            if (habit.IsScheduledOn(date))
                yield return date;
        }
    }
}
