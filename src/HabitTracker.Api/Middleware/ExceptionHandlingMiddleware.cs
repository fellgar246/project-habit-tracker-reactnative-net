using System.Text.Json;
using FluentValidation;
using HabitTracker.Application.Exceptions;

namespace HabitTracker.Api.Middleware;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    IHostEnvironment environment)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, detail, errors) = MapException(exception);

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new Dictionary<string, object?>
        {
            ["type"] = $"https://httpstatuses.com/{statusCode}",
            ["title"] = title,
            ["status"] = statusCode,
            ["detail"] = detail,
            ["instance"] = context.Request.Path.Value
        };

        if (errors is not null)
            problem["errors"] = errors;

        if (environment.IsDevelopment() && statusCode >= 500)
            problem["trace"] = exception.ToString();

        await context.Response.WriteAsync(JsonSerializer.Serialize(problem, JsonOptions));
    }

    private static (int StatusCode, string Title, string Detail, IDictionary<string, string[]>? Errors) MapException(Exception exception)
    {
        return exception switch
        {
            ValidationException validationException => (
                StatusCodes.Status400BadRequest,
                "Validation failed.",
                "One or more validation errors occurred.",
                validationException.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())),

            ConflictException conflictException => (
                StatusCodes.Status409Conflict,
                "Conflict.",
                conflictException.Message,
                null),

            NotFoundException notFoundException => (
                StatusCodes.Status404NotFound,
                "Not found.",
                notFoundException.Message,
                null),

            UnauthorizedException unauthorizedException => (
                StatusCodes.Status401Unauthorized,
                "Unauthorized.",
                unauthorizedException.Message,
                null),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Internal server error.",
                "An unexpected error occurred.",
                null)
        };
    }
}
