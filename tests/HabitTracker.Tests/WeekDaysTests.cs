using HabitTracker.Domain;

namespace HabitTracker.Tests;

public class WeekDaysTests
{
    [Fact]
    public void Contains_ReturnsTrue_WhenDayIsInMask()
    {
        var mask = WeekDays.Monday | WeekDays.Wednesday | WeekDays.Friday;

        Assert.True(WeekDays.Contains(mask, DayOfWeek.Monday));
        Assert.True(WeekDays.Contains(mask, DayOfWeek.Wednesday));
        Assert.True(WeekDays.Contains(mask, DayOfWeek.Friday));
    }

    [Fact]
    public void Contains_ReturnsFalse_WhenDayIsNotInMask()
    {
        var mask = WeekDays.Monday | WeekDays.Wednesday;

        Assert.False(WeekDays.Contains(mask, DayOfWeek.Tuesday));
        Assert.False(WeekDays.Contains(mask, DayOfWeek.Sunday));
    }
}
