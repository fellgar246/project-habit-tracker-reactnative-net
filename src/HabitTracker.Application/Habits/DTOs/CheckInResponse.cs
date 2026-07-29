namespace HabitTracker.Application.Habits.DTOs;

public record CheckInResponse(string Date, int CurrentStreak, int BestStreak);
