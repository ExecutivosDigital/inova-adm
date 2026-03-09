"use client";

import { AdvancedAnnualView } from "@/components/planning-advanced/AdvancedAnnualView";
import { AdvancedDayView } from "@/components/planning-advanced/AdvancedDayView";
import { AdvancedMonthlyCalendar } from "@/components/planning-advanced/AdvancedMonthlyCalendar";
import { BulkProgramacaoModal } from "@/components/planning-advanced/BulkProgramacaoModal";
import { ConfirmProgramacaoModal } from "@/components/planning-advanced/ConfirmProgramacaoModal";
import { ImprovedWeekView } from "@/components/planning-advanced/ImprovedWeekView";
import { ViewWorkOrdersModal, type WorkOrderSummary } from "@/components/planning-advanced/ViewWorkOrdersModal";
import { PlanningToolbar, type PlanningView } from "@/components/planning-advanced/PlanningToolbar";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { combineSchedules, fetchSchedules, fetchWorkload } from "@/lib/planning-api";
import type { ScheduleItem } from "@/lib/planning-advanced-types";
import type {
  CompanySchedule,
  Route,
  RouteCipServiceItem,
  RouteScheduleItem,
  ServiceScheduleItem,
  WorkloadIndicator,
} from "@/lib/route-types";
import { addDays, addMonths, addWeeks, addYears, startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { CalendarClock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

function buildWorkOrdersForSchedule(
  schedule: ScheduleItem,
  routeCipServices: RouteCipServiceItem[]
): Array<{ cipServiceId: string; routeId?: string | null; scheduledAt: string }> {
  const scheduledAt = schedule.scheduledStartAt;
  if (schedule.type === "route" && schedule.routeId) {
    const servicesInRoute = routeCipServices.filter((rcs) => rcs.routeId === schedule.routeId);
    return servicesInRoute.map((rcs) => ({
      cipServiceId: rcs.cipServiceId,
      routeId: rcs.routeId,
      scheduledAt,
    }));
  }
  if (schedule.type === "service" && schedule.serviceId) {
    return [{ cipServiceId: schedule.serviceId, scheduledAt }];
  }
  return [];
}

function buildWorkOrdersForPeriod(
  scheduleItems: ScheduleItem[],
  routeCipServices: RouteCipServiceItem[],
  startDate: string,
  endDate: string
): Array<{ cipServiceId: string; routeId?: string | null; scheduledAt: string }> {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate + "T23:59:59.999Z").getTime();
  const list: Array<{ cipServiceId: string; routeId?: string | null; scheduledAt: string }> = [];
  for (const schedule of scheduleItems) {
    const t = new Date(schedule.scheduledStartAt).getTime();
    if (t < start || t > end) continue;
    list.push(...buildWorkOrdersForSchedule(schedule, routeCipServices));
  }
  return list;
}

export function ProgramacaoCalendarContainer() {
  const apiContext = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();

  const [viewMode, setViewMode] = useState<PlanningView>("week");
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [routeSchedules, setRouteSchedules] = useState<RouteScheduleItem[]>([]);
  const [serviceSchedules, setServiceSchedules] = useState<ServiceScheduleItem[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [services, setServices] = useState<import("@/lib/route-types").CipService[]>([]);
  const [routeCipServices, setRouteCipServices] = useState<RouteCipServiceItem[]>([]);
  const [companySchedule, setCompanySchedule] = useState<CompanySchedule | null>(null);
  const [workloadIndicators, setWorkloadIndicators] = useState<WorkloadIndicator[]>([]);
  const [yearWorkloadSummaries, setYearWorkloadSummaries] = useState<
    Array<{ scheduledHours: number; availableHours: number; utilization: number; status: "low" | "medium" | "high" }> | null
  >(null);
  const [loadingYearWorkload, setLoadingYearWorkload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleToConfirm, setScheduleToConfirm] = useState<ScheduleItem | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrderSummary[]>([]);
  const [selectedWorkOrdersToView, setSelectedWorkOrdersToView] = useState<WorkOrderSummary[] | null>(null);

  const schedules = useMemo(
    () => combineSchedules(routeSchedules, serviceSchedules),
    [routeSchedules, serviceSchedules]
  );

  const fetchData = useCallback(async () => {
    if (!effectiveCompanyId) {
      setRouteSchedules([]);
      setServiceSchedules([]);
      setRoutes([]);
      setServices([]);
      setRouteCipServices([]);
      setWorkOrders([]);
      setCompanySchedule(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [schedulesResult, companyRes, routesRes, servicesRes, routeServicesRes, workOrdersRes] = await Promise.all([
        fetchSchedules(effectiveCompanyId, apiContext),
        apiContext.GetAPI(`/company/${effectiveCompanyId}`, true),
        apiContext.GetAPI(isSuperAdmin ? `/route?companyId=${effectiveCompanyId}` : "/route", true),
        apiContext.PostAPI(`/filter-services`, { companyId: effectiveCompanyId }, true),
        apiContext.GetAPI(`/route/company/${effectiveCompanyId}/route-services`, true),
        apiContext.GetAPI(`/work-order/company/${effectiveCompanyId}`, true),
      ]);
      setRouteSchedules(schedulesResult.routeSchedules);
      setServiceSchedules(schedulesResult.serviceSchedules);
      if (companyRes.status === 200 && companyRes.body) {
        setCompanySchedule(companyRes.body as CompanySchedule);
      }
      if (routesRes.status === 200 && routesRes.body?.routes) {
        setRoutes((routesRes.body.routes as Route[]).filter((r) => !r.isTemporary));
      }
      if (servicesRes.status === 200 && servicesRes.body?.cipServices) {
        setServices(servicesRes.body.cipServices as import("@/lib/route-types").CipService[]);
      }
      if (routeServicesRes.status === 200 && routeServicesRes.body?.routeCipServices) {
        setRouteCipServices(routeServicesRes.body.routeCipServices as RouteCipServiceItem[]);
      }
      if (workOrdersRes.status === 200 && workOrdersRes.body?.workOrders) {
        setWorkOrders(workOrdersRes.body.workOrders as WorkOrderSummary[]);
      }
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      try {
        const workloadResult = await fetchWorkload(effectiveCompanyId, year, month, apiContext);
        setWorkloadIndicators(workloadResult.indicators);
      } catch {
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

  useEffect(() => {
    if (!effectiveCompanyId || viewMode !== "month") return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    fetchWorkload(effectiveCompanyId, year, month, apiContext)
      .then((result) => setWorkloadIndicators(result.indicators))
      .catch(() => setWorkloadIndicators([]));
  }, [effectiveCompanyId, currentDate, viewMode, apiContext]);

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
      .catch(() => setYearWorkloadSummaries(null))
      .finally(() => setLoadingYearWorkload(false));
  }, [effectiveCompanyId, currentDate, viewMode, apiContext]);

  const scheduleCountsByMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const counts = Array.from({ length: 12 }, () => ({ routeCount: 0, serviceCount: 0 }));
    for (const s of schedules) {
      const d = new Date(s.scheduledStartAt);
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
      const monthIndex = d.getMonth();
      if (s.type === "route") counts[monthIndex].routeCount += 1;
      else counts[monthIndex].serviceCount += 1;
    }
    return counts;
  }, [schedules, currentDate]);

  // Meses sem planejamento (0 rotas e 0 serviços) ficam null → azul na visão anual.
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
    if (newView === "day") setCurrentDate(startOfDay(currentDate));
    setViewMode(newView);
  }, [currentDate]);

  const routeDurationByRouteId = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of routeSchedules) {
      const dur = (s as { durationMinutes?: number }).durationMinutes;
      if (dur != null && !map.has(s.routeId)) map.set(s.routeId, dur);
    }
    return map;
  }, [routeSchedules]);

  const planningRoutes = useMemo(
    () =>
      routes.map((route) => ({
        id: route.id,
        code: route.code,
        name: route.name,
        duration: routeDurationByRouteId.get(route.id) ?? 120,
      })),
    [routes, routeDurationByRouteId]
  );

  const planningServices = useMemo(
    () =>
      services.map((service) => ({
        id: service.id,
        name: service.serviceModel?.name || "Serviço",
        equipmentName:
          service.cip?.subset?.set?.equipment?.name ||
          service.cip?.subset?.set?.equipment?.tag ||
          "Equipamento",
        duration: service.executionTime?.minutes || 60,
        periodDays: service.period?.days || undefined,
        lastExecutionDate: undefined,
      })),
    [services]
  );

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
            ? { id: route.id, code: route.code, name: route.name, duration }
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

  const handleProgramar = useCallback((schedule: ScheduleItem) => {
    setScheduleToConfirm(schedule);
  }, []);

  const handleConfirmProgramar = useCallback(
    async (schedule: ScheduleItem) => {
      const workOrders = buildWorkOrdersForSchedule(schedule, routeCipServices);
      if (workOrders.length === 0) {
        toast.error("Nenhuma ordem de serviço a emitir para este item.");
        return;
      }
      const visibilityMode = (schedule.assignedWorkerIds?.length ?? 0) > 0 ? "assigned_workers" : "all_with_team_role";
      const workerIds = (schedule.assignedWorkerIds?.length ?? 0) > 0 ? schedule.assignedWorkerIds : undefined;
      setEmitting(true);
      try {
        const payloadSingle = {
          cipServiceId: workOrders[0].cipServiceId,
          routeId: workOrders[0].routeId ?? undefined,
          scheduledAt: workOrders[0].scheduledAt,
          visibilityMode,
          ...(workerIds?.length ? { workerIds } : {}),
        };
        if (workOrders.length === 1) {
          const res = await apiContext.PostAPI("/work-order/single", payloadSingle, true);
          if (res.status !== 200 && res.status !== 201) {
            toast.error((res.body as { message?: string })?.message ?? "Erro ao emitir ordem de serviço.");
            return;
          }
        } else {
          const payloadMulti = {
            workOrders: workOrders.map((wo) => ({
              cipServiceId: wo.cipServiceId,
              routeId: wo.routeId ?? undefined,
              scheduledAt: wo.scheduledAt,
              visibilityMode,
              ...(workerIds?.length ? { workerIds } : {}),
            })),
          };
          const res = await apiContext.PostAPI("/work-order/multi", payloadMulti, true);
          if (res.status !== 200 && res.status !== 201) {
            toast.error((res.body as { message?: string })?.message ?? "Erro ao emitir ordens de serviço.");
            return;
          }
        }
        setScheduleToConfirm(null);
        toast.success(`${workOrders.length} ordem(ns) de serviço emitida(s).`);
        fetchData();
      } catch (error) {
        console.error("Erro ao emitir work order:", error);
        toast.error("Erro ao emitir ordem de serviço. Tente novamente.");
      } finally {
        setEmitting(false);
      }
    },
    [routeCipServices, apiContext, fetchData]
  );

  const noop = useCallback(() => {}, []);

  function sameScheduleTime(woScheduledAt: string | null, scheduleStart: string): boolean {
    if (!woScheduledAt) return false;
    const a = Math.floor(new Date(woScheduledAt).getTime() / 60000);
    const b = Math.floor(new Date(scheduleStart).getTime() / 60000);
    return a === b;
  }

  const workOrdersByScheduleId = useMemo(() => {
    const map = new Map<string, WorkOrderSummary[]>();
    for (const schedule of scheduleItems) {
      const matched = workOrders.filter((wo) => {
        if (!sameScheduleTime(wo.scheduledAt ?? null, schedule.scheduledStartAt)) return false;
        if (schedule.type === "route" && schedule.routeId) {
          return wo.routeId === schedule.routeId;
        }
        if (schedule.type === "service" && schedule.serviceId) {
          return wo.cipServiceId === schedule.serviceId;
        }
        return false;
      });
      if (matched.length > 0) map.set(schedule.id, matched);
    }
    return map;
  }, [scheduleItems, workOrders]);

  /** IDs de agendamentos que já possuem todas as OS emitidas (serão excluídos do lote) */
  const scheduleIdsWithOS = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of scheduleItems) {
      const matched = workOrdersByScheduleId.get(schedule.id) ?? [];
      const expectedCount = buildWorkOrdersForSchedule(schedule, routeCipServices).length;
      if (expectedCount > 0 && matched.length >= expectedCount) set.add(schedule.id);
    }
    return set;
  }, [scheduleItems, routeCipServices, workOrdersByScheduleId]);

  const getWOCountForSchedule = useCallback(
    (schedule: ScheduleItem) => buildWorkOrdersForSchedule(schedule, routeCipServices).length,
    [routeCipServices]
  );

  const handleBulkConfirm = useCallback(
    async (startDate: string, endDate: string) => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate + "T23:59:59.999Z").getTime();
      const workOrdersPayload: Array<{
        cipServiceId: string;
        routeId?: string | null;
        scheduledAt: string;
        visibilityMode: "all_with_team_role" | "assigned_workers";
        workerIds?: string[];
      }> = [];
      for (const schedule of scheduleItems) {
        const t = new Date(schedule.scheduledStartAt).getTime();
        if (t < start || t > end) continue;
        if (scheduleIdsWithOS.has(schedule.id)) continue;
        const wos = buildWorkOrdersForSchedule(schedule, routeCipServices);
        const visibilityMode = (schedule.assignedWorkerIds?.length ?? 0) > 0 ? "assigned_workers" : "all_with_team_role";
        const workerIds = (schedule.assignedWorkerIds?.length ?? 0) > 0 ? schedule.assignedWorkerIds : undefined;
        for (const wo of wos) {
          workOrdersPayload.push({
            cipServiceId: wo.cipServiceId,
            routeId: wo.routeId ?? undefined,
            scheduledAt: wo.scheduledAt,
            visibilityMode,
            ...(workerIds?.length ? { workerIds } : {}),
          });
        }
      }
      if (workOrdersPayload.length === 0) {
        toast.error("Nenhum agendamento pendente no período selecionado (todos já possuem ordem de serviço ou período vazio).");
        return;
      }
      setEmitting(true);
      try {
        const res = await apiContext.PostAPI("/work-order/multi", { workOrders: workOrdersPayload }, true);
        if (res.status !== 200 && res.status !== 201) {
          toast.error((res.body as { message?: string })?.message ?? "Erro ao emitir ordens de serviço.");
          return;
        }
        setShowBulkModal(false);
        toast.success(`${workOrdersPayload.length} ordem(ns) de serviço emitida(s).`);
        fetchData();
      } catch (error) {
        console.error("Erro ao emitir work orders em lote:", error);
        toast.error("Erro ao emitir ordens de serviço. Tente novamente.");
      } finally {
        setEmitting(false);
      }
    },
    [scheduleItems, routeCipServices, scheduleIdsWithOS, apiContext, fetchData]
  );

  const workOrdersForSchedule = useCallback(
    (schedule: ScheduleItem) => workOrdersByScheduleId.get(schedule.id) ?? [],
    [workOrdersByScheduleId]
  );

  const handleViewWorkOrders = useCallback((list: WorkOrderSummary[]) => {
    setSelectedWorkOrdersToView(list);
  }, []);

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

  const companyScheduleFormatted = {
    workDays: companySchedule.workDays ? (JSON.parse(companySchedule.workDays) as number[]) : [1, 2, 3, 4, 5],
    businessHoursStart: companySchedule.businessHoursStart || "08:00",
    businessHoursEnd: companySchedule.businessHoursEnd || "18:00",
    lunchBreakStart: companySchedule.lunchBreakStart ?? undefined,
    lunchBreakEnd: companySchedule.lunchBreakEnd ?? undefined,
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <PlanningToolbar
            currentDate={currentDate}
            view={viewMode}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange}
          />
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 rounded border border-primary bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 sm:px-4 sm:py-2"
          >
            <CalendarClock className="h-4 w-4" />
            Emitir ordens de serviço em lote
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === "day" ? (
          <AdvancedDayView
            schedules={scheduleItems}
            currentDate={currentDate}
            companySchedule={companyScheduleFormatted}
            routes={planningRoutes}
            services={planningServices}
            readOnly
            onProgramar={handleProgramar}
            onAddSchedule={noop}
            onRemoveSchedule={noop}
            onMoveSchedule={noop}
            workOrdersForSchedule={workOrdersForSchedule}
            onViewWorkOrders={handleViewWorkOrders}
          />
        ) : viewMode === "week" ? (
          <ImprovedWeekView
            schedules={scheduleItems}
            currentDate={currentDate}
            companySchedule={companyScheduleFormatted}
            routes={planningRoutes}
            services={planningServices}
            readOnly
            onProgramar={handleProgramar}
            onAddSchedule={noop}
            onRemoveSchedule={noop}
            onMoveSchedule={noop}
            workOrdersForSchedule={workOrdersForSchedule}
            onViewWorkOrders={handleViewWorkOrders}
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
            onDateClick={(dateKey) => {
              const [y, m, d] = dateKey.split("-").map(Number);
              const date = new Date(y, m - 1, d);
              setCurrentDate(startOfDay(date));
              setViewMode("day");
            }}
            onMonthChange={(date) => setCurrentDate(startOfDay(date))}
          />
        )}
      </div>

      <ConfirmProgramacaoModal
        open={scheduleToConfirm != null}
        onClose={() => setScheduleToConfirm(null)}
        schedule={scheduleToConfirm}
        onConfirm={() => (scheduleToConfirm ? handleConfirmProgramar(scheduleToConfirm) : undefined)}
        loading={emitting}
      />

      <BulkProgramacaoModal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        schedules={scheduleItems}
        scheduleIdsWithOS={scheduleIdsWithOS}
        getWOCountForSchedule={getWOCountForSchedule}
        onConfirm={handleBulkConfirm}
        loading={emitting}
      />

      <ViewWorkOrdersModal
        open={selectedWorkOrdersToView !== null}
        onClose={() => setSelectedWorkOrdersToView(null)}
        workOrders={selectedWorkOrdersToView ?? []}
      />
    </div>
  );
}
