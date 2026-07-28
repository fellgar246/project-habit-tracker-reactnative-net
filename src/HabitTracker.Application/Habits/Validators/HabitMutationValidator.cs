using System.Text.RegularExpressions;
using FluentValidation;
using HabitTracker.Application.Habits.DTOs;
using HabitTracker.Domain.Enums;

namespace HabitTracker.Application.Habits.Validators;

public interface IHabitMutationRequest
{
    string Name { get; }
    string? Description { get; }
    string Icon { get; }
    string Color { get; }
    ScheduleType ScheduleType { get; }
    int? ScheduleDays { get; }
    string? ReminderTime { get; }
}

public partial class HabitMutationRequestValidator<T> : AbstractValidator<T> where T : IHabitMutationRequest
{
    private static readonly Regex HexColorPattern = HexColorRegex();
    private static readonly Regex ReminderTimePattern = ReminderTimeRegex();

    public HabitMutationRequestValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .Must(name => name.Trim().Length >= 1)
            .WithMessage("Name must not be empty or whitespace.")
            .Must(name => name.Trim().Length <= 60)
            .WithMessage("Name must be at most 60 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(250)
            .When(x => x.Description is not null);

        RuleFor(x => x.Icon)
            .NotEmpty();

        RuleFor(x => x.Color)
            .NotEmpty()
            .Must(color => HexColorPattern.IsMatch(color))
            .WithMessage("Color must be a hex value in the format #RRGGBB.");

        RuleFor(x => x.ScheduleType)
            .IsInEnum();

        RuleFor(x => x.ScheduleDays)
            .NotNull()
            .InclusiveBetween(1, 127)
            .When(x => x.ScheduleType == ScheduleType.SpecificDays);

        RuleFor(x => x.ScheduleDays)
            .Null()
            .When(x => x.ScheduleType == ScheduleType.Daily)
            .WithMessage("ScheduleDays must be null when ScheduleType is Daily.");

        RuleFor(x => x.ReminderTime)
            .Must(time => time is null || ReminderTimePattern.IsMatch(time))
            .WithMessage("ReminderTime must be in HH:mm format.")
            .Must(time => time is null || TimeOnly.TryParseExact(time, "HH:mm", out _))
            .WithMessage("ReminderTime must be a valid time in HH:mm format.");
    }

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColorRegex();

    [GeneratedRegex("^([01]\\d|2[0-3]):[0-5]\\d$")]
    private static partial Regex ReminderTimeRegex();
}
