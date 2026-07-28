namespace HabitTracker.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public ICollection<Habit> Habits { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
