using HabitTracker.Application.Auth;
using HabitTracker.Application.Auth.DTOs;
using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Application.Habits;
using HabitTracker.Application.Habits.DTOs;
using HabitTracker.Application.Habits.Interfaces;
using HabitTracker.Domain;
using HabitTracker.Domain.Entities;
using HabitTracker.Domain.Enums;
using HabitTracker.Infrastructure.Auth;
using HabitTracker.Infrastructure.Data;
using HabitTracker.Infrastructure.Habits;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace HabitTracker.Tests;

public class HabitStatsTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly AppDbContext _db;
    private readonly AuthService _authService;
    private readonly HabitService _habitService;

    public HabitStatsTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(Guid.NewGuid().ToString()));

        services.Configure<JwtOptions>(options =>
        {
            options.Issuer = "TestIssuer";
            options.Audience = "TestAudience";
            options.Key = "test-signing-key-at-least-32-characters-long";
            options.AccessTokenMinutes = 15;
            options.RefreshTokenDays = 7;
        });

        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IHabitRepository, HabitRepository>();
        services.AddScoped<AuthService>();
        services.AddScoped<HabitService>();

        _serviceProvider = services.BuildServiceProvider();
        _db = _serviceProvider.GetRequiredService<AppDbContext>();
        _authService = _serviceProvider.GetRequiredService<AuthService>();
        _habitService = _serviceProvider.GetRequiredService<HabitService>();
    }

    [Fact]
    public async Task GetStatsAsync_HabitCreatedMidPeriod_CompletionRateExcludesEarlierDays()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var trackedHabit = await _db.Habits.FindAsync(habit.Id);

        trackedHabit!.CreatedAt = today.AddDays(-14).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var completedDates = new List<DateOnly>();
        for (var offset = -14; offset <= -1; offset++)
        {
            if (offset <= -5)
                completedDates.Add(today.AddDays(offset));
        }

        _db.HabitLogs.AddRange(completedDates.Select(date => CreateLog(habit.Id, date)));
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var stats = await _habitService.GetStatsAsync(userId, habit.Id);

        Assert.NotNull(stats.CompletionRate30d);
        Assert.Equal(10.0 / 15.0, stats.CompletionRate30d.Value, precision: 6);
        Assert.Equal(10, stats.TotalCompletions);
    }

    [Fact]
    public async Task GetStatsAsync_MonWedFriHabit_ByWeekdayReflectsSchedule()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var mask = WeekDays.Monday | WeekDays.Wednesday | WeekDays.Friday;
        var habit = await _habitService.CreateAsync(
            userId,
            new CreateHabitRequest("Gym", null, "icon", "#AABBCC", ScheduleType.SpecificDays, mask, "08:00"));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var trackedHabit = await _db.Habits.FindAsync(habit.Id);
        trackedHabit!.CreatedAt = today.AddDays(-20).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var completedDates = new List<DateOnly>();
        for (var date = today.AddDays(-20); date <= today; date = date.AddDays(1))
        {
            if (date.DayOfWeek is DayOfWeek.Monday or DayOfWeek.Wednesday)
                completedDates.Add(date);
        }

        _db.HabitLogs.AddRange(completedDates.Select(date => CreateLog(habit.Id, date)));
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var stats = await _habitService.GetStatsAsync(userId, habit.Id);
        var byWeekday = stats.ByWeekday.ToDictionary(item => item.Weekday);

        Assert.Equal(7, stats.ByWeekday.Count);

        var monday = byWeekday[(int)DayOfWeek.Monday];
        var wednesday = byWeekday[(int)DayOfWeek.Wednesday];
        var friday = byWeekday[(int)DayOfWeek.Friday];
        var tuesday = byWeekday[(int)DayOfWeek.Tuesday];

        Assert.True(monday.Scheduled > 0);
        Assert.Equal(monday.Scheduled, monday.Completed);
        Assert.True(wednesday.Scheduled > 0);
        Assert.Equal(wednesday.Scheduled, wednesday.Completed);
        Assert.True(friday.Scheduled > 0);
        Assert.True(friday.Completed < friday.Scheduled);
        Assert.Equal(0, tuesday.Scheduled);
        Assert.Equal(0, tuesday.Completed);
    }

    [Fact]
    public async Task GetSummaryAsync_NoHabits_ReturnsZeroCounts()
    {
        var userId = await RegisterUserAsync("user@example.com");

        var summary = await _habitService.GetSummaryAsync(userId);

        Assert.Equal(0, summary.ActiveHabits);
        Assert.Equal(0, summary.CompletedToday);
        Assert.Equal(0, summary.ScheduledToday);
        Assert.Null(summary.LongestCurrentStreak);
        Assert.Equal(30, summary.Last30Days.Count);
        Assert.All(summary.Last30Days, day =>
        {
            Assert.Equal(0, day.Completed);
            Assert.Equal(0, day.Scheduled);
        });
        Assert.Equal(7, summary.ByWeekday.Count);
        Assert.All(summary.ByWeekday, day =>
        {
            Assert.Equal(0, day.Scheduled);
            Assert.Equal(0, day.Completed);
        });
    }

    [Fact]
    public async Task GetLogsAsync_ReturnsScheduledAndCompletedDatesForMonth()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var trackedHabit = await _db.Habits.FindAsync(habit.Id);

        trackedHabit!.CreatedAt = today.AddDays(-5).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        _db.HabitLogs.Add(CreateLog(habit.Id, today.AddDays(-1)));
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var logs = await _habitService.GetLogsAsync(userId, habit.Id, today.Year, today.Month);

        Assert.Equal($"{today.Year:D4}-{today.Month:D2}", logs.Month);
        Assert.Contains(today.AddDays(-1).ToString("yyyy-MM-dd"), logs.CompletedDates);
        Assert.DoesNotContain(today.AddDays(-10).ToString("yyyy-MM-dd"), logs.ScheduledDates);
    }

    private static HabitLog CreateLog(Guid habitId, DateOnly date) =>
        new()
        {
            Id = Guid.NewGuid(),
            HabitId = habitId,
            Date = date,
            CompletedAt = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
        };

    private async Task<Guid> RegisterUserAsync(string email)
    {
        var response = await _authService.RegisterAsync(
            new RegisterRequest(email, "password123", "Test User"));

        return response.User.Id;
    }

    private static CreateHabitRequest ValidCreateRequest(string name) =>
        new(name, null, "icon", "#AABBCC", ScheduleType.Daily, null, "08:00");

    public void Dispose()
    {
        _db.Dispose();
        _serviceProvider.Dispose();
    }
}
