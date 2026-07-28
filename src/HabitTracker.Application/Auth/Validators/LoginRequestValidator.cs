using FluentValidation;
using HabitTracker.Application.Auth.DTOs;

namespace HabitTracker.Application.Auth.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}
