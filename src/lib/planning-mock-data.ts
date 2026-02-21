// Dados mock para o planejamento avançado

import type {
  PlanningRoute,
  PlanningService,
  ScheduleItem,
  WorkloadIndicator,
  CompanySchedule,
} from "./planning-advanced-types";

export const mockCompanySchedule: CompanySchedule = {
  workDays: [1, 2, 3, 4, 5], // Segunda a Sexta
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  lunchBreakStart: "12:00",
  lunchBreakEnd: "13:00",
};

export const mockWorkersCount = 3; // 3 colaboradores

export const mockRoutes: PlanningRoute[] = [
  {
    id: "route-1",
    code: "R001",
    name: "Rota Manutenção Preventiva Setor A",
    duration: 120, // 2 horas
  },
  {
    id: "route-2",
    code: "R002",
    name: "Rota Lubrificação Geral",
    duration: 90, // 1h30
  },
  {
    id: "route-3",
    code: "R003",
    name: "Rota Inspeção Equipamentos Críticos",
    duration: 180, // 3 horas
  },
  {
    id: "route-4",
    code: "R004",
    name: "Rota Manutenção Preventiva Setor B",
    duration: 150, // 2h30
  },
  {
    id: "route-5",
    code: "R005",
    name: "Rota Troca de Filtros",
    duration: 60, // 1 hora
  },
  {
    id: "route-6",
    code: "R006",
    name: "Rota Calibração de Instrumentos",
    duration: 240, // 4 horas
  },
  {
    id: "route-7",
    code: "R007",
    name: "Rota Inspeção de Segurança",
    duration: 90, // 1h30
  },
  {
    id: "route-8",
    code: "R008",
    name: "Rota Limpeza Geral de Equipamentos",
    duration: 120, // 2 horas
  },
  {
    id: "route-9",
    code: "R009",
    name: "Rota Verificação de Vibração",
    duration: 75, // 1h15
  },
  {
    id: "route-10",
    code: "R010",
    name: "Rota Manutenção Corretiva Urgente",
    duration: 300, // 5 horas
  },
  {
    id: "route-11",
    code: "R011",
    name: "Rota Inspeção de Vazamentos",
    duration: 90, // 1h30
  },
  {
    id: "route-12",
    code: "R012",
    name: "Rota Troca de Componentes",
    duration: 180, // 3 horas
  },
];

