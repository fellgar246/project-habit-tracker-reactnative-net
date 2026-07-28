using FluentValidation;
using HabitTracker.Application.Habits.DTOs;

namespace HabitTracker.Application.Habits.Validators;

public class CreateHabitRequestValidator : AbstractValidator<CreateHabitRequest>
{
    public CreateHabitRequestValidator()
    {
        Include(new HabitMutationRequestValidator<CreateHabitRequest>());
    }
}
