using HabitTracker.Application.Auth.Interfaces;

namespace HabitTracker.Infrastructure.Auth;

public class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 11;

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}