export const mockServices: PlanningService[] = [
  {
    id: "service-1",
    name: "Troca de Óleo",
    equipmentName: "Bomba Centrífuga B-101",
    duration: 60, // 1 hora
    periodDays: 90, // 3 meses
    lastExecutionDate: "2024-12-01",
  },
  {
    id: "service-2",
    name: "Limpeza de Filtros",
    equipmentName: "Compressor C-205",
    duration: 45, // 45 minutos
    periodDays: 30, // 1 mês
    lastExecutionDate: "2025-01-15",
  },
  {
    id: "service-3",
    name: "Verificação de Vibração",
    equipmentName: "Motor M-301",
    duration: 30, // 30 minutos
    periodDays: 15, // 15 dias
    lastExecutionDate: "2025-02-01",
  },
  {
    id: "service-4",
    name: "Calibração de Instrumentos",
    equipmentName: "Válvula V-401",
    duration: 90, // 1h30
    periodDays: 180, // 6 meses
    lastExecutionDate: "2024-11-10",
  },
  {
    id: "service-5",
    name: "Troca de Óleo",
    equipmentName: "Bomba Centrífuga B-102",
    duration: 60,
    periodDays: 90,
    lastExecutionDate: "2024-12-05",
  },
  {
    id: "service-6",
    name: "Inspeção de Vazamentos",
    equipmentName: "Tubulação T-501",
    duration: 45,
    periodDays: 30,
    lastExecutionDate: "2025-01-20",
  },
  {
    id: "service-7",
    name: "Troca de Filtro de Ar",
    equipmentName: "Compressor C-206",
    duration: 30,
    periodDays: 60,
    lastExecutionDate: "2025-01-10",
  },
  {
    id: "service-8",
    name: "Verificação de Temperatura",
    equipmentName: "Motor M-302",
    duration: 20,
    periodDays: 7,
    lastExecutionDate: "2025-02-10",
  },
  {
    id: "service-9",
    name: "Limpeza de Trocador de Calor",
    equipmentName: "Trocador TH-201",
    duration: 120,
    periodDays: 90,
    lastExecutionDate: "2024-11-15",
  },
  {
    id: "service-10",
    name: "Calibração de Pressão",
    equipmentName: "Válvula V-402",
    duration: 45,
    periodDays: 45,
    lastExecutionDate: "2025-01-05",
  },
  {
    id: "service-11",
    name: "Troca de Correia",
    equipmentName: "Motor M-303",
    duration: 90,
    periodDays: 180,
    lastExecutionDate: "2024-10-20",
  },
  {
    id: "service-12",
    name: "Inspeção de Segurança",
    equipmentName: "Tanque TK-101",
    duration: 60,
    periodDays: 30,
    lastExecutionDate: "2025-01-25",
  },
  {
    id: "service-13",
    name: "Verificação de Nível",
    equipmentName: "Reservatório R-201",
    duration: 15,
    periodDays: 7,
    lastExecutionDate: "2025-02-12",
  },
  {
    id: "service-14",
    name: "Troca de Óleo Hidráulico",
    equipmentName: "Cilindro Hidráulico CH-301",
    duration: 75,
    periodDays: 120,
    lastExecutionDate: "2024-11-30",
  },
  {
    id: "service-15",
    name: "Limpeza de Dutos",
    equipmentName: "Sistema de Ventilação SV-101",
    duration: 180,
    periodDays: 90,
    lastExecutionDate: "2024-12-10",
  },
  {
    id: "service-16",
    name: "Calibração de Vazão",
    equipmentName: "Bomba B-103",
    duration: 60,
    periodDays: 60,
    lastExecutionDate: "2025-01-12",
  },
  {
    id: "service-17",
    name: "Inspeção de Corrosão",
    equipmentName: "Estrutura E-201",
    duration: 90,
    periodDays: 180,
    lastExecutionDate: "2024-10-15",
  },
  {
    id: "service-18",
    name: "Troca de Sensor",
    equipmentName: "Sensor S-401",
    duration: 30,
    periodDays: 365,
    lastExecutionDate: "2024-02-15",
  },
];

// Agendamentos mock para a semana atual
const today = new Date();
const weekStart = new Date(today);
weekStart.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira
weekStart.setHours(0, 0, 0, 0);

function createSchedule(
  id: string,
  type: "route" | "service",
  dayOffset: number, // dias a partir de segunda (0 = segunda, 1 = terça, etc)
  hour: number,
  minute: number,
  routeIdOrServiceId: string,
  duration: number
): ScheduleItem {
  const scheduleDate = new Date(weekStart);
  scheduleDate.setDate(weekStart.getDate() + dayOffset);
  scheduleDate.setHours(hour, minute, 0, 0);
  
  if (type === "route") {
    const route = mockRoutes.find((r) => r.id === routeIdOrServiceId);
    return {
      id,
      type: "route",
      routeId: routeIdOrServiceId,
      scheduledStartAt: scheduleDate.toISOString(),
      duration,
      route,
    };
  } else {
    const service = mockServices.find((s) => s.id === routeIdOrServiceId);
    return {
      id,
      type: "service",
      serviceId: routeIdOrServiceId,
      scheduledStartAt: scheduleDate.toISOString(),
      duration,
      service,
    };
  }
}

