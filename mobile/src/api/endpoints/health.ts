import { fetchAbsolute } from '../client';
import { getHealthUrl } from '../config';
import { HealthResponse } from '../../types/api';

export async function checkHealth(): Promise<HealthResponse> {
  return fetchAbsolute<HealthResponse>(getHealthUrl());
}
