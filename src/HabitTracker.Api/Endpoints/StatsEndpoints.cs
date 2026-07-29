using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Application.Exceptions;
using HabitTracker.Application.Habits;

namespace HabitTracker.Api.Endpoints;

public static class StatsEndpoints
{
    public static IEndpointRouteBuilder MapStatsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/summary", GetSummaryAsync);
        return app;
    }

    private static async Task<IResult> GetSummaryAsync(
        ICurrentUser currentUser,
        HabitService habitService,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException("Authentication required.");
        var response = await habitService.GetSummaryAsync(userId, cancellationToken);
        return Results.Ok(response);
    }
}
