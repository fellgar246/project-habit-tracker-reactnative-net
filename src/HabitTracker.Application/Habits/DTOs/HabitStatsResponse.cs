namespace HabitTracker.Application.Habits.DTOs;

public record HabitStatsResponse(
    int CurrentStreak,
    int BestStreak,
    int TotalCompletions,
    double? CompletionRate30d,
    IReadOnlyList<WeekdayStatsDto> ByWeekday,
    IReadOnlyList<HabitDayStatsDto> Last30Days);

public record WeekdayStatsDto(int Weekday, int Scheduled, int Completed);

public record HabitDayStatsDto(string Date, bool Scheduled, bool Completed);
