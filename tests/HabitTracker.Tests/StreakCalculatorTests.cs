using System.Diagnostics;
using HabitTracker.Domain;
using HabitTracker.Domain.Enums;
using HabitTracker.Domain.Streaks;

namespace HabitTracker.Tests;

public class StreakCalculatorTests
{
    private static readonly DateOnly Start = new(2025, 1, 1);
    private static readonly int MonWedFri = WeekDays.Monday | WeekDays.Wednesday | WeekDays.Friday;

    [Fact]
    public void Calculate_DailyWithNoLogs_ReturnsZeroStreaks()
    {
        var result = StreakCalculator.Calculate(
            ScheduleType.Daily,
            scheduleDays: null,
            Start,
            completedDates: new HashSet<DateOnly>(),
            today: new DateOnly(2025, 1, 10));

        Assert.Equal(new StreakResult(0, 0), result);
    }

    [Fact]
    public void Calculate_DailyFiveDaysEndingYesterdayTodayIncomplete_ReturnsCurrentFiveBestFive()
    {
        var today = new DateOnly(2025, 1, 10);
        var completed = Dates(today.AddDays(-5), today.AddDays(-4), today.AddDays(-3), today.AddDays(-2), today.AddDays(-1));

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);

        Assert.Equal(new StreakResult(5, 5), result);
    }

    [Fact]
    public void Calculate_DailyFiveDaysIncludingToday_ReturnsCurrentFiveBestFive()
    {
        var today = new DateOnly(2025, 1, 10);
        var completed = Dates(today.AddDays(-4), today.AddDays(-3), today.AddDays(-2), today.AddDays(-1), today);

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);

        Assert.Equal(new StreakResult(5, 5), result);
    }

    [Fact]
    public void Calculate_DailyThreeThenMissOneThenTwoEndingYesterday_ReturnsCurrentTwoBestThree()
    {
        var today = new DateOnly(2025, 1, 11);
        var completed = Dates(
            new DateOnly(2025, 1, 5),
            new DateOnly(2025, 1, 6),
            new DateOnly(2025, 1, 7),
            new DateOnly(2025, 1, 9),
            new DateOnly(2025, 1, 10));

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);

        Assert.Equal(new StreakResult(2, 3), result);
    }

    [Fact]
    public void Calculate_DailyStreakBrokenWeekAgo_ReturnsCurrentZeroBestFromPast()
    {
        var today = new DateOnly(2025, 2, 1);
        var completed = Dates(
            new DateOnly(2025, 1, 1),
            new DateOnly(2025, 1, 2),
            new DateOnly(2025, 1, 3),
            new DateOnly(2025, 1, 4),
            new DateOnly(2025, 1, 5),
            new DateOnly(2025, 1, 6),
            new DateOnly(2025, 1, 7),
            new DateOnly(2025, 1, 8),
            new DateOnly(2025, 1, 9),
            new DateOnly(2025, 1, 10));

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);

        Assert.Equal(new StreakResult(0, 10), result);
    }

    [Fact]
    public void Calculate_MonWedFriCompletedMonAndWedTodayThursday_ReturnsCurrentTwo()
    {
        var today = new DateOnly(2025, 1, 9);
        var completed = Dates(new DateOnly(2025, 1, 6), new DateOnly(2025, 1, 8));

        var result = StreakCalculator.Calculate(
            ScheduleType.SpecificDays,
            MonWedFri,
            Start,
            completed,
            today);

        Assert.Equal(new StreakResult(2, 2), result);
    }

    [Fact]
    public void Calculate_MonWedFriMissedWednesdayTodayThursday_ReturnsCurrentZero()
    {
        var today = new DateOnly(2025, 1, 9);
        var completed = Dates(new DateOnly(2025, 1, 6));

        var result = StreakCalculator.Calculate(
            ScheduleType.SpecificDays,
            MonWedFri,
            Start,
            completed,
            today);

        Assert.Equal(new StreakResult(0, 1), result);
    }

    [Fact]
    public void Calculate_MonWedFriTodayFridayIncompleteMonWedDone_ReturnsCurrentTwoGraceDay()
    {
        var today = new DateOnly(2025, 1, 10);
        var completed = Dates(new DateOnly(2025, 1, 6), new DateOnly(2025, 1, 8));

        var result = StreakCalculator.Calculate(
            ScheduleType.SpecificDays,
            MonWedFri,
            Start,
            completed,
            today);

        Assert.Equal(new StreakResult(2, 2), result);
    }

    [Fact]
    public void Calculate_MonWedFriTodaySaturdayWeekComplete_ReturnsCurrentThree()
    {
        var today = new DateOnly(2025, 1, 11);
        var completed = Dates(new DateOnly(2025, 1, 6), new DateOnly(2025, 1, 8), new DateOnly(2025, 1, 10));

        var result = StreakCalculator.Calculate(
            ScheduleType.SpecificDays,
            MonWedFri,
            Start,
            completed,
            today);

        Assert.Equal(new StreakResult(3, 3), result);
    }

    [Fact]
    public void Calculate_LogsBeforeHabitStartDate_AreIgnored()
    {
        var habitStart = new DateOnly(2025, 1, 5);
        var today = new DateOnly(2025, 1, 10);
        var completed = Dates(
            new DateOnly(2025, 1, 1),
            new DateOnly(2025, 1, 2),
            new DateOnly(2025, 1, 5),
            new DateOnly(2025, 1, 6),
            new DateOnly(2025, 1, 7),
            new DateOnly(2025, 1, 8),
            new DateOnly(2025, 1, 9),
            new DateOnly(2025, 1, 10));

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, habitStart, completed, today);

        Assert.Equal(new StreakResult(6, 6), result);
    }

    [Fact]
    public void Calculate_HabitCreatedAndCompletedToday_ReturnsOneOne()
    {
        var today = new DateOnly(2025, 1, 15);
        var completed = Dates(today);

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, today, completed, today);

        Assert.Equal(new StreakResult(1, 1), result);
    }

    [Fact]
    public void Calculate_LongPastStreakShortCurrent_ReturnsShortCurrentLongBest()
    {
        var today = new DateOnly(2025, 3, 1);
        var completed = new HashSet<DateOnly>();

        for (var date = new DateOnly(2025, 1, 1); date <= new DateOnly(2025, 1, 20); date = date.AddDays(1))
            completed.Add(date);

        completed.Add(new DateOnly(2025, 2, 27));
        completed.Add(new DateOnly(2025, 2, 28));

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);

        Assert.Equal(new StreakResult(2, 20), result);
    }

    [Fact]
    public void Calculate_Daily365CompletedDays_Returns365AndRunsUnder50Ms()
    {
        var today = new DateOnly(2025, 12, 31);
        var habitStart = today.AddDays(-364);
        var completed = new HashSet<DateOnly>();

        for (var date = habitStart; date <= today; date = date.AddDays(1))
            completed.Add(date);

        var stopwatch = Stopwatch.StartNew();
        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, habitStart, completed, today);
        stopwatch.Stop();

        Assert.Equal(new StreakResult(365, 365), result);
        Assert.True(stopwatch.ElapsedMilliseconds < 50, $"Expected < 50 ms, got {stopwatch.ElapsedMilliseconds} ms");
    }

    [Fact]
    public void Calculate_UnorderedCompletedDates_ReturnsCorrectResult()
    {
        var today = new DateOnly(2025, 1, 10);
        var completed = new HashSet<DateOnly>
        {
            today.AddDays(-1),
            today.AddDays(-3),
            today,
            today.AddDays(-4),
            today.AddDays(-2)
        };

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);

        Assert.Equal(new StreakResult(5, 5), result);
    }

    [Fact]
    public void Calculate_DailySchedule_MatchesFullWeekBitmask()
    {
        var today = new DateOnly(2025, 1, 10);
        var completed = Dates(today.AddDays(-4), today.AddDays(-3), today.AddDays(-2), today.AddDays(-1), today);

        var dailyResult = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);
        var bitmaskResult = StreakCalculator.Calculate(
            ScheduleType.SpecificDays,
            scheduleDays: 127,
            Start,
            completed,
            today);

        Assert.Equal(dailyResult, bitmaskResult);
    }

    [Fact]
    public void Calculate_SpecificDaysWithZeroBitmask_ReturnsZeroStreaks()
    {
        var today = new DateOnly(2025, 1, 10);
        var completed = Dates(today);

        var result = StreakCalculator.Calculate(
            ScheduleType.SpecificDays,
            scheduleDays: 0,
            Start,
            completed,
            today);

        Assert.Equal(new StreakResult(0, 0), result);
    }

    [Fact]
    public void Calculate_SpecificDaysWithNullScheduleDays_ReturnsZeroStreaks()
    {
        var today = new DateOnly(2025, 1, 10);
        var completed = Dates(today);

        var result = StreakCalculator.Calculate(
            ScheduleType.SpecificDays,
            scheduleDays: null,
            Start,
            completed,
            today);

        Assert.Equal(new StreakResult(0, 0), result);
    }

    [Fact]
    public void Calculate_BrokenStreakPreservesBestStreak()
    {
        var today = new DateOnly(2025, 1, 20);
        var completed = Dates(
            new DateOnly(2025, 1, 1),
            new DateOnly(2025, 1, 2),
            new DateOnly(2025, 1, 3),
            new DateOnly(2025, 1, 4),
            new DateOnly(2025, 1, 5),
            today);

        var result = StreakCalculator.Calculate(ScheduleType.Daily, null, Start, completed, today);

        Assert.Equal(new StreakResult(1, 5), result);
    }

    private static HashSet<DateOnly> Dates(params DateOnly[] dates) => [.. dates];
}
