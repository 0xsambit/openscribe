import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useStartStyleAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/analysis/style');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useStartTopicExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/analysis/topics');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useJobResult(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/analysis/style/${jobId}`);
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 3000;
    },
  });
}

export function useEngagementAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'engagement'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/engagement');
      return data;
    },
  });
}

export function useTopicAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'topics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/topics');
      return data;
    },
  });
}
