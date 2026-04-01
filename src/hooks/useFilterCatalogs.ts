"use client";

import { useApiContext } from "@/context/ApiContext";
import toast from "react-hot-toast";
import { useCompany } from "@/context/CompanyContext";
import { useCallback, useEffect, useState } from "react";

export interface CatalogItem {
  id: string;
  name: string;
  days?: number;
  description?: string | null;
}

export interface FilterCatalogs {
  periods: CatalogItem[];
  priorities: CatalogItem[];
  teams: CatalogItem[];
  serviceConditions: CatalogItem[];
  jobSystems: CatalogItem[];
  executionTimes: CatalogItem[];
  extraTeams: CatalogItem[];
  estimatedExtraTeamTimes: CatalogItem[];
  serviceModels: CatalogItem[];
  epis: CatalogItem[];
  toolkits: CatalogItem[];
  /** Catálogos do equipamento (cip.subset.set.equipment) */
  sectors: CatalogItem[];
  equipmentTypes: CatalogItem[];
  manufacturers: CatalogItem[];
  costCenters: CatalogItem[];
  safetyConditions: CatalogItem[];
  lubricationSystems: CatalogItem[];
  mainComponents: CatalogItem[];
  powerUnits: CatalogItem[];
}

const emptyCatalogs: FilterCatalogs = {
  periods: [],
  priorities: [],
  teams: [],
  serviceConditions: [],
  jobSystems: [],
  executionTimes: [],
  extraTeams: [],
  estimatedExtraTeamTimes: [],
  serviceModels: [],
  epis: [],
  toolkits: [],
  sectors: [],
  equipmentTypes: [],
  manufacturers: [],
  costCenters: [],
  safetyConditions: [],
  lubricationSystems: [],
  mainComponents: [],
  powerUnits: [],
};

function normalizeCatalog(arr: unknown): CatalogItem[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item: { id: string; name: string; days?: number; description?: string | null }) => ({
    id: item.id,
    name: item.name ?? String(item.id),
    days: item.days,
    description: item.description,
  }));
}

export function useFilterCatalogs() {
  const { GetAPI } = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();
  const [catalogs, setCatalogs] = useState<FilterCatalogs>(emptyCatalogs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async () => {
    if (!effectiveCompanyId) {
      setCatalogs(emptyCatalogs);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const companyQuery = isSuperAdmin ? `?companyId=${effectiveCompanyId}` : "";

    try {
      const res = await GetAPI(`/filter-catalogs${companyQuery}`, true);

      if (res.status === 200 && res.body) {
        const b = res.body;
        setCatalogs({
          periods: normalizeCatalog(b.periods),
          priorities: normalizeCatalog(b.priorities),
          teams: normalizeCatalog(b.teams),
          serviceConditions: normalizeCatalog(b.serviceConditions),
          jobSystems: normalizeCatalog(b.jobSystems),
          executionTimes: normalizeCatalog(b.executionTimes),
          extraTeams: normalizeCatalog(b.extraTeams),
          estimatedExtraTeamTimes: normalizeCatalog(b.estimatedExtraTeamTimes),
          serviceModels: normalizeCatalog(b.serviceModels),
          epis: normalizeCatalog(b.epis),
          toolkits: normalizeCatalog(b.toolkits),
          sectors: normalizeCatalog(b.sectors),
          equipmentTypes: normalizeCatalog(b.equipmentTypes),
          manufacturers: normalizeCatalog(b.manufacturers),
          costCenters: normalizeCatalog(b.costCenters),
          safetyConditions: normalizeCatalog(b.safetyConditions),
          lubricationSystems: normalizeCatalog(b.lubricationSystems),
          mainComponents: normalizeCatalog(b.mainComponents),
          powerUnits: normalizeCatalog(b.powerUnits),
        });
      } else {
        setCatalogs(emptyCatalogs);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar catálogos";
      setError(msg);
      setCatalogs(emptyCatalogs);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, isSuperAdmin, GetAPI]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  return { catalogs, loading, error, refetch: fetchCatalogs };
}
