using FluentValidation;
using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Application.Exceptions;
using HabitTracker.Application.Habits;
using HabitTracker.Application.Habits.DTOs;
using System.Globalization;

namespace HabitTracker.Api.Endpoints;

public static class HabitsEndpoints
{
    public static RouteGroupBuilder MapHabitsEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", ListAsync);
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapPost("/", CreateAsync);
        group.MapPut("/{id:guid}", UpdateAsync);
        group.MapPost("/{id:guid}/archive", ArchiveAsync);
        group.MapPost("/{id:guid}/unarchive", UnarchiveAsync);
        group.MapPost("/{id:guid}/checkins", CheckInAsync);
        group.MapDelete("/{id:guid}/checkins/{date}", UndoCheckInAsync);
        group.MapGet("/{id:guid}/logs", GetLogsAsync);
        group.MapGet("/{id:guid}/stats", GetStatsAsync);

        return group;
    }

    private static async Task<IResult> ListAsync(
        ICurrentUser currentUser,
        HabitService habitService,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId(currentUser);
        var habits = await habitService.ListAsync(userId, includeArchived, cancellationToken);
        return Results.Ok(habits);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        ICurrentUser currentUser,
        HabitService habitService,
        CancellationToken cancellationToken)
    {
        var userId = RequireUserId(currentUser);
        var habit = await habitService.GetByIdAsync(userId, id, cancellationToken);
        return Results.Ok(habit);
    }

    private static async Task<IResult> CreateAsync(
        CreateHabitRequest request,
        ICurrentUser currentUser,
        HabitService habitService,
        IValidator<CreateHabitRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);

        var userId = RequireUserId(currentUser);
        var habit = await habitService.CreateAsync(userId, request, cancellationToken);
        return Results.Created($"/api/v1/habits/{habit.Id}", habit);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateHabitRequest request,
        ICurrentUser currentUser,
        HabitService habitService,
        IValidator<UpdateHabitRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);

        var userId = RequireUserId(currentUser);
        var habit = await habitService.UpdateAsync(userId, id, request, cancellationToken);
        return Results.Ok(habit);
    }

    private static async Task<IResult> ArchiveAsync(
        Guid id,
        ICurrentUser currentUser,
        HabitService habitService,
        CancellationToken cancellationToken)
    {
        var userId = RequireUserId(currentUser);
        await habitService.ArchiveAsync(userId, id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> UnarchiveAsync(
        Guid id,
        ICurrentUser currentUser,
        HabitService habitService,
        CancellationToken cancellationToken)
    {
        var userId = RequireUserId(currentUser);
        await habitService.UnarchiveAsync(userId, id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> CheckInAsync(
        Guid id,
        CheckInRequest request,
        ICurrentUser currentUser,
        HabitService habitService,
        IValidator<CheckInRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);

        var userId = RequireUserId(currentUser);
        var date = DateOnly.ParseExact(request.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var response = await habitService.CheckInAsync(userId, id, date, cancellationToken);
        return Results.Created($"/api/v1/habits/{id}/checkins/{response.Date}", response);
    }

    private static async Task<IResult> UndoCheckInAsync(
        Guid id,
        string date,
        ICurrentUser currentUser,
        HabitService habitService,
        CancellationToken cancellationToken)
    {
        if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
            return Results.BadRequest(new { title = "Invalid date.", detail = "Date must be in YYYY-MM-DD format." });

        var userId = RequireUserId(currentUser);
        var response = await habitService.UndoCheckInAsync(userId, id, parsedDate, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetLogsAsync(
        Guid id,
        ICurrentUser currentUser,
        HabitService habitService,
        string? month = null,
        CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var year = today.Year;
        var monthNumber = today.Month;

        if (month is not null)
        {
            if (!DateOnly.TryParseExact($"{month}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedMonth))
                return Results.BadRequest(new { title = "Invalid month.", detail = "Month must be in YYYY-MM format." });

            year = parsedMonth.Year;
            monthNumber = parsedMonth.Month;
        }

        var userId = RequireUserId(currentUser);
        var response = await habitService.GetLogsAsync(userId, id, year, monthNumber, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetStatsAsync(
        Guid id,
        ICurrentUser currentUser,
        HabitService habitService,
        CancellationToken cancellationToken)
    {
        var userId = RequireUserId(currentUser);
        var response = await habitService.GetStatsAsync(userId, id, cancellationToken);
        return Results.Ok(response);
    }

    private static Guid RequireUserId(ICurrentUser currentUser) =>
        currentUser.UserId ?? throw new UnauthorizedException("Authentication required.");
}
