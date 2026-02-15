import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useCurrentStrategy() {
  return useQuery({
    queryKey: ['strategy', 'current'],
    queryFn: async () => {
      const { data } = await apiClient.get('/strategy/current');
      return data;
    },
  });
}

export function useStrategies() {
  return useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const { data } = await apiClient.get('/strategy');
      return data;
    },
  });
}

export function useGenerateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      strategyType: 'weekly' | 'monthly' | 'campaign';
      postingFrequency: number;
      targetAudience: {
        description: string;
        industries?: string[];
        roles?: string[];
        interests?: string[];
      };
      goals: {
        primary: 'thought_leadership' | 'lead_generation' | 'community_building' | 'brand_awareness';
        secondary?: string[];
        kpis?: string[];
      };
    }) => {
      const { data } = await apiClient.post('/strategy/generate', params);
      return data;
    },
    onSuccess: () => {
      // Don't invalidate strategy queries here — the job is async.
      // The useJobPolling hook will invalidate when the job completes.
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
