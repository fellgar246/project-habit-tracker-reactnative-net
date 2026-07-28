using FluentValidation;
using HabitTracker.Application.Auth.DTOs;

namespace HabitTracker.Application.Auth.Validators;

public class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty();
    }
}
