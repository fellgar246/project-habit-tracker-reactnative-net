namespace HabitTracker.Application.Auth.DTOs;

public record RegisterRequest(string Email, string Password, string DisplayName);
