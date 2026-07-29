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

    private static Guid RequireUserId(ICurrentUser currentUser) =>
        currentUser.UserId ?? throw new UnauthorizedException("Authentication required.");
}
