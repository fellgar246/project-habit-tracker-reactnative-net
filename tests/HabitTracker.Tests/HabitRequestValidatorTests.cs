using FluentValidation;
using HabitTracker.Application.Habits.DTOs;
using HabitTracker.Application.Habits.Validators;
using HabitTracker.Domain;
using HabitTracker.Domain.Enums;

namespace HabitTracker.Tests;

public class HabitRequestValidatorTests
{
    private readonly CreateHabitRequestValidator _validator = new();

    [Fact]
    public async Task CreateHabitRequest_SpecificDaysWithoutScheduleDays_FailsValidation()
    {
        var request = new CreateHabitRequest(
            "Morning run",
            null,
            "run",
            "#FF5733",
            ScheduleType.SpecificDays,
            null,
            null);

        var result = await _validator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateHabitRequest.ScheduleDays));
    }

    [Fact]
    public async Task CreateHabitRequest_DailyWithScheduleDays_FailsValidation()
    {
        var request = new CreateHabitRequest(
            "Morning run",
            null,
            "run",
            "#FF5733",
            ScheduleType.Daily,
            WeekDays.Monday,
            null);

        var result = await _validator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateHabitRequest.ScheduleDays));
    }
}
