using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Infrastructure.Habits;

internal static class DbExceptionHelper
{
    public static bool IsUniqueConstraintViolation(DbUpdateException exception) =>
        exception.InnerException?.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) == true
        || exception.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true
        || exception.Entries.Any(e => e.Entity.GetType().Name == nameof(Domain.Entities.HabitLog));
}
