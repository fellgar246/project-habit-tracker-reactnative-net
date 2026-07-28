using HabitTracker.Application.Auth.DTOs;
using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Application.Exceptions;
using HabitTracker.Domain.Entities;

namespace HabitTracker.Application.Auth;

public class AuthService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IRefreshTokenRepository refreshTokenRepository)
{
    private const string InvalidCredentialsMessage = "Invalid email or password.";
    private const string InvalidRefreshTokenMessage = "Invalid or expired refresh token.";

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);

        if (await userRepository.EmailExistsAsync(email, cancellationToken))
            throw new ConflictException("Email is already in use.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password),
            DisplayName = request.DisplayName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return await IssueAuthResponseAsync(user, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        var user = await userRepository.GetByEmailAsync(email, cancellationToken);

        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException(InvalidCredentialsMessage);

        return await IssueAuthResponseAsync(user, cancellationToken);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var storedToken = await refreshTokenRepository.GetByTokenAsync(refreshToken, cancellationToken);

        if (storedToken is null || storedToken.RevokedAt is not null || storedToken.ExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedException(InvalidRefreshTokenMessage);

        storedToken.RevokedAt = DateTime.UtcNow;
        await refreshTokenRepository.SaveChangesAsync(cancellationToken);

        return await IssueAuthResponseAsync(storedToken.User, cancellationToken);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var storedToken = await refreshTokenRepository.GetByTokenAsync(refreshToken, cancellationToken);

        if (storedToken is null || storedToken.RevokedAt is not null)
            return;

        storedToken.RevokedAt = DateTime.UtcNow;
        await refreshTokenRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);

        if (user is null)
            throw new NotFoundException("User not found.");

        return MapUser(user);
    }

    private async Task<AuthResponse> IssueAuthResponseAsync(User user, CancellationToken cancellationToken)
    {
        var (accessToken, expiresAt) = tokenService.GenerateAccessToken(user);
        var refreshTokenValue = tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = tokenService.GetRefreshTokenExpiry()
        };

        await refreshTokenRepository.AddAsync(refreshToken, cancellationToken);
        await refreshTokenRepository.SaveChangesAsync(cancellationToken);

        return new AuthResponse(MapUser(user), accessToken, refreshTokenValue, expiresAt);
    }

    private static UserDto MapUser(User user) =>
        new(user.Id, user.Email, user.DisplayName);

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();
}