export const mockSchedules: ScheduleItem[] = [
  // SEGUNDA-FEIRA - DIA MUITO CARREGADO! 🔴
  createSchedule("sched-1", "route", 0, 8, 0, "route-1", 120), // 08:00
  createSchedule("sched-2", "service", 0, 8, 0, "service-1", 60), // 08:00
  createSchedule("sched-3", "service", 0, 8, 0, "service-5", 60), // 08:00 - 3 simultâneos!
  createSchedule("sched-4", "service", 0, 8, 0, "service-8", 20), // 08:00 - 4 simultâneos!
  createSchedule("sched-5", "route", 0, 8, 30, "route-4", 150), // 08:30
  createSchedule("sched-6", "service", 0, 8, 30, "service-13", 15), // 08:30
  createSchedule("sched-7", "service", 0, 9, 0, "service-2", 45), // 09:00
  createSchedule("sched-8", "service", 0, 9, 0, "service-7", 30), // 09:00
  createSchedule("sched-9", "service", 0, 9, 0, "service-3", 30), // 09:00 - 3 simultâneos
  createSchedule("sched-10", "route", 0, 9, 30, "route-5", 60), // 09:30
  createSchedule("sched-11", "service", 0, 10, 0, "service-6", 45), // 10:00
  createSchedule("sched-12", "service", 0, 10, 0, "service-10", 45), // 10:00
  createSchedule("sched-13", "service", 0, 10, 0, "service-16", 60), // 10:00 - 3 simultâneos
  createSchedule("sched-14", "route", 0, 10, 30, "route-8", 120), // 10:30
  createSchedule("sched-15", "service", 0, 11, 0, "service-9", 120), // 11:00
  createSchedule("sched-16", "service", 0, 11, 0, "service-14", 75), // 11:00 - 2 simultâneos
  createSchedule("sched-17", "route", 0, 13, 0, "route-7", 90), // 13:00
  createSchedule("sched-18", "service", 0, 13, 0, "service-12", 60), // 13:00
  createSchedule("sched-19", "service", 0, 13, 0, "service-6", 45), // 13:00
  createSchedule("sched-20", "service", 0, 13, 0, "service-2", 45), // 13:00 - 4 simultâneos!
  createSchedule("sched-21", "route", 0, 13, 30, "route-9", 75), // 13:30
  createSchedule("sched-22", "service", 0, 14, 0, "service-3", 30), // 14:00
  createSchedule("sched-23", "service", 0, 14, 0, "service-8", 20), // 14:00
  createSchedule("sched-24", "service", 0, 14, 0, "service-13", 15), // 14:00 - 3 simultâneos
  createSchedule("sched-25", "route", 0, 14, 30, "route-11", 90), // 14:30
  createSchedule("sched-26", "service", 0, 15, 0, "service-15", 180), // 15:00 - 3h!
  createSchedule("sched-27", "service", 0, 15, 0, "service-17", 90), // 15:00 - 2 simultâneos
  createSchedule("sched-28", "route", 0, 15, 30, "route-12", 180), // 15:30 - 3h!
  createSchedule("sched-29", "service", 0, 16, 0, "service-10", 45), // 16:00
  createSchedule("sched-30", "service", 0, 16, 0, "service-16", 60), // 16:00 - 2 simultâneos
  createSchedule("sched-31", "route", 0, 16, 30, "route-2", 90), // 16:30
  
  // TERÇA-FEIRA - Dia normal
  createSchedule("sched-32", "route", 1, 8, 0, "route-2", 90), // 08:00
  createSchedule("sched-33", "service", 1, 8, 0, "service-5", 60), // 08:00
  createSchedule("sched-34", "service", 1, 9, 0, "service-8", 20), // 09:00
  createSchedule("sched-35", "route", 1, 10, 0, "route-4", 150), // 10:00
  createSchedule("sched-36", "service", 1, 10, 30, "service-16", 60), // 10:30
  createSchedule("sched-37", "service", 1, 13, 0, "service-2", 45), // 13:00
  createSchedule("sched-38", "service", 1, 13, 0, "service-7", 30), // 13:00
  createSchedule("sched-39", "route", 1, 14, 0, "route-9", 75), // 14:00
  createSchedule("sched-40", "service", 1, 14, 0, "service-3", 30), // 14:00
  createSchedule("sched-41", "service", 1, 15, 30, "service-13", 15), // 15:30
  createSchedule("sched-42", "route", 1, 16, 0, "route-11", 90), // 16:00
  
  // QUARTA-FEIRA - DIA EXTREMAMENTE CARREGADO! 🔴🔴
  createSchedule("sched-43", "route", 2, 8, 0, "route-3", 180), // 08:00 - 3h
  createSchedule("sched-44", "service", 2, 8, 0, "service-9", 120), // 08:00 - 2h
  createSchedule("sched-45", "service", 2, 8, 0, "service-14", 75), // 08:00
  createSchedule("sched-46", "service", 2, 8, 0, "service-1", 60), // 08:00 - 4 simultâneos!
  createSchedule("sched-47", "route", 2, 8, 30, "route-10", 300), // 08:30 - 5h!
  createSchedule("sched-48", "service", 2, 9, 0, "service-5", 60), // 09:00
  createSchedule("sched-49", "service", 2, 9, 0, "service-11", 90), // 09:00 - 2 simultâneos
  createSchedule("sched-50", "route", 2, 9, 30, "route-6", 240), // 09:30 - 4h!
  createSchedule("sched-51", "service", 2, 10, 0, "service-1", 60), // 10:00
  createSchedule("sched-52", "service", 2, 10, 0, "service-2", 45), // 10:00
  createSchedule("sched-53", "service", 2, 10, 0, "service-7", 30), // 10:00
  createSchedule("sched-54", "service", 2, 10, 0, "service-3", 30), // 10:00 - 4 simultâneos!
  createSchedule("sched-55", "route", 2, 10, 30, "route-8", 120), // 10:30
  createSchedule("sched-56", "service", 2, 11, 0, "service-8", 20), // 11:00
  createSchedule("sched-57", "service", 2, 11, 0, "service-13", 15), // 11:00
  createSchedule("sched-58", "service", 2, 11, 0, "service-6", 45), // 11:00 - 3 simultâneos
  createSchedule("sched-59", "route", 2, 13, 0, "route-6", 240), // 13:00 - 4h!
  createSchedule("sched-60", "service", 2, 13, 0, "service-4", 90), // 13:00
  createSchedule("sched-61", "service", 2, 13, 0, "service-12", 60), // 13:00
  createSchedule("sched-62", "service", 2, 13, 0, "service-6", 45), // 13:00
  createSchedule("sched-63", "service", 2, 13, 0, "service-10", 45), // 13:00 - 5 simultâneos!!!
  createSchedule("sched-64", "route", 2, 13, 30, "route-1", 120), // 13:30
  createSchedule("sched-65", "service", 2, 14, 0, "service-15", 180), // 14:00 - 3h!
  createSchedule("sched-66", "service", 2, 14, 0, "service-17", 90), // 14:00 - 2 simultâneos
  createSchedule("sched-67", "route", 2, 14, 30, "route-4", 150), // 14:30
  createSchedule("sched-68", "service", 2, 15, 0, "service-6", 45), // 15:00
  createSchedule("sched-69", "service", 2, 15, 0, "service-16", 60), // 15:00
  createSchedule("sched-70", "service", 2, 15, 0, "service-10", 45), // 15:00 - 3 simultâneos
  createSchedule("sched-71", "route", 2, 15, 30, "route-12", 180), // 15:30 - 3h!
  createSchedule("sched-72", "service", 2, 16, 0, "service-10", 45), // 16:00
  createSchedule("sched-73", "service", 2, 16, 0, "service-18", 30), // 16:00 - 2 simultâneos
  createSchedule("sched-74", "route", 2, 16, 30, "route-2", 90), // 16:30
  
  // QUINTA-FEIRA - Dia carregado
  createSchedule("sched-75", "route", 3, 8, 0, "route-1", 120), // 08:00
  createSchedule("sched-76", "service", 3, 8, 0, "service-5", 60), // 08:00
  createSchedule("sched-77", "service", 3, 8, 0, "service-1", 60), // 08:00 - 3 simultâneos
  createSchedule("sched-78", "service", 3, 9, 30, "service-13", 15), // 09:30
  createSchedule("sched-79", "route", 3, 10, 0, "route-12", 180), // 10:00
  createSchedule("sched-80", "service", 3, 10, 0, "service-11", 90), // 10:00
  createSchedule("sched-81", "service", 3, 10, 0, "service-14", 75), // 10:00 - 3 simultâneos
  createSchedule("sched-82", "service", 3, 11, 0, "service-9", 120), // 11:00
  createSchedule("sched-83", "service", 3, 13, 0, "service-2", 45), // 13:00
  createSchedule("sched-84", "service", 3, 13, 0, "service-7", 30), // 13:00
  createSchedule("sched-85", "service", 3, 13, 0, "service-3", 30), // 13:00
  createSchedule("sched-86", "service", 3, 13, 0, "service-8", 20), // 13:00 - 4 simultâneos!
  createSchedule("sched-87", "route", 3, 14, 0, "route-8", 120), // 14:00
  createSchedule("sched-88", "service", 3, 15, 0, "service-15", 180), // 15:00 - 3h!
  createSchedule("sched-89", "service", 3, 15, 0, "service-17", 90), // 15:00 - 2 simultâneos
  createSchedule("sched-90", "service", 3, 16, 0, "service-10", 45), // 16:00
  createSchedule("sched-91", "service", 3, 16, 0, "service-16", 60), // 16:00 - 2 simultâneos
  
  // SEXTA-FEIRA - Dia carregado
  createSchedule("sched-92", "route", 4, 8, 0, "route-2", 90), // 08:00
  createSchedule("sched-93", "service", 4, 8, 0, "service-1", 60), // 08:00
  createSchedule("sched-94", "service", 4, 8, 0, "service-5", 60), // 08:00 - 3 simultâneos
  createSchedule("sched-95", "service", 4, 8, 30, "service-8", 20), // 08:30
  createSchedule("sched-96", "route", 4, 9, 0, "route-5", 60), // 09:00
  createSchedule("sched-97", "service", 4, 9, 0, "service-2", 45), // 09:00
  createSchedule("sched-98", "service", 4, 9, 0, "service-7", 30), // 09:00 - 3 simultâneos
  createSchedule("sched-99", "service", 4, 10, 0, "service-9", 120), // 10:00
  createSchedule("sched-100", "service", 4, 10, 0, "service-14", 75), // 10:00
  createSchedule("sched-101", "service", 4, 10, 0, "service-11", 90), // 10:00 - 3 simultâneos
  createSchedule("sched-102", "route", 4, 11, 0, "route-6", 240), // 11:00 - 4h!
  createSchedule("sched-103", "route", 4, 13, 0, "route-7", 90), // 13:00
  createSchedule("sched-104", "service", 4, 13, 0, "service-12", 60), // 13:00
  createSchedule("sched-105", "service", 4, 13, 0, "service-6", 45), // 13:00
  createSchedule("sched-106", "service", 4, 13, 0, "service-10", 45), // 13:00 - 4 simultâneos!
  createSchedule("sched-107", "route", 4, 14, 0, "route-4", 150), // 14:00
  createSchedule("sched-108", "service", 4, 15, 0, "service-16", 60), // 15:00
  createSchedule("sched-109", "service", 4, 15, 0, "service-17", 90), // 15:00 - 2 simultâneos
  createSchedule("sched-110", "service", 4, 16, 0, "service-18", 30), // 16:00
];

