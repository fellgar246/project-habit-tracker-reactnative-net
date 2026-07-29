using System.Globalization;
using FluentValidation;
using HabitTracker.Application.Habits.DTOs;

namespace HabitTracker.Application.Habits.Validators;

public class CheckInRequestValidator : AbstractValidator<CheckInRequest>
{
    public CheckInRequestValidator()
    {
        RuleFor(x => x.Date)
            .NotEmpty()
            .Must(BeValidDate)
            .WithMessage("Date must be in YYYY-MM-DD format.");
    }

    private static bool BeValidDate(string date) =>
        DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);
}
