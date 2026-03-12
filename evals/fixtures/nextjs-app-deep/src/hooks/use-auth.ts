'use client';

import { useState, useCallback } from 'react';
import { saveSession, clearSession, getSession } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        saveSession(data.accessToken, data.refreshToken);
        setUser(data.user);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const checkSession = useCallback(() => {
    const session = getSession();
    if (session) {
      setLoading(true);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data.user));
    }
  }, []);

  return { user, login, logout, loading, checkSession };
}
