import { useApiContext } from '@/context/ApiContext';
import type {
  ServiceScheduleItem,
  PlanningScheduleItem,
  RouteScheduleItem,
  WorkloadIndicator,
} from './route-types';

interface CreateServiceScheduleData {
  cipServiceId: string;
  scheduledStartAt: string;
  companyId?: string;
}

interface UpdateServiceScheduleData {
  scheduledStartAt: string;
}

interface AutoGeneratePlanningOptions {
  startDate: string;
  endDate: string;
  serviceIds?: string[];
  routeIds?: string[];
  companyId?: string;
}

/**
 * Busca todos os agendamentos (rotas + serviços) de uma empresa.
 */
export async function fetchSchedules(
  companyId: string,
  apiContext: ReturnType<typeof useApiContext>
): Promise<{ routeSchedules: RouteScheduleItem[]; serviceSchedules: ServiceScheduleItem[] }> {
  const res = await apiContext.GetAPI(`/planning/schedules/${companyId}`, true);
  if (res.status === 200 && res.body) {
    return {
      routeSchedules: (res.body.routeSchedules || []) as RouteScheduleItem[],
      serviceSchedules: (res.body.serviceSchedules || []) as ServiceScheduleItem[],
    };
  }
  throw new Error('Erro ao buscar agendamentos');
}

/**
 * Cria um agendamento de serviço.
 */
export async function createServiceSchedule(
  data: CreateServiceScheduleData,
  apiContext: ReturnType<typeof useApiContext>
): Promise<{ serviceSchedule: ServiceScheduleItem }> {
  const res = await apiContext.PostAPI('/planning/service-schedule', data, true);
  if (res.status === 201 && res.body?.serviceSchedule) {
    return { serviceSchedule: res.body.serviceSchedule as ServiceScheduleItem };
  }
  throw new Error('Erro ao criar agendamento de serviço');
}

/**
 * Atualiza um agendamento de serviço.
 */
export async function updateServiceSchedule(
  scheduleId: string,
  data: UpdateServiceScheduleData,
  companyId: string,
  apiContext: ReturnType<typeof useApiContext>
): Promise<{ serviceSchedule: ServiceScheduleItem }> {
  const res = await apiContext.PutAPI(
    `/planning/service-schedule/${scheduleId}?companyId=${companyId}`,
    data,
    true
  );
  if (res.status === 200 && res.body?.serviceSchedule) {
    return { serviceSchedule: res.body.serviceSchedule as ServiceScheduleItem };
  }
  throw new Error('Erro ao atualizar agendamento de serviço');
}

/**
 * Remove um agendamento de serviço.
 */
export async function deleteServiceSchedule(
  scheduleId: string,
  companyId: string,
  apiContext: ReturnType<typeof useApiContext>
): Promise<void> {
  const res = await apiContext.DeleteAPI(
    `/planning/service-schedule/${scheduleId}?companyId=${companyId}`,
    true
  );
  if (res.status !== 200) {
    throw new Error('Erro ao remover agendamento de serviço');
  }
}

/**
 * Gera planejamento automático.
 */
export async function autoGeneratePlanning(
  options: AutoGeneratePlanningOptions,
  apiContext: ReturnType<typeof useApiContext>
): Promise<{ created: number; schedules: Array<{ id: string; type: 'service' | 'route'; scheduledStartAt: string }> }> {
  const res = await apiContext.PostAPI('/planning/auto-generate', options, true);
  if (res.status === 201 && res.body) {
    return res.body as { created: number; schedules: Array<{ id: string; type: 'service' | 'route'; scheduledStartAt: string }> };
  }
  throw new Error('Erro ao gerar planejamento automático');
}

/**
 * Busca indicadores de carga para um mês.
 */
export async function fetchWorkload(
  companyId: string,
  year: number,
  month: number,
  apiContext: ReturnType<typeof useApiContext>
): Promise<{ indicators: WorkloadIndicator[] }> {
  const res = await apiContext.GetAPI(`/planning/workload/${companyId}/${year}/${month}`, true);
  if (res.status === 200 && res.body?.indicators) {
    return { indicators: res.body.indicators as WorkloadIndicator[] };
  }
  throw new Error('Erro ao buscar indicadores de carga');
}

/**
 * Converte agendamentos de rotas e serviços em um array unificado com tipo.
 */
export function combineSchedules(
  routeSchedules: RouteScheduleItem[],
  serviceSchedules: ServiceScheduleItem[]
): PlanningScheduleItem[] {
  const combined: PlanningScheduleItem[] = [];

  for (const schedule of routeSchedules) {
    combined.push({ ...schedule, type: 'route' });
  }

  for (const schedule of serviceSchedules) {
    combined.push({ ...schedule, type: 'service' });
  }

  return combined;
}

/**
 * Calcula a duração de um agendamento em minutos.
 */
export function getScheduleDuration(schedule: PlanningScheduleItem): number {
  if (schedule.type === 'route') {
    // Para rotas, precisamos somar os tempos de execução dos serviços
    // Por enquanto, retornamos um valor padrão
    // TODO: Buscar RouteCipService e somar executionTime
    return 120; // 2 horas padrão
  } else {
    // Para serviços, usar executionTime do cipService
    return schedule.cipService?.executionTime?.minutes || 60; // 1 hora padrão
  }
}
