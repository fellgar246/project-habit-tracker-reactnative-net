using HabitTracker.Application.Auth.Interfaces;
using HabitTracker.Domain;
using HabitTracker.Domain.Entities;
using HabitTracker.Domain.Enums;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HabitTracker.Infrastructure.Data;

public static class DemoDataSeeder
{
    public const string DemoEmail = "demo@habittracker.local";
    public const string DemoPassword = "Demo1234";

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher passwordHasher, ILogger logger)
    {
        if (await db.Users.AnyAsync(u => u.Email == DemoEmail))
        {
            logger.LogInformation("Demo user already exists — skipping seed.");
            return;
        }

        logger.LogInformation("Seeding demo data for {Email}…", DemoEmail);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = DemoEmail,
            PasswordHash = passwordHasher.Hash(DemoPassword),
            DisplayName = "Usuario Demo",
            CreatedAt = DateTime.UtcNow.AddDays(-70),
        };

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var habits = new[]
        {
            CreateHabit(user.Id, "Beber agua", "💧", "#3B82F6", ScheduleType.Daily, null,
                new TimeOnly(8, 0), today.AddDays(-65), today),
            CreateHabit(user.Id, "Gimnasio", "💪", "#EF4444", ScheduleType.SpecificDays,
                WeekDays.Monday | WeekDays.Wednesday | WeekDays.Friday,
                new TimeOnly(18, 30), today.AddDays(-60), today, brokenStreakAt: today.AddDays(-3)),
            CreateHabit(user.Id, "Meditar", "🧘", "#8B5CF6", ScheduleType.Daily, null,
                new TimeOnly(7, 0), today.AddDays(-5), today),
            CreateHabit(user.Id, "Correr", "🏃", "#10B981", ScheduleType.SpecificDays,
                WeekDays.Tuesday | WeekDays.Thursday,
                new TimeOnly(6, 30), today.AddDays(-55), today, irregular: true),
            CreateHabit(user.Id, "Leer", "📚", "#F59E0B", ScheduleType.Daily, null,
                new TimeOnly(21, 0), today.AddDays(-50), today, completionRate: 0.7),
        };

        db.Users.Add(user);
        db.Habits.AddRange(habits.Select(h => h.Habit));

        foreach (var (habit, logs) in habits)
        {
            db.HabitLogs.AddRange(logs);
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Demo data seeded successfully.");
    }

    private static (Habit Habit, List<HabitLog> Logs) CreateHabit(
        Guid userId,
        string name,
        string icon,
        string color,
        ScheduleType scheduleType,
        int? scheduleDays,
        TimeOnly reminderTime,
        DateOnly startDate,
        DateOnly today,
        DateOnly? brokenStreakAt = null,
        bool irregular = false,
        double completionRate = 0.92)
    {
        var habitId = Guid.NewGuid();
        var createdAt = startDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var habit = new Habit
        {
            Id = habitId,
            UserId = userId,
            Name = name,
            Description = null,
            Icon = icon,
            Color = color,
            ScheduleType = scheduleType,
            ScheduleDays = scheduleDays,
            ReminderTime = reminderTime,
            IsArchived = false,
            CreatedAt = createdAt,
        };

        var logs = new List<HabitLog>();
        var random = new Random(name.GetHashCode());

        for (var date = startDate; date <= today; date = date.AddDays(1))
        {
            if (!habit.IsScheduledOn(date))
                continue;

            var shouldComplete = brokenStreakAt.HasValue && date >= brokenStreakAt
                ? date >= today.AddDays(-1)
                : irregular
                    ? random.NextDouble() < 0.55
                    : random.NextDouble() < completionRate;

            if (!shouldComplete)
                continue;

            logs.Add(new HabitLog
            {
                Id = Guid.NewGuid(),
                HabitId = habitId,
                Date = date,
                CompletedAt = date.ToDateTime(reminderTime, DateTimeKind.Utc).AddMinutes(random.Next(5, 45)),
            });
        }

        return (habit, logs);
    }
}
