using HabitTracker.Domain;
using HabitTracker.Domain.Enums;

namespace HabitTracker.Domain.Entities;

public class Habit
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public ScheduleType ScheduleType { get; set; }
    public int? ScheduleDays { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
    public User User { get; set; } = null!;
    public ICollection<HabitLog> Logs { get; set; } = [];

    /// <summary>
    /// Whether this habit is scheduled on the given date according to its current schedule.
    /// Changing ScheduleType after logs exist is allowed; streaks are recalculated using the active schedule.
    /// </summary>
    public bool IsScheduledOn(DateOnly date) => ScheduleType switch
    {
        ScheduleType.Daily => true,
        ScheduleType.SpecificDays => ScheduleDays.HasValue
            && WeekDays.Contains(ScheduleDays.Value, date.DayOfWeek),
        _ => false
    };
}
