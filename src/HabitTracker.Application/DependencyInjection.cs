using FluentValidation;
using HabitTracker.Application.Auth;
using Microsoft.Extensions.DependencyInjection;

namespace HabitTracker.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<AuthService>();
        services.AddScoped<AuthService>();

        return services;
    }
}
