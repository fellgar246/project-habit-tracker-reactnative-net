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
