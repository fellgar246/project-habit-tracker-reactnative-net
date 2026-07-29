using HabitTracker.Application.Auth;
using HabitTracker.Application.Auth.DTOs;
using HabitTracker.Application.Exceptions;
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
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace HabitTracker.Tests;

public class HabitServiceTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly AppDbContext _db;
    private readonly AuthService _authService;
    private readonly HabitService _habitService;

    public HabitServiceTests()
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
    public async Task GetByIdAsync_OtherUsersHabit_ThrowsNotFoundException()
    {
        var userA = await RegisterUserAsync("user-a@example.com");
        var userB = await RegisterUserAsync("user-b@example.com");

        var habit = await _habitService.CreateAsync(userA, ValidCreateRequest("Read"));

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _habitService.GetByIdAsync(userB, habit.Id));
    }

    [Fact]
    public async Task UpdateAsync_OtherUsersHabit_ThrowsNotFoundException()
    {
        var userA = await RegisterUserAsync("user-a@example.com");
        var userB = await RegisterUserAsync("user-b@example.com");

        var habit = await _habitService.CreateAsync(userA, ValidCreateRequest("Read"));

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _habitService.UpdateAsync(userB, habit.Id, ValidUpdateRequest("Updated")));
    }

    [Fact]
    public async Task ArchiveAsync_ExcludesHabitFromDefaultList_IncludesWithFlag()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Meditate"));

        await _habitService.ArchiveAsync(userId, habit.Id);

        var activeOnly = await _habitService.ListAsync(userId);
        var includingArchived = await _habitService.ListAsync(userId, includeArchived: true);

        Assert.Empty(activeOnly);
        Assert.Single(includingArchived);
        Assert.True(includingArchived[0].IsArchived);
    }

    [Fact]
    public async Task UpdateAsync_ArchivedHabit_ThrowsConflictException()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Stretch"));

        await _habitService.ArchiveAsync(userId, habit.Id);

        await Assert.ThrowsAsync<ConflictException>(() =>
            _habitService.UpdateAsync(userId, habit.Id, ValidUpdateRequest("Updated stretch")));
    }

    [Fact]
    public async Task ListAsync_WithHabitLogs_ReturnsCalculatedStreaks()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var trackedHabit = await _db.Habits.FindAsync(habit.Id);

        trackedHabit!.CreatedAt = today.AddDays(-10).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        await _db.SaveChangesAsync();

        _db.ChangeTracker.Clear();

        _db.HabitLogs.AddRange(
            CreateLog(habit.Id, today.AddDays(-2)),
            CreateLog(habit.Id, today.AddDays(-1)));

        await _db.SaveChangesAsync();

        var habits = await _habitService.ListAsync(userId);
        var result = Assert.Single(habits);

        Assert.Equal(2, result.CurrentStreak);
        Assert.Equal(2, result.BestStreak);
        Assert.False(result.CompletedToday);
    }

    [Fact]
    public async Task ListAsync_MultipleHabits_ReturnsDistinctStreaksInSingleLoad()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habitA = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var habitB = await _habitService.CreateAsync(userId, ValidCreateRequest("Run"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var habit in await _db.Habits.Where(h => h.UserId == userId).ToListAsync())
            habit.CreatedAt = today.AddDays(-10).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        _db.HabitLogs.AddRange(
            CreateLog(habitA.Id, today.AddDays(-1)),
            CreateLog(habitA.Id, today),
            CreateLog(habitB.Id, today.AddDays(-1)));

        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var habits = await _habitService.ListAsync(userId);

        Assert.Equal(2, habits.Count);

        var read = habits.Single(h => h.Name == "Read");
        var run = habits.Single(h => h.Name == "Run");

        Assert.Equal(2, read.CurrentStreak);
        Assert.True(read.CompletedToday);
        Assert.Equal(1, run.CurrentStreak);
        Assert.False(run.CompletedToday);
    }

    [Fact]
    public async Task CheckInAsync_DuplicateCheckIn_ThrowsConflictException()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await _habitService.CheckInAsync(userId, habit.Id, today);

        await Assert.ThrowsAsync<ConflictException>(() =>
            _habitService.CheckInAsync(userId, habit.Id, today));

        var logCount = await _db.HabitLogs.CountAsync(l => l.HabitId == habit.Id);
        Assert.Equal(1, logCount);
    }

    [Fact]
    public async Task CheckInAsync_OtherUsersHabit_ThrowsNotFoundException()
    {
        var userA = await RegisterUserAsync("user-a@example.com");
        var userB = await RegisterUserAsync("user-b@example.com");
        var habit = await _habitService.CreateAsync(userA, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _habitService.CheckInAsync(userB, habit.Id, today));
    }

    [Fact]
    public async Task CheckInAsync_FutureDate_ThrowsValidationException()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(2);

        await Assert.ThrowsAsync<ValidationException>(() =>
            _habitService.CheckInAsync(userId, habit.Id, futureDate));
    }

    [Fact]
    public async Task CheckInAsync_DateBeforeCreation_ThrowsValidationException()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var trackedHabit = await _db.Habits.FindAsync(habit.Id);

        trackedHabit!.CreatedAt = today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await Assert.ThrowsAsync<ValidationException>(() =>
            _habitService.CheckInAsync(userId, habit.Id, today.AddDays(-1)));
    }

    [Fact]
    public async Task CheckInAsync_ArchivedHabit_ThrowsConflictException()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await _habitService.ArchiveAsync(userId, habit.Id);

        await Assert.ThrowsAsync<ConflictException>(() =>
            _habitService.CheckInAsync(userId, habit.Id, today));
    }

    [Fact]
    public async Task CheckInAsync_ReturnsUpdatedStreak()
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

        var response = await _habitService.CheckInAsync(userId, habit.Id, today);

        Assert.Equal(today.ToString("yyyy-MM-dd"), response.Date);
        Assert.Equal(2, response.CurrentStreak);
        Assert.Equal(2, response.BestStreak);
    }

    [Fact]
    public async Task UndoCheckInAsync_RemovesLogAndReturnsDecrementedStreak()
    {
        var userId = await RegisterUserAsync("user@example.com");
        var habit = await _habitService.CreateAsync(userId, ValidCreateRequest("Read"));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var trackedHabit = await _db.Habits.FindAsync(habit.Id);

        trackedHabit!.CreatedAt = today.AddDays(-5).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        _db.HabitLogs.AddRange(
            CreateLog(habit.Id, today.AddDays(-1)),
            CreateLog(habit.Id, today));
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var response = await _habitService.UndoCheckInAsync(userId, habit.Id, today);

        Assert.Equal(1, response.CurrentStreak);
        Assert.Equal(2, response.BestStreak);

        var remainingLogs = await _db.HabitLogs.CountAsync(l => l.HabitId == habit.Id);
        Assert.Equal(1, remainingLogs);
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

    private static UpdateHabitRequest ValidUpdateRequest(string name) =>
        new(name, "Updated", "icon", "#AABBCC", ScheduleType.SpecificDays, WeekDays.Monday, "09:30");

    public void Dispose()
    {
        _db.Dispose();
        _serviceProvider.Dispose();
    }
}
