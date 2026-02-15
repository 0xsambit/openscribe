import { create } from 'zustand';
import apiClient from '@/lib/api-client';
import { setTokens, clearTokens, getAccessToken } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  onboardingCompleted: boolean;
  preferences: Record<string, unknown>;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'name'>>) => Promise<void>;
  updatePreferences: (preferences: Record<string, unknown>) => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = data.data;
    setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (email, password, name) => {
    const { data } = await apiClient.post('/auth/register', { email, password, name });
    const { user, accessToken, refreshToken } = data.data;
    setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchProfile: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const { data } = await apiClient.get('/users/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (profileData) => {
    const { data } = await apiClient.put('/users/me', profileData);
    set({ user: data.data });
  },

  updatePreferences: async (preferences) => {
    const { data } = await apiClient.put('/users/me/preferences', { preferences });
    set({ user: data.data });
  },

  reset: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