// Função para calcular horas agendadas de um dia baseado nos schedules
function calculateScheduledHoursForDay(dateKey: string, schedulesList: ScheduleItem[]): number {
  const date = new Date(dateKey + "T00:00:00");
  const dayOfWeek = date.getDay();
  
  // Se não for dia útil, retorna 0
  if (!mockCompanySchedule.workDays.includes(dayOfWeek)) {
    return 0;
  }
  
  // Calcular total de minutos agendados neste dia
  let totalMinutes = 0;
  
  for (const schedule of schedulesList) {
    const scheduleDate = new Date(schedule.scheduledStartAt);
    // Converter para fuso Brasil (UTC-3) para comparação correta
    const scheduleDateKey = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, "0")}-${String(scheduleDate.getDate()).padStart(2, "0")}`;
    
    if (scheduleDateKey === dateKey) {
      totalMinutes += schedule.duration;
    }
  }
  
  // Converter minutos para horas
  return totalMinutes / 60;
}

// Função para gerar indicadores de carga mock para um mês
export function generateMockWorkloadIndicators(
  year: number,
  month: number,
  schedules?: ScheduleItem[] // Schedules dinâmicos (incluindo gerados)
): WorkloadIndicator[] {
  const indicators: WorkloadIndicator[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const workDays = mockCompanySchedule.workDays;
  
  // Calcular horas disponíveis por dia
  const startHour = parseInt(mockCompanySchedule.businessHoursStart.split(":")[0]);
  const endHour = parseInt(mockCompanySchedule.businessHoursEnd.split(":")[0]);
  const lunchStart = mockCompanySchedule.lunchBreakStart
    ? parseInt(mockCompanySchedule.lunchBreakStart.split(":")[0])
    : null;
  const lunchEnd = mockCompanySchedule.lunchBreakEnd
    ? parseInt(mockCompanySchedule.lunchBreakEnd.split(":")[0])
    : null;
  
  let hoursPerDay = endHour - startHour;
  if (lunchStart && lunchEnd) {
    hoursPerDay -= lunchEnd - lunchStart;
  }
  
  // Horas disponíveis = horas úteis * número de workers
  const availableHoursPerDay = hoursPerDay * mockWorkersCount;
  
  // Padrões de carga mais realistas - com mais dias sobrecarregados
  const loadPatterns = [
    { min: 2, max: 5, weight: 0.2 }, // Baixa carga (20% dos dias)
    { min: 5, max: 7.5, weight: 0.35 }, // Média-baixa carga (35% dos dias)
    { min: 7.5, max: 9, weight: 0.25 }, // Média-alta carga (25% dos dias)
    { min: 9, max: 9.7, weight: 0.15 }, // Alta carga (15% dos dias)
    { min: 9.7, max: 10, weight: 0.05 }, // Sobrecarga extrema (5% dos dias)
  ];
  
  // Usar schedules passados ou fallback para mockSchedules
  const schedulesToUse = schedules || mockSchedules;
  
  // Obter a semana atual para calcular baseado nos schedules mock
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira
  currentWeekStart.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isWorkDay = workDays.includes(dayOfWeek);
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    if (!isWorkDay) {
      indicators.push({
        date: dateKey,
        scheduledHours: 0,
        availableHours: 0,
        utilization: 0,
        status: "low",
      });
      continue;
    }
    
    // Calcular baseado nos schedules (mock iniciais ou gerados dinamicamente)
    let scheduledHours = calculateScheduledHoursForDay(dateKey, schedulesToUse);
    
    // Se não houver schedules mock para este dia (fora da semana atual), usar padrões baseados no dia da semana
    // Mas sempre usar valores altos para mostrar dias carregados
    if (scheduledHours === 0 || scheduledHours < 1) {
      // Calcular valores baseados no dia da semana, sempre altos para demonstrar carga
      if (dayOfWeek === 1) {
        // Segunda-feira - muito carregada (20-25h de 27h disponíveis = 74-93%)
        scheduledHours = 20 + Math.random() * 5;
      } else if (dayOfWeek === 3) {
        // Quarta-feira - extremamente carregada (24-26.5h de 27h = 89-98%)
        scheduledHours = 24 + Math.random() * 2.5;
      } else if (dayOfWeek === 4) {
        // Quinta-feira - carregada (18-23h de 27h = 67-85%)
        scheduledHours = 18 + Math.random() * 5;
      } else if (dayOfWeek === 5) {
        // Sexta-feira - carregada (15-21h de 27h = 56-78%)
        scheduledHours = 15 + Math.random() * 6;
      } else {
        // Terça-feira - normal mas ainda com carga (12-20h de 27h = 44-74%)
        scheduledHours = 12 + Math.random() * 8;
      }
    } else {
      // Se já tem schedules, garantir que está em horas totais (não por worker)
      // Os schedules já estão somando corretamente, mas vamos garantir valores mínimos altos
      if (scheduledHours < 15 && dayOfWeek === 1) {
        scheduledHours = 20 + Math.random() * 3; // Segunda sempre carregada
      } else if (scheduledHours < 20 && dayOfWeek === 3) {
        scheduledHours = 24 + Math.random() * 2; // Quarta sempre muito carregada
      }
    }
    
    // Garantir que não ultrapasse o limite
    scheduledHours = Math.min(scheduledHours, availableHoursPerDay * 0.99);
    const utilization = (scheduledHours / availableHoursPerDay) * 100;
    
    let status: "low" | "medium" | "high";
    if (utilization < 80) {
      status = "low";
    } else if (utilization < 95) {
      status = "medium";
    } else {
      status = "high";
    }
    
    indicators.push({
      date: dateKey,
      scheduledHours: Math.round(scheduledHours * 10) / 10,
      availableHours: availableHoursPerDay,
      utilization: Math.round(utilization * 10) / 10,
      status,
    });
  }
  
  return indicators;
}
