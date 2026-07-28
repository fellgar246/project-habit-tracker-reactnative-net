using FluentValidation;
using HabitTracker.Application.Auth.DTOs;

namespace HabitTracker.Application.Auth.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8);

        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(50);
    }
}
