"use client";
import { useCookies } from "next-client-cookies";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const TOKEN_KEY = process.env.NEXT_PUBLIC_USER_TOKEN || "inova-admin-token";

interface AuthContextValue {
  token: string | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const cookies = useCookies();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = cookies.get(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, [cookies]);

  const signIn = useCallback(
    async (newToken: string) => {
      setLoading(true);
      try {
        cookies.set(TOKEN_KEY, newToken, { path: "/" });
        setToken(newToken);
      } finally {
        setLoading(false);
      }
    },
    [cookies]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      cookies.remove(TOKEN_KEY, { path: "/" });
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [cookies]);

  const value = useMemo<AuthContextValue>(
    () => ({ token, loading, signIn, signOut }),
    [token, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

