using HabitTracker.Domain.Enums;

namespace HabitTracker.Application.Habits.DTOs;

public record HabitDto(
    Guid Id,
    string Name,
    string? Description,
    string Icon,
    string Color,
    ScheduleType ScheduleType,
    int? ScheduleDays,
    string? ReminderTime,
    bool IsArchived,
    DateTime CreatedAt,
    int CurrentStreak,
    int BestStreak,
    bool CompletedToday,
    bool IsScheduledToday);
