'use client';

import { useState, useEffect, useCallback } from 'react';

// VIOLATION: Implicit `any` from untyped external module
// Simulates importing from an untyped package
declare module 'legacy-auth-provider' {
  const configure: any;
  const getUser: any;
  const refreshSession: any;
  export { configure, getUser, refreshSession };
}

// VIOLATION: Implicit `any` — function params not typed, return not typed
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  // VIOLATION: `refreshToken` callback has implicit `any` return
  const refreshToken = useCallback(async () => {
    const response = await fetch('/api/auth/refresh', { method: 'POST' });
    const data = await response.json();
    return data;
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch {
        // Silently fail — user is not authenticated
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return { user, loading, error, login, logout, refreshToken };
}
