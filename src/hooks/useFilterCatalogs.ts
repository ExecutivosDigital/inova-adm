"use client";

import { useApiContext } from "@/context/ApiContext";
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

function normalizeCatalog(body: unknown, key: string): CatalogItem[] {
  const arr = (body as Record<string, unknown>)?.[key];
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
      const [
        periodRes,
        priorityRes,
        teamRes,
        serviceConditionRes,
        jobSystemRes,
        executionTimeRes,
        extraTeamRes,
        estimatedExtraTeamTimeRes,
        serviceModelRes,
        epiRes,
        toolkitRes,
        sectorRes,
        equipmentTypeRes,
        manufacturerRes,
        costCenterRes,
        safetyConditionRes,
        lubricationSystemRes,
        mainComponentRes,
        powerUnitRes,
      ] = await Promise.all([
        GetAPI("/period", true),
        GetAPI("/priority", true),
        GetAPI("/team", true),
        GetAPI("/service-condition", true),
        GetAPI("/job-system", true),
        GetAPI("/execution-time", true),
        GetAPI("/extra-team", true),
        GetAPI("/estimated-extra-team-time", true),
        GetAPI("/service-model", true),
        GetAPI(isSuperAdmin ? `/epi${companyQuery}` : "/epi", true),
        GetAPI(isSuperAdmin ? `/toolkit${companyQuery}` : "/toolkit", true),
        GetAPI(isSuperAdmin ? `/sector${companyQuery}` : "/sector", true),
        GetAPI("/equipment-type", true),
        GetAPI("/manufacturer", true),
        GetAPI(isSuperAdmin ? `/cost-center${companyQuery}` : "/cost-center", true),
        GetAPI("/safety-condition", true),
        GetAPI("/lubrication-system", true),
        GetAPI("/main-component", true),
        GetAPI("/power-unit", true),
      ]);

      setCatalogs({
        periods: periodRes.status === 200 ? normalizeCatalog(periodRes.body, "periods") : [],
        priorities: priorityRes.status === 200 ? normalizeCatalog(priorityRes.body, "priorities") : [],
        teams: teamRes.status === 200 ? normalizeCatalog(teamRes.body, "teams") : [],
        serviceConditions:
          serviceConditionRes.status === 200 ? normalizeCatalog(serviceConditionRes.body, "serviceConditions") : [],
        jobSystems: jobSystemRes.status === 200 ? normalizeCatalog(jobSystemRes.body, "jobSystems") : [],
        executionTimes:
          executionTimeRes.status === 200 ? normalizeCatalog(executionTimeRes.body, "executionTimes") : [],
        extraTeams: extraTeamRes.status === 200 ? normalizeCatalog(extraTeamRes.body, "extraTeams") : [],
        estimatedExtraTeamTimes:
          estimatedExtraTeamTimeRes.status === 200
            ? normalizeCatalog(estimatedExtraTeamTimeRes.body, "estimatedExtraTeamTimes")
            : [],
        serviceModels:
          serviceModelRes.status === 200 ? normalizeCatalog(serviceModelRes.body, "serviceModels") : [],
        epis: epiRes.status === 200 ? normalizeCatalog(epiRes.body, "epis") : [],
        toolkits: toolkitRes.status === 200 ? normalizeCatalog(toolkitRes.body, "toolkits") : [],
        sectors: sectorRes.status === 200 ? normalizeCatalog(sectorRes.body, "sectors") : [],
        equipmentTypes:
          equipmentTypeRes.status === 200 ? normalizeCatalog(equipmentTypeRes.body, "equipmentTypes") : [],
        manufacturers:
          manufacturerRes.status === 200 ? normalizeCatalog(manufacturerRes.body, "manufacturers") : [],
        costCenters:
          costCenterRes.status === 200 ? normalizeCatalog(costCenterRes.body, "costCenters") : [],
        safetyConditions:
          safetyConditionRes.status === 200
            ? normalizeCatalog(safetyConditionRes.body, "safetyConditions")
            : [],
        lubricationSystems:
          lubricationSystemRes.status === 200
            ? normalizeCatalog(lubricationSystemRes.body, "lubricationSystems")
            : [],
        mainComponents:
          mainComponentRes.status === 200
            ? normalizeCatalog(mainComponentRes.body, "mainComponents")
            : [],
        powerUnits:
          powerUnitRes.status === 200 ? normalizeCatalog(powerUnitRes.body, "powerUnits") : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar catálogos");
      setCatalogs(emptyCatalogs);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, isSuperAdmin, GetAPI]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  return { catalogs, loading, error, refetch: fetchCatalogs };
}
