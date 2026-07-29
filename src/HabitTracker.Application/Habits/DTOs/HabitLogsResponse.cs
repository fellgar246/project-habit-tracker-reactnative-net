namespace HabitTracker.Application.Habits.DTOs;

public record HabitLogsResponse(
    string Month,
    IReadOnlyList<string> ScheduledDates,
    IReadOnlyList<string> CompletedDates);
