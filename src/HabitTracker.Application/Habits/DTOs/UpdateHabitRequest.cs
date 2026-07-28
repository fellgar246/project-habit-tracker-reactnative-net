using HabitTracker.Domain.Enums;

namespace HabitTracker.Application.Habits.DTOs;

public record UpdateHabitRequest(
    string Name,
    string? Description,
    string Icon,
    string Color,
    ScheduleType ScheduleType,
    int? ScheduleDays,
    string? ReminderTime) : Validators.IHabitMutationRequest;
