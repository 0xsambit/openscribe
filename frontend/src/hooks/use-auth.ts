'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth({ requireAuth = true }: { requireAuth?: boolean } = {}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchProfile, logout } = useAuthStore();

  useEffect(() => {
    if (isLoading) {
      fetchProfile();
    }
  }, [isLoading, fetchProfile]);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, requireAuth, router]);

  return { user, isAuthenticated, isLoading, logout };
}
