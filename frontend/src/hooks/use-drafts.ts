import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface DraftsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export function useDrafts(params: DraftsParams = {}) {
  const { page = 1, limit = 20, status } = params;

  return useQuery({
    queryKey: ['drafts', { page, limit, status }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('limit', String(limit));
      if (status) searchParams.set('status', status);
      const { data } = await apiClient.get(`/content/drafts?${searchParams}`);
      return data;
    },
  });
}

export function useDraft(id: string) {
  return useQuery({
    queryKey: ['draft', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/content/drafts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { topic?: string; tone?: string; strategyId?: string }) => {
      const { data } = await apiClient.post('/content/generate', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await apiClient.put(`/content/drafts/${id}`, { content });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['draft', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      rating,
      feedback,
    }: {
      id: string;
      rating: number;
      feedback?: string;
    }) => {
      const { data } = await apiClient.post(`/content/drafts/${id}/feedback`, {
        rating,
        feedback,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['draft', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/content/drafts/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}
