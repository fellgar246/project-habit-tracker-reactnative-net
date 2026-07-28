using FluentValidation;
using HabitTracker.Application.Auth;
using HabitTracker.Application.Auth.DTOs;
using HabitTracker.Application.Auth.Interfaces;

namespace HabitTracker.Api.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/register", RegisterAsync);
        group.MapPost("/login", LoginAsync);
        group.MapPost("/refresh", RefreshAsync);
        group.MapPost("/logout", LogoutAsync);

        return group;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        AuthService authService,
        IValidator<RegisterRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await authService.RegisterAsync(request, cancellationToken);
        return Results.Created("/api/v1/me", response);
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        AuthService authService,
        IValidator<LoginRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await authService.LoginAsync(request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> RefreshAsync(
        RefreshRequest request,
        AuthService authService,
        IValidator<RefreshRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await authService.RefreshAsync(request.RefreshToken, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> LogoutAsync(
        LogoutRequest request,
        AuthService authService,
        IValidator<LogoutRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        await authService.LogoutAsync(request.RefreshToken, cancellationToken);
        return Results.NoContent();
    }
}
