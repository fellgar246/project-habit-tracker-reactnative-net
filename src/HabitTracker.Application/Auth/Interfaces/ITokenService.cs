using HabitTracker.Domain.Entities;

namespace HabitTracker.Application.Auth.Interfaces;

public interface ITokenService
{
    (string AccessToken, DateTime ExpiresAt) GenerateAccessToken(User user);
    string GenerateRefreshToken();
    DateTime GetRefreshTokenExpiry();
}
