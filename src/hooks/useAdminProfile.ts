"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  companyId: string | null;
  isSuperAdmin: boolean;
}

export function useAdminProfile() {
  const { token } = useAuth();
  const { GetAPI } = useApiContext();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await GetAPI("/admin/me", true);
      if (res.status === 200 && (res.body as { admin?: AdminProfile })?.admin) {
        setProfile((res.body as { admin: AdminProfile }).admin);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token, GetAPI]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /** Retorna iniciais do nome (ex.: "João da Silva" → "JS") */
  const initials = profile?.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "—";

  /** Rótulo do perfil: Super Admin, Admin da empresa ou neutro quando sem perfil */
  const roleLabel = profile
    ? profile.isSuperAdmin
      ? "Super Admin"
      : "Admin da empresa"
    : "Admin";

  return { profile, loading, initials, roleLabel, refetch: fetchProfile };
}
