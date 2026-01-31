/**
 * Tipos alinhados à API de rotas e serviços (organização de rotas).
 * Ver docs/RELATORIO_ORGANIZACAO_DE_ROTAS.md e inova-api route.controller / filter-services.
 */

export type RouteStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export interface Route {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: RouteStatus;
  finishedAt?: string | null;
  isTemporary: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

/** Vínculo rota–serviço (RouteCipService); não é WorkOrder. */
export interface RouteCipServiceItem {
  id: string;
  routeId: string;
  cipServiceId: string;
  route?: {
    id: string;
    name: string;
    code: string;
    isTemporary?: boolean;
  };
  cipService?: CipService;
}

export interface CipService {
  id: string;
  cipId: string;
  serviceModelId?: string | null;
  periodId?: string | null;
  priorityId?: string | null;
  teamId?: string | null;
  serviceConditionId?: string | null;
  jobSystemId?: string | null;
  executionTimeId?: string | null;
  serviceModel?: { id: string; name: string; description?: string | null };
  period?: { id: string; name: string; days?: number | null };
  priority?: { id: string; name: string };
  team?: { id: string; name: string };
  serviceCondition?: { id: string; name: string };
  jobSystem?: { id: string; name: string };
  executionTime?: { id: string; name: string };
  cip?: {
    id: string;
    name: string;
    code: string;
    subset?: {
      id: string;
      name: string;
      set?: {
        id: string;
        name: string;
        equipment?: { id: string; name: string; code?: string };
      };
    };
  };
}

/** Payload para POST /filter-services */
export interface FilterServicesPayload {
  companyId?: string;
  periodIds?: string[];
  priorityIds?: string[];
  teamIds?: string[];
  serviceConditionIds?: string[];
  jobSystemIds?: string[];
  executionTimeIds?: string[];
  extraTeamIds?: string[];
  estimatedExtraTeamTimeIds?: string[];
  serviceModelIds?: string[];
  epiIds?: string[];
  toolkitIds?: string[];
}
