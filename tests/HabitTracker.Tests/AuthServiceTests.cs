using HabitTracker.Application.Auth;
using HabitTracker.Application.Auth.DTOs;
using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Application.Exceptions;
using HabitTracker.Infrastructure.Auth;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace HabitTracker.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly AppDbContext _db;
    private readonly AuthService _authService;

    public AuthServiceTests()
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
        services.AddScoped<AuthService>();

        _serviceProvider = services.BuildServiceProvider();
        _db = _serviceProvider.GetRequiredService<AppDbContext>();
        _authService = _serviceProvider.GetRequiredService<AuthService>();
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsConflictException()
    {
        var request = new RegisterRequest("user@example.com", "password123", "Test User");

        await _authService.RegisterAsync(request);

        await Assert.ThrowsAsync<ConflictException>(() =>
            _authService.RegisterAsync(new RegisterRequest("USER@example.com", "password123", "Other User")));
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsUnauthorizedException()
    {
        await _authService.RegisterAsync(new RegisterRequest("user@example.com", "password123", "Test User"));

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _authService.LoginAsync(new LoginRequest("user@example.com", "wrongpassword")));
    }

    [Fact]
    public async Task RefreshAsync_RevokedToken_ThrowsUnauthorizedException()
    {
        var registerResponse = await _authService.RegisterAsync(
            new RegisterRequest("user@example.com", "password123", "Test User"));

        await _authService.LogoutAsync(registerResponse.RefreshToken);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _authService.RefreshAsync(registerResponse.RefreshToken));
    }

    [Fact]
    public async Task RefreshAsync_Success_RevokesPreviousToken()
    {
        var registerResponse = await _authService.RegisterAsync(
            new RegisterRequest("user@example.com", "password123", "Test User"));

        var refreshResponse = await _authService.RefreshAsync(registerResponse.RefreshToken);

        Assert.NotEqual(registerResponse.RefreshToken, refreshResponse.RefreshToken);

        var oldToken = await _db.RefreshTokens
            .FirstAsync(rt => rt.Token == registerResponse.RefreshToken);
        Assert.NotNull(oldToken.RevokedAt);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _authService.RefreshAsync(registerResponse.RefreshToken));
    }

    [Fact]
    public async Task RegisterAsync_PasswordIsStoredHashed()
    {
        const string plainPassword = "password123";

        await _authService.RegisterAsync(
            new RegisterRequest("user@example.com", plainPassword, "Test User"));

        var user = await _db.Users.SingleAsync();

        Assert.NotEqual(plainPassword, user.PasswordHash);
        Assert.DoesNotContain(plainPassword, user.PasswordHash);
        Assert.StartsWith("$2", user.PasswordHash);
    }

    public void Dispose()
    {
        _db.Dispose();
        _serviceProvider.Dispose();
    }
}
