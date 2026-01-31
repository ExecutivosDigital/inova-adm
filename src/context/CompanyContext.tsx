"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { decodeJwtPayload, isSuperAdmin } from "@/lib/jwt";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CompanyOption {
  id: string;
  corporateName: string;
}

interface CompanyContextValue {
  companies: CompanyOption[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  isSuperAdmin: boolean;
  loading: boolean;
  /** ID da empresa a usar em APIs (Super Admin = selectedCompanyId; Admin de empresa = companyId do JWT) */
  effectiveCompanyId: string | null;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

const STORAGE_KEY = "inova-adm-selected-company-id";

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (ctx === undefined)
    throw new Error("useCompany deve ser usado dentro de <CompanyProvider>");
  return ctx;
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { GetAPI } = useApiContext();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(STORAGE_KEY);
  });
  const [loading, setLoading] = useState(false);

  const isSuperAdminUser = useMemo(() => isSuperAdmin(token ?? null), [token]);

  const setSelectedCompanyId = useCallback((id: string | null) => {
    setSelectedCompanyIdState(id);
    if (typeof window !== "undefined") {
      if (id) sessionStorage.setItem(STORAGE_KEY, id);
      else sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdminUser || !token) {
      setCompanies([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    GetAPI("/company/fetch", true)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 200 && res.body?.companies) {
          const list = (res.body.companies as { id: string; corporateName: string }[]).map(
            (c) => ({ id: c.id, corporateName: c.corporateName ?? c.id })
          );
          setCompanies(list);
          setSelectedCompanyIdState((current) => {
            const valid = list.some((c) => c.id === current);
            if (!valid && list.length > 0) {
              const first = list[0].id;
              if (typeof window !== "undefined")
                sessionStorage.setItem(STORAGE_KEY, first);
              return first;
            }
            return current;
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdminUser, token, GetAPI]);

  const effectiveCompanyId = useMemo(() => {
    if (!token) return null;
    if (isSuperAdminUser) return selectedCompanyId;
    const payload = decodeJwtPayload(token);
    return payload.companyId && payload.companyId !== "admin" ? payload.companyId : null;
  }, [token, isSuperAdminUser, selectedCompanyId]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      companies,
      selectedCompanyId,
      setSelectedCompanyId,
      isSuperAdmin: isSuperAdminUser,
      loading,
      effectiveCompanyId,
    }),
    [companies, selectedCompanyId, setSelectedCompanyId, isSuperAdminUser, loading, effectiveCompanyId]
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}
