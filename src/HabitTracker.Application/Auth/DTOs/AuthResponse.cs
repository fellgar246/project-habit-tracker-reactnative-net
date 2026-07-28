namespace HabitTracker.Application.Auth.DTOs;

public record AuthResponse(
    UserDto User,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt);
