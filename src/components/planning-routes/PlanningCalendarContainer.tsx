"use client";

import { AddScheduleModal } from "@/components/planning-advanced/AddScheduleModal";
import { AdvancedAnnualView } from "@/components/planning-advanced/AdvancedAnnualView";
import { AdvancedDayView } from "@/components/planning-advanced/AdvancedDayView";
import { AdvancedMonthlyCalendar } from "@/components/planning-advanced/AdvancedMonthlyCalendar";
import { AssignWorkersModal } from "@/components/planning-advanced/AssignWorkersModal";
import { AutoGenerateModal } from "@/components/planning-advanced/AutoGenerateModal";
import { ImprovedWeekView } from "@/components/planning-advanced/ImprovedWeekView";
import { PlanningToolbar, type PlanningView } from "@/components/planning-advanced/PlanningToolbar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type { ScheduleItem } from "@/lib/planning-advanced-types";
import {
    autoGeneratePlanning,
    combineSchedules,
    createServiceSchedule,
    deleteServiceSchedule,
    fetchSchedules,
    fetchWorkload,
    updateServiceSchedule
} from "@/lib/planning-api";
import type {
    CipService,
    CompanySchedule,
    Route,
    RouteCipServiceItem,
    RouteScheduleItem,
    ServiceScheduleItem,
    WorkloadIndicator
} from "@/lib/route-types";
import { addDays, addMonths, addWeeks, addYears, startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { ChevronDown, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface PlanningCalendarContainerProps {
  // Props podem ser vazias, tudo vem do contexto
}

export function PlanningCalendarContainer({}: PlanningCalendarContainerProps) {
  const apiContext = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();

  const [viewMode, setViewMode] = useState<PlanningView>("week");
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [routeSchedules, setRouteSchedules] = useState<RouteScheduleItem[]>([]);
  const [serviceSchedules, setServiceSchedules] = useState<ServiceScheduleItem[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [services, setServices] = useState<CipService[]>([]);
  const [routeCipServices, setRouteCipServices] = useState<RouteCipServiceItem[]>([]);
  const [companySchedule, setCompanySchedule] = useState<CompanySchedule | null>(null);
  const [workloadIndicators, setWorkloadIndicators] = useState<WorkloadIndicator[]>([]);
  const [yearWorkloadSummaries, setYearWorkloadSummaries] = useState<
    Array<{
      scheduledHours: number;
      availableHours: number;
      utilization: number;
      status: "low" | "medium" | "high";
    }> | null
  >(null);
  const [loadingYearWorkload, setLoadingYearWorkload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [addDefaultDateKey, setAddDefaultDateKey] = useState<string | undefined>();
  const [addDefaultSlotMin, setAddDefaultSlotMin] = useState<number | undefined>();
  const [addDefaultType, setAddDefaultType] = useState<"route" | "service">("route");
  const [scheduleForAssignWorkers, setScheduleForAssignWorkers] = useState<ScheduleItem | null>(null);
  /** Lanes preferidas por scheduleId (preserva coluna ao mover na visão de dia) */
  const [scheduleLanes, setScheduleLanes] = useState<Record<string, number>>({});

  // Combinar agendamentos
  const schedules = useMemo(
    () => combineSchedules(routeSchedules, serviceSchedules),
    [routeSchedules, serviceSchedules]
  );

  // Buscar dados iniciais
  const fetchData = useCallback(async () => {
    if (!effectiveCompanyId) {
      setRouteSchedules([]);
      setServiceSchedules([]);
      setRoutes([]);
      setServices([]);
      setRouteCipServices([]);
      setCompanySchedule(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [schedulesResult, companyRes, routesRes, servicesRes, routeServicesRes] = await Promise.all([
        fetchSchedules(effectiveCompanyId, apiContext),
        apiContext.GetAPI(`/company/${effectiveCompanyId}`, true),
        apiContext.GetAPI(isSuperAdmin ? `/route?companyId=${effectiveCompanyId}` : "/route", true),
        apiContext.PostAPI(`/filter-services`, { companyId: effectiveCompanyId }, true),
        apiContext.GetAPI(`/route/company/${effectiveCompanyId}/route-services`, true),
      ]);

      console.log("schedulesResult", schedulesResult);
      console.log("companyRes", companyRes);
      console.log("routesRes", routesRes);
      console.log("servicesRes", servicesRes);

      setRouteSchedules(schedulesResult.routeSchedules);
      setServiceSchedules(schedulesResult.serviceSchedules);

      if (companyRes.status === 200 && companyRes.body) {
        setCompanySchedule(companyRes.body as CompanySchedule);
      }

      if (routesRes.status === 200 && routesRes.body?.routes) {
        setRoutes((routesRes.body.routes as Route[]).filter((r) => !r.isTemporary));
      }

      if (servicesRes.status === 200 && servicesRes.body?.cipServices) {
        setServices(servicesRes.body.cipServices as CipService[]);
      }
      if (routeServicesRes.status === 200 && routeServicesRes.body?.routeCipServices) {
        setRouteCipServices(routeServicesRes.body.routeCipServices as RouteCipServiceItem[]);
      }

      // Buscar indicadores de carga para o mês atual
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      try {
        const workloadResult = await fetchWorkload(effectiveCompanyId, year, month, apiContext);
        setWorkloadIndicators(workloadResult.indicators);
      } catch (error) {
        console.error("Erro ao buscar indicadores de carga:", error);
        setWorkloadIndicators([]);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, isSuperAdmin, apiContext, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Atualizar indicadores quando mês muda
  useEffect(() => {
    if (!effectiveCompanyId || viewMode !== "month") return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    fetchWorkload(effectiveCompanyId, year, month, apiContext)
      .then((result) => setWorkloadIndicators(result.indicators))
      .catch((error) => {
        console.error("Erro ao buscar indicadores de carga:", error);
        setWorkloadIndicators([]);
      });
  }, [effectiveCompanyId, currentDate, viewMode, apiContext]);

  // Buscar indicadores do ano inteiro quando na visão anual
  useEffect(() => {
    if (!effectiveCompanyId || viewMode !== "year") {
      setYearWorkloadSummaries(null);
      return;
    }
    const year = currentDate.getFullYear();
    setLoadingYearWorkload(true);
    Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) =>
        fetchWorkload(effectiveCompanyId, year, month, apiContext)
      )
    )
      .then((results) => {
        const summaries = results.map((r) => {
          const indicators = r.indicators;
          const scheduledHours = indicators.reduce((s, i) => s + i.scheduledHours, 0);
          const availableHours = indicators.reduce((s, i) => s + i.availableHours, 0);
          const utilization =
            indicators.length > 0
              ? indicators.reduce((s, i) => s + i.utilization, 0) / indicators.length
              : 0;
          const status: "low" | "medium" | "high" =
            utilization > 95 ? "high" : utilization >= 80 ? "medium" : "low";
          return { scheduledHours, availableHours, utilization, status };
        });
        setYearWorkloadSummaries(summaries);
      })
      .catch((error) => {
        console.error("Erro ao buscar carga do ano:", error);
        setYearWorkloadSummaries(null);
      })
      .finally(() => setLoadingYearWorkload(false));
  }, [effectiveCompanyId, currentDate, viewMode, apiContext]);

  // Contagem de agendamentos (rotas e serviços) por mês do ano exibido
  const scheduleCountsByMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const counts = Array.from({ length: 12 }, () => ({ routeCount: 0, serviceCount: 0 }));
    for (const s of schedules) {
      const dateStr = s.type === "route" ? s.scheduledStartAt : s.scheduledStartAt;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
      const monthIndex = d.getMonth();
      if (s.type === "route") counts[monthIndex].routeCount += 1;
      else counts[monthIndex].serviceCount += 1;
    }
    return counts;
  }, [schedules, currentDate]);

  // Resumo por mês para a visão anual (workload + contagens). Meses sem planejamento (0 rotas e 0 serviços) ficam null → azul na visão.
  const monthlySummariesForYear = useMemo(() => {
    if (!yearWorkloadSummaries || yearWorkloadSummaries.length !== 12) return null;
    return yearWorkloadSummaries.map((w, i) => {
      const routeCount = scheduleCountsByMonth[i].routeCount;
      const serviceCount = scheduleCountsByMonth[i].serviceCount;
      const hasNoPlanning = routeCount === 0 && serviceCount === 0;
      if (hasNoPlanning) return null;
      return {
        ...w,
        routeCount,
        serviceCount,
      };
    });
  }, [yearWorkloadSummaries, scheduleCountsByMonth]);

  // Navegação entre datas
  const handleNavigate = useCallback((action: "prev" | "next" | "today") => {
    if (action === "today") {
      setCurrentDate(startOfDay(new Date()));
      return;
    }

    if (viewMode === "year") {
      setCurrentDate(action === "prev" ? subYears(currentDate, 1) : addYears(currentDate, 1));
    } else if (viewMode === "month") {
      setCurrentDate(action === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(action === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(action === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  }, [viewMode, currentDate]);

  const handleViewChange = useCallback((newView: PlanningView) => {
    if (newView === "day") {
      setCurrentDate(startOfDay(currentDate));
    }
    setViewMode(newView);
  }, [currentDate]);

  // Duração por rota (vinda dos agendamentos da API: durationMinutes)
  const routeDurationByRouteId = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of routeSchedules) {
      const dur = (s as { durationMinutes?: number }).durationMinutes;
      if (dur != null && !map.has(s.routeId)) map.set(s.routeId, dur);
    }
    return map;
  }, [routeSchedules]);

  // Converter rotas e serviços para o formato esperado pelos componentes
  const planningRoutes = useMemo(() => {
    return routes.map((route) => ({
      id: route.id,
      code: route.code,
      name: route.name,
      duration: routeDurationByRouteId.get(route.id) ?? 120,
    }));
  }, [routes, routeDurationByRouteId]);

  const planningServices = useMemo(() => {
    return services.map((service) => ({
      id: service.id,
      name: service.serviceModel?.name || "Serviço",
      equipmentName:
        service.cip?.subset?.set?.equipment?.name ||
        service.cip?.subset?.set?.equipment?.tag ||
        "Equipamento",
      duration: service.executionTime?.minutes || 60,
      periodDays: service.period?.days || undefined,
      lastExecutionDate: undefined, // TODO: Buscar da WorkOrder
    }));
  }, [services]);

  // Converter agendamentos para o formato esperado (inclui assignedWorkerIds do planejamento)
  const scheduleItems = useMemo(() => {
    return schedules.map((schedule) => {
      const raw = schedule as { assignedWorkerIds?: string[]; assignedWorkers?: Array<{ id: string; name: string }> };
      const base = {
        assignedWorkerIds: raw.assignedWorkerIds ?? [],
        assignedWorkers: raw.assignedWorkers ?? [],
      };
      if (schedule.type === "route") {
        const route = routes.find((r) => r.id === schedule.routeId);
        const duration = schedule.durationMinutes ?? 120;
        return {
          id: schedule.id,
          type: "route" as const,
          routeId: schedule.routeId,
          scheduledStartAt: schedule.scheduledStartAt,
          duration,
          ...base,
          route: route
            ? {
                id: route.id,
                code: route.code,
                name: route.name,
                duration,
              }
            : undefined,
        };
      } else {
        const service = services.find((s) => s.id === schedule.cipServiceId);
        return {
          id: schedule.id,
          type: "service" as const,
          serviceId: schedule.cipServiceId,
          scheduledStartAt: schedule.scheduledStartAt,
          duration: schedule.cipService?.executionTime?.minutes || 60,
          ...base,
          service: service
            ? {
                id: service.id,
                name: service.serviceModel?.name || "Serviço",
                equipmentName:
                  service.cip?.subset?.set?.equipment?.name ||
                  service.cip?.subset?.set?.equipment?.tag ||
                  "Equipamento",
                duration: service.executionTime?.minutes || 60,
                periodDays: service.period?.days || undefined,
              }
            : undefined,
        };
      }
    });
  }, [schedules, routes, services]);

  const { eligibleWorkerRoleIdsForAssign, eligibleWorkerRoleNamesForAssign } = useMemo(() => {
    const roleIds = new Set<string>();
    const roleNamesById = new Map<string, string>();
    const addRole = (id: string, name: string) => {
      if (!id) return;
      roleIds.add(id);
      if (name) roleNamesById.set(id, name);
    };
    if (!scheduleForAssignWorkers) {
      return { eligibleWorkerRoleIdsForAssign: [], eligibleWorkerRoleNamesForAssign: [] };
    }
    if (scheduleForAssignWorkers.type === "route" && scheduleForAssignWorkers.routeId) {
      const items = routeCipServices.filter((rcs) => rcs.routeId === scheduleForAssignWorkers.routeId);
      for (const rcs of items) {
        const cip = rcs.cipService ?? services.find((s) => s.id === rcs.cipServiceId);
        cip?.team?.teamWorkerRoles?.forEach((twr) => {
          const id = twr.workerRole?.id ?? (twr as { workerRoleId?: string }).workerRoleId;
          const name = twr.workerRole?.name ?? (twr as { workerRole?: { name?: string } }).workerRole?.name;
          addRole(id, name ?? "");
        });
      }
    } else if (scheduleForAssignWorkers.type === "service" && scheduleForAssignWorkers.serviceId) {
      const cip = services.find((s) => s.id === scheduleForAssignWorkers.serviceId);
      cip?.team?.teamWorkerRoles?.forEach((twr) => {
        const id = twr.workerRole?.id ?? (twr as { workerRoleId?: string }).workerRoleId;
        const name = twr.workerRole?.name ?? (twr as { workerRole?: { name?: string } }).workerRole?.name;
        addRole(id, name ?? "");
      });
    }
    const ids = Array.from(roleIds);
    const names = ids.map((id) => roleNamesById.get(id)).filter((n): n is string => Boolean(n?.trim()));
    return { eligibleWorkerRoleIdsForAssign: ids, eligibleWorkerRoleNamesForAssign: names };
  }, [scheduleForAssignWorkers, routeCipServices, services]);

  // Handlers
  const handleAddScheduleClick = useCallback(
    (type: "route" | "service", dateKey: string, slotMin: number) => {
      setAddDefaultType(type);
      setAddDefaultDateKey(dateKey);
      setAddDefaultSlotMin(slotMin);
      setShowAddModal(true);
    },
    []
  );

  const handleAddSchedule = useCallback(
    async (type: "route" | "service", routeIdOrServiceId: string, scheduledStartAt: string) => {
      if (!effectiveCompanyId) return;

      setLoading(true);
      try {
        if (type === "service") {
          await createServiceSchedule(
            {
              cipServiceId: routeIdOrServiceId,
              scheduledStartAt,
              companyId: isSuperAdmin ? effectiveCompanyId : undefined,
            },
            apiContext
          );
        } else {
          // Criar agendamento de rota (usar endpoint existente)
          await apiContext.PostAPI(
            "/route/schedule",
            {
              routeId: routeIdOrServiceId,
              scheduledStartAt,
              companyId: isSuperAdmin ? effectiveCompanyId : undefined,
            },
            true
          );
        }
        await fetchData();
        setShowAddModal(false);
        setAddDefaultDateKey(undefined);
        setAddDefaultSlotMin(undefined);
        toast.success("Agendamento criado com sucesso.");
      } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao criar agendamento. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [effectiveCompanyId, isSuperAdmin, apiContext, fetchData]
  );

  const handleRemoveSchedule = useCallback(
    async (scheduleId: string) => {
      if (!effectiveCompanyId) return;

      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

      setLoading(true);
      try {
        if (schedule.type === "service") {
          await deleteServiceSchedule(scheduleId, effectiveCompanyId, apiContext);
        } else {
          await apiContext.DeleteAPI(isSuperAdmin ? `/route/schedule/${scheduleId}?companyId=${effectiveCompanyId}` : `/route/schedule/${scheduleId}`, true);
        }
        await fetchData();
        toast.success("Agendamento removido.");
      } catch (error) {
        console.error("Erro ao remover agendamento:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao remover agendamento. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [effectiveCompanyId, schedules, apiContext, fetchData]
  );

  const handleMoveSchedule = useCallback(
    async (scheduleId: string, dateKey: string, slotMin: number, laneIndex?: number) => {
      if (!effectiveCompanyId) return;

      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

      if (laneIndex != null) {
        setScheduleLanes((prev) => ({ ...prev, [scheduleId]: laneIndex }));
      }

      const [y, m, d] = dateKey.split("-").map(Number);
      const h = Math.floor(slotMin / 60);
      const min = slotMin % 60;
      const newStartAt = `${dateKey}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000-03:00`;

      setLoading(true);
      try {
        if (schedule.type === "service") {
          await updateServiceSchedule(
            scheduleId,
            { scheduledStartAt: newStartAt },
            effectiveCompanyId,
            apiContext
          );
        } else {
          // Mover rota: deletar o agendamento antigo e criar outro na nova data (backend não tem PUT para route schedule)
          const deleteUrl = isSuperAdmin
            ? `/route/schedule/${scheduleId}?companyId=${effectiveCompanyId}`
            : `/route/schedule/${scheduleId}`;
          await apiContext.DeleteAPI(deleteUrl, true);
          await apiContext.PostAPI(
            "/route/schedule",
            {
              routeId: schedule.routeId,
              scheduledStartAt: newStartAt,
              companyId: isSuperAdmin ? effectiveCompanyId : undefined,
            },
            true
          );
        }
        await fetchData();
        toast.success("Agendamento movido com sucesso.");
      } catch (error) {
        console.error("Erro ao mover agendamento:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao mover agendamento. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [effectiveCompanyId, schedules, isSuperAdmin, apiContext, fetchData]
  );

  const handleAutoGenerate = useCallback(
    async (options: { startDate: string; endDate: string; serviceIds?: string[]; routeIds?: string[] }) => {
      if (!effectiveCompanyId) return;

      setLoading(true);
      try {
        const result = await autoGeneratePlanning(
          {
            ...options,
            companyId: isSuperAdmin ? effectiveCompanyId : undefined,
          },
          apiContext
        );
        await fetchData();
        setShowAutoGenerateModal(false);
        const skipped = result.skipped ?? 0;
        if (skipped > 0) {
          toast.success(
            `${result.created} agendamento(s) criado(s). ${skipped} já existiam no período e foram ignorados.`
          );
        } else {
          toast.success(
            result.created > 0
              ? `${result.created} agendamento(s) criado(s) com sucesso!`
              : "Planejamento gerado (nenhum agendamento novo no período)."
          );
        }
      } catch (error) {
        console.error("Erro ao gerar planejamento:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao gerar planejamento. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [effectiveCompanyId, isSuperAdmin, apiContext, fetchData]
  );

  if (loading && schedules.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (!companySchedule) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-500">Configurações da empresa não encontradas.</div>
      </div>
    );
  }

  // Converter CompanySchedule para o formato esperado
  const companyScheduleFormatted = {
    workDays: companySchedule.workDays ? (JSON.parse(companySchedule.workDays) as number[]) : [1, 2, 3, 4, 5],
    businessHoursStart: companySchedule.businessHoursStart || "08:00",
    businessHoursEnd: companySchedule.businessHoursEnd || "18:00",
    lunchBreakStart: companySchedule.lunchBreakStart ?? undefined,
    lunchBreakEnd: companySchedule.lunchBreakEnd ?? undefined,
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <PlanningToolbar
            currentDate={currentDate}
            view={viewMode}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange}
          />
          <Popover open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 sm:px-3"
                aria-label="Ações do calendário"
              >
                Ações
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <button
                type="button"
                onClick={() => {
                  setActionsMenuOpen(false);
                  setShowAutoGenerateModal(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Gerar Planejamento Automático
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Área do calendário */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "day" ? (
          <AdvancedDayView
            schedules={scheduleItems}
            currentDate={currentDate}
            companySchedule={companyScheduleFormatted}
            routes={planningRoutes}
            services={planningServices}
            onAddSchedule={handleAddScheduleClick}
            onRemoveSchedule={handleRemoveSchedule}
            onMoveSchedule={handleMoveSchedule}
            onAssignWorkers={setScheduleForAssignWorkers}
            scheduleLanes={scheduleLanes}
          />
        ) : viewMode === "week" ? (
          <ImprovedWeekView
            schedules={scheduleItems}
            currentDate={currentDate}
            companySchedule={companyScheduleFormatted}
            routes={planningRoutes}
            services={planningServices}
            onAddSchedule={handleAddScheduleClick}
            onRemoveSchedule={handleRemoveSchedule}
            onMoveSchedule={handleMoveSchedule}
            onAssignWorkers={setScheduleForAssignWorkers}
          />
        ) : viewMode === "year" ? (
          <AdvancedAnnualView
            displayDate={currentDate}
            monthlySummaries={monthlySummariesForYear}
            loadingYearWorkload={loadingYearWorkload}
            onMonthClick={(firstDayOfMonth) => {
              setCurrentDate(startOfDay(firstDayOfMonth));
              setViewMode("month");
            }}
          />
        ) : (
          <AdvancedMonthlyCalendar
            displayDate={currentDate}
            indicators={workloadIndicators}
            schedules={scheduleItems}
            companySchedule={companyScheduleFormatted}
            onMoveSchedule={handleMoveSchedule}
            onRemoveSchedule={handleRemoveSchedule}
            onAssignWorkers={setScheduleForAssignWorkers}
            onDateClick={(dateKey) => {
              const [y, m, d] = dateKey.split("-").map(Number);
              const date = new Date(y, m - 1, d);
              setCurrentDate(startOfDay(date));
              setViewMode("day");
            }}
            onMonthChange={(date) => {
              setCurrentDate(startOfDay(date));
            }}
          />
        )}
      </div>

      {/* Modais */}
      <AddScheduleModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddDefaultDateKey(undefined);
          setAddDefaultSlotMin(undefined);
        }}
        onSchedule={handleAddSchedule}
        routes={planningRoutes}
        services={planningServices}
        defaultDateKey={addDefaultDateKey}
        defaultSlotMin={addDefaultSlotMin}
        defaultType={addDefaultType}
        loading={loading}
      />

      <AutoGenerateModal
        open={showAutoGenerateModal}
        onClose={() => setShowAutoGenerateModal(false)}
        existingSchedules={schedules}
        onGenerate={handleAutoGenerate}
        loading={loading}
      />

      <AssignWorkersModal
        open={scheduleForAssignWorkers != null}
        onClose={() => setScheduleForAssignWorkers(null)}
        schedule={scheduleForAssignWorkers}
        companyId={effectiveCompanyId ?? null}
        eligibleWorkerRoleIds={eligibleWorkerRoleIdsForAssign}
        eligibleWorkerRoleNames={eligibleWorkerRoleNamesForAssign}
        onSaved={fetchData}
      />
    </div>
  );
}
