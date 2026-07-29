namespace HabitTracker.Application.Habits.DTOs;

public record StatsSummaryResponse(
    int ActiveHabits,
    int CompletedToday,
    int ScheduledToday,
    LongestCurrentStreakDto? LongestCurrentStreak,
    IReadOnlyList<SummaryDayStatsDto> Last30Days,
    IReadOnlyList<WeekdayStatsDto> ByWeekday);

public record LongestCurrentStreakDto(Guid HabitId, string HabitName, int Streak);

public record SummaryDayStatsDto(string Date, int Completed, int Scheduled);
