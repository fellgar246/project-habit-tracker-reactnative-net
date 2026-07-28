using HabitTracker.Application.Auth;
using HabitTracker.Application.Auth.DTOs;
using HabitTracker.Application.Exceptions;
using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Application.Habits;
using HabitTracker.Application.Habits.DTOs;
using HabitTracker.Application.Habits.Interfaces;
using HabitTracker.Domain;
using HabitTracker.Domain.Enums;
using HabitTracker.Infrastructure.Auth;
using HabitTracker.Infrastructure.Data;
using HabitTracker.Infrastructure.Habits;
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
