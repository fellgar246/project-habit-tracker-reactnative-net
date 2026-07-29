import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { StatsSummaryResponse } from '../../types/api';
import { statsSummaryQueryKey } from '../habits/hooks';
import * as statsApi from './api';

export function useStatsSummary(): UseQueryResult<StatsSummaryResponse, Error> {
  return useQuery({
    queryKey: statsSummaryQueryKey(),
    queryFn: () => statsApi.getStatsSummary(),
  });
}
