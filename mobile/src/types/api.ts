export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
};

export type HealthResponse = {
  status: string;
  database: string;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
};

/** Matches backend ScheduleType enum (numeric JSON). */
export const ScheduleType = {
  Daily: 0,
  SpecificDays: 1,
} as const;

export type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType];

export type HabitDto = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  scheduleType: ScheduleType;
  scheduleDays: number | null;
  reminderTime: string | null;
  isArchived: boolean;
  createdAt: string;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  isScheduledToday: boolean;
};

export type CreateHabitRequest = {
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  scheduleType: ScheduleType;
  scheduleDays?: number | null;
  reminderTime?: string | null;
};

export type UpdateHabitRequest = CreateHabitRequest;

export type CheckInResponse = {
  date: string;
  currentStreak: number;
  bestStreak: number;
};

export type UndoCheckInResponse = {
  currentStreak: number;
  bestStreak: number;
};

export type HabitLogsResponse = {
  month: string;
  scheduledDates: string[];
  completedDates: string[];
};

export type WeekdayStatsDto = {
  weekday: number;
  scheduled: number;
  completed: number;
};

export type HabitDayStatsDto = {
  date: string;
  scheduled: boolean;
  completed: boolean;
};

export type HabitStatsResponse = {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate30d: number | null;
  byWeekday: WeekdayStatsDto[];
  last30Days: HabitDayStatsDto[];
};

export type LongestCurrentStreakDto = {
  habitId: string;
  habitName: string;
  streak: number;
};

export type SummaryDayStatsDto = {
  date: string;
  completed: number;
  scheduled: number;
};

export type StatsSummaryResponse = {
  activeHabits: number;
  completedToday: number;
  scheduledToday: number;
  longestCurrentStreak: LongestCurrentStreakDto | null;
  last30Days: SummaryDayStatsDto[];
  byWeekday: WeekdayStatsDto[];
};
