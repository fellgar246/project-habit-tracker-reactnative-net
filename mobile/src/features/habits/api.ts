import { apiClient } from '../../api/client';
import {
  CheckInResponse,
  CreateHabitRequest,
  HabitDto,
  UndoCheckInResponse,
  UpdateHabitRequest,
} from '../../types/api';

export async function getHabits(includeArchived = false): Promise<HabitDto[]> {
  const query = includeArchived ? '?includeArchived=true' : '';
  return apiClient.get<HabitDto[]>(`/habits${query}`);
}

export async function getHabit(id: string): Promise<HabitDto> {
  return apiClient.get<HabitDto>(`/habits/${id}`);
}

export async function createHabit(request: CreateHabitRequest): Promise<HabitDto> {
  return apiClient.post<HabitDto>('/habits', request);
}

export async function updateHabit(
  id: string,
  request: UpdateHabitRequest,
): Promise<HabitDto> {
  return apiClient.put<HabitDto>(`/habits/${id}`, request);
}

export async function archiveHabit(id: string): Promise<void> {
  return apiClient.post<void>(`/habits/${id}/archive`);
}

export async function checkIn(habitId: string, date: string): Promise<CheckInResponse> {
  return apiClient.post<CheckInResponse>(`/habits/${habitId}/checkins`, { date });
}

export async function undoCheckIn(habitId: string, date: string): Promise<UndoCheckInResponse> {
  return apiClient.delete<UndoCheckInResponse>(`/habits/${habitId}/checkins/${date}`);
}
