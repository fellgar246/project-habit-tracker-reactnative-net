using System.Text;
using System.Text.Json;
using HabitTracker.Api.Endpoints;
using HabitTracker.Api.Middleware;
using HabitTracker.Api.Services;
using HabitTracker.Application;
using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Infrastructure;
using HabitTracker.Infrastructure.Auth;
using HabitTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT configuration is missing.");

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
    throw new InvalidOperationException("JWT Key is not configured. Set Jwt:Key or JWT__Key environment variable.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();

                if (context.Response.HasStarted)
                    return;

                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/problem+json";

                var problem = new
                {
                    type = "https://httpstatuses.com/401",
                    title = "Unauthorized.",
                    status = 401,
                    detail = "Authentication is required.",
                    instance = context.Request.Path.Value
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(problem, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }));
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();

    if (!canConnect)
    {
        return Results.Json(
            new { status = "error", database = "disconnected" },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    return Results.Json(new { status = "ok", database = "connected" });
})
.WithName("HealthCheck")
.AllowAnonymous()
.WithOpenApi();

var apiV1 = app.MapGroup("/api/v1");

apiV1.MapGroup("/auth")
    .AllowAnonymous()
    .MapAuthEndpoints();

apiV1.MapMeEndpoints();

apiV1.MapGroup("/habits")
    .MapHabitsEndpoints();

apiV1.MapGroup("/stats")
    .MapStatsEndpoints();

app.Run();
