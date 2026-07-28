using FluentValidation;
using HabitTracker.Application.Auth.DTOs;

namespace HabitTracker.Application.Auth.Validators;

public class LogoutRequestValidator : AbstractValidator<LogoutRequest>
{
    public LogoutRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty();
    }
}
