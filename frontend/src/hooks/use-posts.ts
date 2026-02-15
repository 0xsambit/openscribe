import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface PostsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function usePosts(params: PostsParams = {}) {
  const { page = 1, limit = 20, search, sortBy, sortOrder } = params;

  return useQuery({
    queryKey: ['posts', { page, limit, search, sortBy, sortOrder }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('limit', String(limit));
      if (search) searchParams.set('search', search);
      if (sortBy) searchParams.set('sortBy', sortBy);
      if (sortOrder) searchParams.set('sortOrder', sortOrder);
      const { data } = await apiClient.get(`/linkedin/posts?${searchParams}`);
      return data;
    },
  });
}

export function useUploadPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/linkedin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await apiClient.delete(`/linkedin/posts/${postId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
