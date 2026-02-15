import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useApiKeys() {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api-keys');
      return data;
    },
  });
}

export function useAddApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { provider: string; apiKey: string; label?: string }) => {
      const { data } = await apiClient.post('/api-keys', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/api-keys/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
}
