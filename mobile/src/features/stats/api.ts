import { apiClient } from '../../api/client';
import { StatsSummaryResponse } from '../../types/api';

export async function getStatsSummary(): Promise<StatsSummaryResponse> {
  return apiClient.get<StatsSummaryResponse>('/stats/summary');
}
