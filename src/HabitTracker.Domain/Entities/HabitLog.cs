namespace HabitTracker.Domain.Entities;

public class HabitLog
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public DateOnly Date { get; set; }
    public DateTime CompletedAt { get; set; }
    public Habit Habit { get; set; } = null!;
}
