using HabitTracker.Application.Auth;
using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Application.Exceptions;

namespace HabitTracker.Api.Endpoints;

public static class MeEndpoints
{
    public static RouteGroupBuilder MapMeEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/me", GetMeAsync);

        return group;
    }

    private static async Task<IResult> GetMeAsync(
        ICurrentUser currentUser,
        AuthService authService,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is not Guid userId)
            throw new UnauthorizedException("Authentication required.");

        var user = await authService.GetCurrentUserAsync(userId, cancellationToken);
        return Results.Ok(user);
    }
}
