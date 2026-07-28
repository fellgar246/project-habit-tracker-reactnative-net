import { apiClient } from '../client';
import { AuthResponse, User } from '../../types/api';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', payload);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', payload);
}

export async function logout(refreshToken: string): Promise<void> {
  return apiClient.post<void>('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<User> {
  return apiClient.get<User>('/me');
}
