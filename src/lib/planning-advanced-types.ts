// Tipos para o planejamento avançado

export type ScheduleType = "route" | "service";

export interface PlanningRoute {
  id: string;
  code: string;
  name: string;
  duration: number; // minutos
}

export interface PlanningService {
  id: string;
  name: string;
  equipmentName: string;
  duration: number; // minutos
  periodDays?: number; // periodicidade em dias
  lastExecutionDate?: string; // ISO date
}

export interface ScheduleItem {
  id: string;
  type: ScheduleType;
  routeId?: string;
  serviceId?: string;
  scheduledStartAt: string; // ISO datetime
  duration: number; // minutos
  route?: PlanningRoute;
  service?: PlanningService;
  /** IDs dos workers vinculados (definidos na etapa de planejamento) */
  assignedWorkerIds?: string[];
  assignedWorkers?: Array<{ id: string; name: string }>;
}

export interface WorkloadIndicator {
  date: string; // YYYY-MM-DD
  scheduledHours: number;
  availableHours: number;
  utilization: number; // 0-100
  status: "low" | "medium" | "high";
}

export interface CompanySchedule {
  workDays: number[]; // [0,1,2,3,4,5,6] (0=domingo)
  businessHoursStart: string; // "08:00"
  businessHoursEnd: string; // "18:00"
  lunchBreakStart?: string; // "12:00"
  lunchBreakEnd?: string; // "13:00"
}

export interface AutoGenerateOptions {
  startDate: string; // ISO date
  endDate: string; // ISO date
  serviceIds?: string[];
  routeIds?: string[];
}
