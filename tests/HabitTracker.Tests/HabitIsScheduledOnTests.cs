using HabitTracker.Domain;
using HabitTracker.Domain.Entities;
using HabitTracker.Domain.Enums;

namespace HabitTracker.Tests;

public class HabitIsScheduledOnTests
{
    [Fact]
    public void IsScheduledOn_Daily_ReturnsTrueForEveryDay()
    {
        var habit = new Habit { ScheduleType = ScheduleType.Daily };

        foreach (DayOfWeek day in Enum.GetValues<DayOfWeek>())
        {
            var date = NextDateOn(day);
            Assert.True(habit.IsScheduledOn(date));
        }
    }

    [Theory]
    [InlineData(DayOfWeek.Monday, true)]
    [InlineData(DayOfWeek.Tuesday, false)]
    [InlineData(DayOfWeek.Wednesday, true)]
    [InlineData(DayOfWeek.Thursday, false)]
    [InlineData(DayOfWeek.Friday, true)]
    [InlineData(DayOfWeek.Saturday, false)]
    [InlineData(DayOfWeek.Sunday, false)]
    public void IsScheduledOn_SpecificDays_UsesBitmask(DayOfWeek day, bool expected)
    {
        var habit = new Habit
        {
            ScheduleType = ScheduleType.SpecificDays,
            ScheduleDays = WeekDays.Monday | WeekDays.Wednesday | WeekDays.Friday
        };

        var date = NextDateOn(day);
        Assert.Equal(expected, habit.IsScheduledOn(date));
    }

    [Fact]
    public void IsScheduledOn_SpecificDays_WithoutScheduleDays_ReturnsFalse()
    {
        var habit = new Habit
        {
            ScheduleType = ScheduleType.SpecificDays,
            ScheduleDays = null
        };

        Assert.False(habit.IsScheduledOn(DateOnly.FromDateTime(DateTime.UtcNow)));
    }

    private static DateOnly NextDateOn(DayOfWeek day)
    {
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        while (date.DayOfWeek != day)
            date = date.AddDays(1);

        return date;
    }
}
