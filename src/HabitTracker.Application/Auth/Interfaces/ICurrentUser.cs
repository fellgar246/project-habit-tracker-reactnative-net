namespace HabitTracker.Application.Auth.Interfaces;

public interface ICurrentUser
{
    Guid? UserId { get; }
}
