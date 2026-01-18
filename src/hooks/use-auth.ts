"use client";

import { useState, useEffect, useCallback } from "react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  authenticatedAt?: number;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setState({
        isAuthenticated: data.isAuthenticated ?? false,
        isLoading: false,
        authenticatedAt: data.authenticatedAt,
      });
    } catch {
      setState({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          authenticatedAt: Date.now(),
        });
      }
      return data;
    } catch {
      return { ok: false, error: "Network error" };
    }
  }, []);

  const logout = useCallback(async (): Promise<{ ok: boolean }> => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setState({
          isAuthenticated: false,
          isLoading: false,
        });
      }
      return data;
    } catch {
      return { ok: false };
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    refresh: checkSession,
  };
}
