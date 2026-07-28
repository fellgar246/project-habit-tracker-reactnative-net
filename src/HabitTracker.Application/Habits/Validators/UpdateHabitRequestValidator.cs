using FluentValidation;
using HabitTracker.Application.Habits.DTOs;

namespace HabitTracker.Application.Habits.Validators;

public class UpdateHabitRequestValidator : AbstractValidator<UpdateHabitRequest>
{
    public UpdateHabitRequestValidator()
    {
        Include(new HabitMutationRequestValidator<UpdateHabitRequest>());
    }
}
