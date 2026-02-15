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
      strategyType: string;
      postingFrequency: number;
      targetAudience?: string;
      goals?: string;
    }) => {
      const { data } = await apiClient.post('/strategy/generate', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy'] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
