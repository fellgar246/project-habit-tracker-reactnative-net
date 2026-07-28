using FluentValidation;
using HabitTracker.Application.Auth;
using HabitTracker.Application.Habits;
using Microsoft.Extensions.DependencyInjection;

namespace HabitTracker.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<AuthService>();
        services.AddScoped<AuthService>();
        services.AddScoped<HabitService>();

        return services;
    }
}
