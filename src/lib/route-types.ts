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
  executionTime?: { id: string; name: string; minutes?: number };
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
        equipment?: EquipmentInCipService;
      };
    };
  };
}

/** Equipamento aninhado em CIP (para listas e modal de detalhes) */
export interface EquipmentInCipService {
  id: string;
  name?: string | null;
  tag?: string;
  code?: string | null;
  sector?: { id: string; name: string; area?: { id: string; name: string } } | null;
  equipmentType?: { id: string; name: string } | null;
  manufacturer?: { id: string; name: string } | null;
  costCenter?: { id: string; name: string } | null;
  safetyCondition?: { id: string; name: string } | null;
  lubricationSystem?: { id: string; name: string } | null;
  mainComponent?: { id: string; name: string } | null;
  powerUnit?: { id: string; name: string } | null;
}

/**
 * Soma os minutos de execução de uma lista de serviços (ou itens rota-serviço).
 * Usado para exibir tempo total estimado de uma rota ou da seleção atual.
 */
export function totalExecutionMinutes(
  items: Array<{ cipService?: CipService } | CipService>
): number {
  return items.reduce((acc, item) => {
    const service: CipService | undefined =
      item && typeof item === "object" && "cipService" in item
        ? (item as { cipService?: CipService }).cipService
        : (item as CipService);
    const minutes = service?.executionTime?.minutes ?? 0;
    return acc + (Number.isFinite(minutes) ? minutes : 0);
  }, 0);
}

/** Formata minutos totais para exibição (ex.: "120 min" ou "2 h 30 min"). */
export function formatExecutionMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "—";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** Empresa com horários (resposta de GET /company/:companyId). */
export interface CompanySchedule {
  id: string;
  workDays: string | null;
  businessHoursStart: string | null;
  businessHoursEnd: string | null;
  lunchBreakStart: string | null;
  lunchBreakEnd: string | null;
  weeklyWorkHours?: number;
}

/** Agendamento de rota com início em data/hora (resposta de GET /route/company/:id/schedules). */
export interface RouteScheduleItem {
  id: string;
  routeId: string;
  scheduledStartAt: string;
  route?: { id: string; name: string; code: string; companyId: string };
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
  /** Filtros por equipamento (cip.subset.set.equipment) */
  sectorIds?: string[];
  equipmentTypeIds?: string[];
  manufacturerIds?: string[];
  costCenterIds?: string[];
  safetyConditionIds?: string[];
  lubricationSystemIds?: string[];
  mainComponentIds?: string[];
  powerUnitIds?: string[];
}
