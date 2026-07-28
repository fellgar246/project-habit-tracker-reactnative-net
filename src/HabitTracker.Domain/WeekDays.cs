namespace HabitTracker.Domain;

public static class WeekDays
{
    public const int Sunday = 1;
    public const int Monday = 2;
    public const int Tuesday = 4;
    public const int Wednesday = 8;
    public const int Thursday = 16;
    public const int Friday = 32;
    public const int Saturday = 64;

    public static bool Contains(int mask, DayOfWeek day) => day switch
    {
        DayOfWeek.Sunday => (mask & Sunday) != 0,
        DayOfWeek.Monday => (mask & Monday) != 0,
        DayOfWeek.Tuesday => (mask & Tuesday) != 0,
        DayOfWeek.Wednesday => (mask & Wednesday) != 0,
        DayOfWeek.Thursday => (mask & Thursday) != 0,
        DayOfWeek.Friday => (mask & Friday) != 0,
        DayOfWeek.Saturday => (mask & Saturday) != 0,
        _ => false
    };
}
