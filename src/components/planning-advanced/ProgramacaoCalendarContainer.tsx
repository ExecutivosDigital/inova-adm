"use client";

import { AdvancedAnnualView } from "@/components/planning-advanced/AdvancedAnnualView";
import { AdvancedDayView } from "@/components/planning-advanced/AdvancedDayView";
import { AdvancedMonthlyCalendar } from "@/components/planning-advanced/AdvancedMonthlyCalendar";
import { BulkProgramacaoModal } from "@/components/planning-advanced/BulkProgramacaoModal";
import { ConfirmProgramacaoModal } from "@/components/planning-advanced/ConfirmProgramacaoModal";
import { ImprovedWeekView } from "@/components/planning-advanced/ImprovedWeekView";
import {
  PlanningToolbar,
  type PlanningView,
} from "@/components/planning-advanced/PlanningToolbar";
import {
  ViewWorkOrdersModal,
  type WorkOrderSummary,
} from "@/components/planning-advanced/ViewWorkOrdersModal";
import { PlanningRoutesFiltersPanel } from "@/components/planning-routes/PlanningRoutesFiltersPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type {
  AutoGenerateFilters,
  ScheduleItem,
} from "@/lib/planning-advanced-types";
import {
  combineSchedules,
  fetchSchedules,
  fetchWorkload,
} from "@/lib/planning-api";
import type {
  CompanySchedule,
  FilterServicesPayload,
  Route,
  RouteCipServiceItem,
  RouteScheduleItem,
  ServiceScheduleItem,
  WorkloadIndicator,
} from "@/lib/route-types";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  startOfDay,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { ChevronDown, ClipboardList, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

/**
 * Indica se o agendamento gera ordem de serviço (rota com serviços ou serviço avulso).
 * Rota: 1 WO única com todos os serviços. Serviço avulso: 1 WO.
 */
function scheduleHasWorkOrder(
  schedule: ScheduleItem,
  routeCipServices: RouteCipServiceItem[],
): boolean {
  if (schedule.type === "route" && schedule.routeId) {
    return routeCipServices.some((rcs) => rcs.routeId === schedule.routeId);
  }
  return schedule.type === "service" && !!schedule.serviceId;
}

/** Payload para emissão de 1 WO de serviço avulso. */
function buildSingleServicePayload(
  schedule: ScheduleItem,
  visibilityMode: "all_with_team_role" | "assigned_workers",
  workerIds?: string[],
) {
  if (schedule.type !== "service" || !schedule.serviceId) return null;
  return {
    cipServiceId: schedule.serviceId,
    scheduledAt: schedule.scheduledStartAt,
    visibilityMode,
    ...(workerIds?.length ? { workerIds } : {}),
  };
}

export function ProgramacaoCalendarContainer() {
  const apiContext = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();

  const [viewMode, setViewMode] = useState<PlanningView>("week");
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [routeSchedules, setRouteSchedules] = useState<RouteScheduleItem[]>([]);
  const [serviceSchedules, setServiceSchedules] = useState<
    ServiceScheduleItem[]
  >([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [services, setServices] = useState<
    import("@/lib/route-types").CipService[]
  >([]);
  const [routeCipServices, setRouteCipServices] = useState<
    RouteCipServiceItem[]
  >([]);
  const [companySchedule, setCompanySchedule] =
    useState<CompanySchedule | null>(null);
  const [workloadIndicators, setWorkloadIndicators] = useState<
    WorkloadIndicator[]
  >([]);
  const [yearWorkloadSummaries, setYearWorkloadSummaries] = useState<Array<{
    scheduledHours: number;
    availableHours: number;
    utilization: number;
    status: "low" | "medium" | "high";
  }> | null>(null);
  const [loadingYearWorkload, setLoadingYearWorkload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleToConfirm, setScheduleToConfirm] =
    useState<ScheduleItem | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrderSummary[]>([]);
  const [selectedWorkOrdersToView, setSelectedWorkOrdersToView] = useState<
    WorkOrderSummary[] | null
  >(null);
  const [filters, setFilters] = useState<FilterServicesPayload>({});
  const [filteredCipServiceIds, setFilteredCipServiceIds] =
    useState<Set<string> | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [workers, setWorkers] = useState<
    Array<{
      id: string;
      name: string;
      workerRoles?: Array<{ id: string; name: string }>;
    }>
  >([]);

  const schedules = useMemo(
    () => combineSchedules(routeSchedules, serviceSchedules),
    [routeSchedules, serviceSchedules],
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
      const [
        schedulesResult,
        companyRes,
        routesRes,
        servicesRes,
        routeServicesRes,
        workOrdersRes,
        workersRes,
      ] = await Promise.all([
        fetchSchedules(effectiveCompanyId, apiContext),
        apiContext.GetAPI(`/company/${effectiveCompanyId}`, true),
        apiContext.GetAPI(
          isSuperAdmin ? `/route?companyId=${effectiveCompanyId}` : "/route",
          true,
        ),
        apiContext.PostAPI(
          `/filter-services`,
          { companyId: effectiveCompanyId },
          true,
        ),
        apiContext.GetAPI(
          `/route/company/${effectiveCompanyId}/route-services`,
          true,
        ),
        apiContext.GetAPI(`/work-order/company/${effectiveCompanyId}`, true),
        apiContext.GetAPI(
          isSuperAdmin
            ? `/workers?companyId=${effectiveCompanyId}`
            : "/workers",
          true,
        ),
      ]);
      setRouteSchedules(schedulesResult.routeSchedules);
      setServiceSchedules(schedulesResult.serviceSchedules);
      if (companyRes.status === 200 && companyRes.body) {
        setCompanySchedule(companyRes.body as CompanySchedule);
      }
      if (routesRes.status === 200 && routesRes.body?.routes) {
        setRoutes(
          (routesRes.body.routes as Route[]).filter((r) => !r.isTemporary),
        );
      }
      if (servicesRes.status === 200 && servicesRes.body?.cipServices) {
        setServices(
          servicesRes.body
            .cipServices as import("@/lib/route-types").CipService[],
        );
      }
      if (
        routeServicesRes.status === 200 &&
        routeServicesRes.body?.routeCipServices
      ) {
        setRouteCipServices(
          routeServicesRes.body.routeCipServices as RouteCipServiceItem[],
        );
      }
      if (workOrdersRes.status === 200 && workOrdersRes.body?.workOrders) {
        setWorkOrders(workOrdersRes.body.workOrders as WorkOrderSummary[]);
      }
      if (workersRes.status === 200 && workersRes.body?.workers) {
        setWorkers(
          workersRes.body.workers as Array<{
            id: string;
            name: string;
            workerRoles?: Array<{ id: string; name: string }>;
          }>,
        );
      }
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      try {
        const workloadResult = await fetchWorkload(
          effectiveCompanyId,
          year,
          month,
          apiContext,
        );
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
        fetchWorkload(effectiveCompanyId, year, month, apiContext),
      ),
    )
      .then((results) => {
        const summaries = results.map((r) => {
          const indicators = r.indicators;
          const scheduledHours = indicators.reduce(
            (s, i) => s + i.scheduledHours,
            0,
          );
          const availableHours = indicators.reduce(
            (s, i) => s + i.availableHours,
            0,
          );
          const utilization =
            indicators.length > 0
              ? indicators.reduce((s, i) => s + i.utilization, 0) /
                indicators.length
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
    const counts = Array.from({ length: 12 }, () => ({
      routeCount: 0,
      serviceCount: 0,
    }));
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
    if (!yearWorkloadSummaries || yearWorkloadSummaries.length !== 12)
      return null;
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

  const handleNavigate = useCallback(
    (action: "prev" | "next" | "today") => {
      if (action === "today") {
        setCurrentDate(startOfDay(new Date()));
        return;
      }
      if (viewMode === "year") {
        setCurrentDate(
          action === "prev"
            ? subYears(currentDate, 1)
            : addYears(currentDate, 1),
        );
      } else if (viewMode === "month") {
        setCurrentDate(
          action === "prev"
            ? subMonths(currentDate, 1)
            : addMonths(currentDate, 1),
        );
      } else if (viewMode === "week") {
        setCurrentDate(
          action === "prev"
            ? subWeeks(currentDate, 1)
            : addWeeks(currentDate, 1),
        );
      } else {
        setCurrentDate(
          action === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1),
        );
      }
    },
    [viewMode, currentDate],
  );

  const handleViewChange = useCallback(
    (newView: PlanningView) => {
      if (newView === "day") setCurrentDate(startOfDay(currentDate));
      setViewMode(newView);
    },
    [currentDate],
  );

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
    [routes, routeDurationByRouteId],
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
    [services],
  );

  const scheduleItems = useMemo(() => {
    const items: ScheduleItem[] = schedules.map((schedule) => {
      const raw = schedule as {
        assignedWorkerIds?: string[];
        assignedWorkers?: Array<{ id: string; name: string }>;
      };
      const base = {
        assignedWorkerIds: raw.assignedWorkerIds ?? [],
        assignedWorkers: raw.assignedWorkers ?? [],
        splitGroupId: schedule.splitGroupId ?? null,
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
        const cip = service ?? schedule.cipService;
        const fullDuration = cip?.executionTime?.minutes || 60;
        // Usar durationMinutes do schedule (parcial, se split) quando disponível
        const duration = schedule.durationMinutes ?? fullDuration;
        return {
          id: schedule.id,
          type: "service" as const,
          serviceId: schedule.cipServiceId,
          scheduledStartAt: schedule.scheduledStartAt,
          duration,
          ...base,
          service: cip
            ? {
                id: cip.id ?? schedule.cipServiceId,
                name: cip.serviceModel?.name || "Serviço",
                equipmentName:
                  cip.cip?.subset?.set?.equipment?.name ||
                  cip.cip?.subset?.set?.equipment?.tag ||
                  "Equipamento",
                duration: fullDuration,
                periodDays: cip.period?.days || undefined,
              }
            : undefined,
        };
      }
    });

    // Computar splitPartIndex e splitTotalParts para schedules multi-dia
    const splitGroupMap = new Map<string, typeof items>();
    for (const item of items) {
      if (item.splitGroupId) {
        const list = splitGroupMap.get(item.splitGroupId) ?? [];
        list.push(item);
        splitGroupMap.set(item.splitGroupId, list);
      }
    }
    for (const [, group] of splitGroupMap) {
      group.sort((a, b) =>
        a.scheduledStartAt.localeCompare(b.scheduledStartAt),
      );
      group.forEach((item, idx) => {
        item.splitPartIndex = idx + 1;
        item.splitTotalParts = group.length;
      });
    }

    return items;
  }, [schedules, routes, services]);

  const activeFiltersCount = useMemo(() => {
    const keys: (keyof FilterServicesPayload)[] = [
      "periodIds",
      "priorityIds",
      "teamIds",
      "serviceConditionIds",
      "jobSystemIds",
      "executionTimeIds",
      "extraTeamIds",
      "estimatedExtraTeamTimeIds",
      "serviceModelIds",
      "epiIds",
      "toolkitIds",
      "sectorIds",
      "equipmentTypeIds",
      "manufacturerIds",
      "costCenterIds",
      "safetyConditionIds",
      "lubricationSystemIds",
      "mainComponentIds",
      "powerUnitIds",
    ];
    return keys.filter((k) => (filters[k] as string[] | undefined)?.length)
      .length;
  }, [filters]);

  const handleApplyFilters = useCallback(
    async (newFilters: FilterServicesPayload) => {
      console.log("[filters] handleApplyFilters called with:", newFilters);
      setFilters(newFilters);
      const hasActive = Object.values(newFilters).some(
        (v) => Array.isArray(v) && v.length > 0,
      );
      if (!hasActive || !effectiveCompanyId) {
        console.log(
          "[filters] clearing filteredCipServiceIds (no active filters)",
        );
        setFilteredCipServiceIds(null);
        return;
      }
      try {
        const allIds: string[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await apiContext.PostAPI(
            "/filter-services",
            {
              ...newFilters,
              companyId: effectiveCompanyId,
              limit: 100,
              page,
            },
            true,
          );
          console.log(
            "[filters] page",
            page,
            "status:",
            res.status,
            "count:",
            (res.body?.cipServices as unknown[])?.length ?? 0,
            "total:",
            res.body?.total,
          );
          if (res.status === 200 && res.body?.cipServices) {
            const batch = (res.body.cipServices as Array<{ id: string }>).map(
              (s) => s.id,
            );
            allIds.push(...batch);
            const total =
              typeof res.body.total === "number" ? res.body.total : 0;
            hasMore = allIds.length < total;
            page += 1;
          } else {
            hasMore = false;
          }
        }
        console.log("[filters] total matched cipService IDs:", allIds.length);
        setFilteredCipServiceIds(new Set(allIds));
      } catch (err) {
        console.error("[filters] error calling /filter-services:", err);
        setFilteredCipServiceIds(null);
      }
    },
    [effectiveCompanyId, apiContext],
  );

  const filteredScheduleItems = useMemo(() => {
    console.log(
      "[filters] computing filteredScheduleItems. filteredCipServiceIds:",
      filteredCipServiceIds ? `Set(${filteredCipServiceIds.size})` : "null",
      "scheduleItems:",
      scheduleItems.length,
      "routeCipServices:",
      routeCipServices.length,
    );
    if (!filteredCipServiceIds) return scheduleItems;
    const result = scheduleItems.filter((item) => {
      if (item.type === "service" && item.serviceId) {
        const match = filteredCipServiceIds.has(item.serviceId);
        if (!match)
          console.log(
            "[filters] excluding service schedule",
            item.id,
            "serviceId:",
            item.serviceId,
          );
        return match;
      }
      if (item.type === "route" && item.routeId) {
        const rcsForRoute = routeCipServices.filter(
          (rcs) => rcs.routeId === item.routeId,
        );
        const match = rcsForRoute.some((rcs) =>
          filteredCipServiceIds.has(rcs.cipServiceId),
        );
        console.log(
          "[filters] route",
          item.routeId,
          "has",
          rcsForRoute.length,
          "cipServices, match:",
          match,
          "cipServiceIds:",
          rcsForRoute.map((r) => r.cipServiceId),
        );
        return match;
      }
      return true;
    });
    console.log(
      "[filters] filtered result:",
      result.length,
      "of",
      scheduleItems.length,
    );
    return result;
  }, [scheduleItems, filteredCipServiceIds, routeCipServices]);

  const handleProgramar = useCallback((schedule: ScheduleItem) => {
    setScheduleToConfirm(schedule);
  }, []);

  const handleConfirmProgramar = useCallback(
    async (schedule: ScheduleItem) => {
      const visibilityMode =
        (schedule.assignedWorkerIds?.length ?? 0) > 0
          ? "assigned_workers"
          : "all_with_team_role";
      const workerIds =
        (schedule.assignedWorkerIds?.length ?? 0) > 0
          ? schedule.assignedWorkerIds
          : undefined;
      if (schedule.type === "route" && schedule.routeId) {
        if (!scheduleHasWorkOrder(schedule, routeCipServices)) {
          toast.error(
            "Nenhuma ordem de serviço a emitir para esta rota (sem serviços vinculados).",
          );
          return;
        }
        setEmitting(true);
        try {
          const res = await apiContext.PostAPI(
            "/work-order/route",
            {
              routeId: schedule.routeId,
              scheduledAt: schedule.scheduledStartAt,
              visibilityMode,
              ...(workerIds?.length ? { workerIds } : {}),
            },
            true,
          );
          if (res.status !== 200 && res.status !== 201) {
            toast.error(
              (res.body as { message?: string })?.message ??
                "Erro ao emitir ordem de serviço.",
            );
            return;
          }
          setScheduleToConfirm(null);
          toast.success("Ordem de serviço emitida.");
          fetchData();
        } catch (error) {
          console.error("Erro ao emitir work order:", error);
          toast.error("Erro ao emitir ordem de serviço. Tente novamente.");
        } finally {
          setEmitting(false);
        }
        return;
      }
      const payloadSingle = buildSingleServicePayload(
        schedule,
        visibilityMode,
        workerIds,
      );
      if (!payloadSingle) {
        toast.error("Nenhuma ordem de serviço a emitir para este item.");
        return;
      }
      setEmitting(true);
      try {
        const res = await apiContext.PostAPI(
          "/work-order/single",
          payloadSingle,
          true,
        );
        if (res.status !== 200 && res.status !== 201) {
          toast.error(
            (res.body as { message?: string })?.message ??
              "Erro ao emitir ordem de serviço.",
          );
          return;
        }
        setScheduleToConfirm(null);
        toast.success("Ordem de serviço emitida.");
        fetchData();
      } catch (error) {
        console.error("Erro ao emitir work order:", error);
        toast.error("Erro ao emitir ordem de serviço. Tente novamente.");
      } finally {
        setEmitting(false);
      }
    },
    [routeCipServices, apiContext, fetchData],
  );

  const noop = useCallback(() => {}, []);

  function sameScheduleTime(
    woScheduledAt: string | null,
    scheduleStart: string,
  ): boolean {
    if (!woScheduledAt) return false;
    const a = Math.floor(new Date(woScheduledAt).getTime() / 60000);
    const b = Math.floor(new Date(scheduleStart).getTime() / 60000);
    return a === b;
  }

  const workOrdersByScheduleId = useMemo(() => {
    const map = new Map<string, WorkOrderSummary[]>();
    for (const schedule of scheduleItems) {
      const matched = workOrders.filter((wo) => {
        if (
          !sameScheduleTime(wo.scheduledAt ?? null, schedule.scheduledStartAt)
        )
          return false;
        if (schedule.type === "route" && schedule.routeId) {
          return wo.routeId === schedule.routeId;
        }
        if (schedule.type === "service" && schedule.serviceId) {
          return (
            wo.cipServiceId === schedule.serviceId ||
            wo.cipServices?.some(
              (s) => (s as { id?: string }).id === schedule.serviceId,
            )
          );
        }
        return false;
      });
      if (matched.length > 0) map.set(schedule.id, matched);
    }
    return map;
  }, [scheduleItems, workOrders]);

  /** IDs de agendamentos que já possuem OS emitida (1 WO por agendamento). */
  const scheduleIdsWithOS = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of scheduleItems) {
      const matched = workOrdersByScheduleId.get(schedule.id) ?? [];
      if (
        scheduleHasWorkOrder(schedule, routeCipServices) &&
        matched.length >= 1
      )
        set.add(schedule.id);
    }
    return set;
  }, [scheduleItems, routeCipServices, workOrdersByScheduleId]);

  const getWOCountForSchedule = useCallback(
    (schedule: ScheduleItem) =>
      scheduleHasWorkOrder(schedule, routeCipServices) ? 1 : 0,
    [routeCipServices],
  );

  const handleBulkConfirm = useCallback(
    async (
      startDate: string,
      endDate: string,
      _filters?: AutoGenerateFilters,
    ) => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate + "T23:59:59.999Z").getTime();
      const routeSchedulesInRange: ScheduleItem[] = [];
      const servicePayloads: Array<{
        cipServiceId: string;
        scheduledAt: string;
        visibilityMode: "all_with_team_role" | "assigned_workers";
        workerIds?: string[];
      }> = [];
      // Dedup: para schedules com splitGroupId, emitir apenas 1 WO por grupo (a parte mais cedo)
      const seenSplitGroups = new Set<string>();
      for (const schedule of scheduleItems) {
        const t = new Date(schedule.scheduledStartAt).getTime();
        if (t < start || t > end) continue;
        if (scheduleIdsWithOS.has(schedule.id)) continue;
        // Pular partes 2+ do mesmo split group (scheduleItems já ordenado por scheduledStartAt)
        if (schedule.splitGroupId) {
          if (seenSplitGroups.has(schedule.splitGroupId)) continue;
          seenSplitGroups.add(schedule.splitGroupId);
        }
        const visibilityMode =
          (schedule.assignedWorkerIds?.length ?? 0) > 0
            ? "assigned_workers"
            : "all_with_team_role";
        const workerIds =
          (schedule.assignedWorkerIds?.length ?? 0) > 0
            ? schedule.assignedWorkerIds
            : undefined;
        if (
          schedule.type === "route" &&
          schedule.routeId &&
          scheduleHasWorkOrder(schedule, routeCipServices)
        ) {
          routeSchedulesInRange.push(schedule);
        } else {
          const payload = buildSingleServicePayload(
            schedule,
            visibilityMode,
            workerIds,
          );
          if (payload) servicePayloads.push(payload);
        }
      }
      const total = routeSchedulesInRange.length + servicePayloads.length;
      if (total === 0) {
        toast.error(
          "Nenhum agendamento pendente no período selecionado (todos já possuem ordem de serviço ou período vazio).",
        );
        return;
      }
      setEmitting(true);
      try {
        // Emitir rotas e serviços em paralelo usando endpoints batch
        const promises: Promise<{ status: number; body: unknown }>[] = [];

        if (routeSchedulesInRange.length > 0) {
          const routePayloads = routeSchedulesInRange.map((schedule) => ({
            routeId: schedule.routeId!,
            scheduledAt: schedule.scheduledStartAt,
            visibilityMode: ((schedule.assignedWorkerIds?.length ?? 0) > 0
              ? "assigned_workers"
              : "all_with_team_role") as
              | "all_with_team_role"
              | "assigned_workers",
            ...((schedule.assignedWorkerIds?.length ?? 0) > 0
              ? { workerIds: schedule.assignedWorkerIds }
              : {}),
          }));
          promises.push(
            apiContext.PostAPI(
              "/work-order/route/multi",
              { routes: routePayloads },
              true,
            ),
          );
        }

        if (servicePayloads.length > 0) {
          promises.push(
            apiContext.PostAPI(
              "/work-order/multi",
              { workOrders: servicePayloads },
              true,
            ),
          );
        }

        const results = await Promise.all(promises);
        const failed = results.find(
          (r) => r.status !== 200 && r.status !== 201,
        );
        if (failed) {
          toast.error(
            (failed.body as { message?: string })?.message ??
              "Erro ao emitir ordens de serviço.",
          );
          return;
        }

        setShowBulkModal(false);
        toast.success(`${total} ordem(ns) de serviço emitida(s).`);
        fetchData();
      } catch (error) {
        console.error("Erro ao emitir work orders em lote:", error);
        toast.error("Erro ao emitir ordens de serviço. Tente novamente.");
      } finally {
        setEmitting(false);
      }
    },
    [scheduleItems, routeCipServices, scheduleIdsWithOS, apiContext, fetchData],
  );

  const workOrdersForSchedule = useCallback(
    (schedule: ScheduleItem) => workOrdersByScheduleId.get(schedule.id) ?? [],
    [workOrdersByScheduleId],
  );

  const { workerRoleCapacity, totalAvailableHoursPerDay } = useMemo(() => {
    if (!companySchedule)
      return { workerRoleCapacity: [], totalAvailableHoursPerDay: 0 };
    const cs = companySchedule;
    const toMin = (hhmm: string | null) => {
      if (!hhmm) return 0;
      const [h, m] = hhmm.split(":").map(Number);
      return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
    };
    const startMin = toMin(cs.businessHoursStart);
    const endMin = toMin(cs.businessHoursEnd);
    let lunchMin = 0;
    if (cs.lunchBreakStart && cs.lunchBreakEnd) {
      lunchMin = toMin(cs.lunchBreakEnd) - toMin(cs.lunchBreakStart);
      if (lunchMin < 0) lunchMin = 0;
    }
    const hoursPerWorkerPerDay = Math.max(
      0,
      (endMin - startMin - lunchMin) / 60,
    );

    const total = Math.round(workers.length * hoursPerWorkerPerDay * 100) / 100;

    const roleMap = new Map<
      string,
      { name: string; workerCount: number; hours: number }
    >();
    for (const w of workers) {
      const roles = w.workerRoles ?? [];
      if (roles.length === 0) {
        const key = "__sem_funcao__";
        const entry = roleMap.get(key) ?? {
          name: "Sem função",
          workerCount: 0,
          hours: 0,
        };
        entry.workerCount += 1;
        entry.hours += hoursPerWorkerPerDay;
        roleMap.set(key, entry);
      } else {
        const hoursPerRole = hoursPerWorkerPerDay / roles.length;
        for (const role of roles) {
          const entry = roleMap.get(role.id) ?? {
            name: role.name,
            workerCount: 0,
            hours: 0,
          };
          entry.workerCount += 1;
          entry.hours += hoursPerRole;
          roleMap.set(role.id, entry);
        }
      }
    }

    const capacity = Array.from(roleMap.entries()).map(
      ([id, { name, workerCount, hours }]) => ({
        id,
        name,
        workerCount,
        hoursPerDay: Math.round(hours * 100) / 100,
      }),
    );

    return { workerRoleCapacity: capacity, totalAvailableHoursPerDay: total };
  }, [workers, companySchedule]);

  const cipServiceRoleMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ss of serviceSchedules) {
      const roles =
        (
          ss.cipService as {
            team?: { teamWorkerRoles?: Array<{ workerRole?: { id: string } }> };
          }
        )?.team?.teamWorkerRoles
          ?.map((twr) => twr.workerRole?.id)
          .filter((id): id is string => !!id) ?? [];
      if (roles.length > 0) map.set(ss.cipServiceId, roles);
    }
    for (const s of services) {
      if (!map.has(s.id)) {
        const roles =
          s.team?.teamWorkerRoles
            ?.map((twr) => twr.workerRole?.id)
            .filter((id): id is string => !!id) ?? [];
        if (roles.length > 0) map.set(s.id, roles);
      }
    }
    return map;
  }, [serviceSchedules, services]);

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
        <div className="text-slate-500">
          Configurações da empresa não encontradas.
        </div>
      </div>
    );
  }

  const companyScheduleFormatted = {
    workDays: companySchedule.workDays
      ? (JSON.parse(companySchedule.workDays) as number[])
      : [1, 2, 3, 4, 5],
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-sm font-medium sm:px-3 ${
                activeFiltersCount > 0
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-primary ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <Popover open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 sm:px-3"
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
                    setShowBulkModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <ClipboardList className="text-primary h-4 w-4" />
                  Emitir Ordens de Serviço em Lote
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <PlanningRoutesFiltersPanel
            filters={filters}
            onApply={handleApplyFilters}
            onClose={() => setFiltersOpen(false)}
            compact
          />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {viewMode === "day" ? (
          <AdvancedDayView
            schedules={filteredScheduleItems}
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
            totalAvailableHoursPerDay={totalAvailableHoursPerDay}
            workerRoleCapacity={workerRoleCapacity}
            cipServiceRoleMap={cipServiceRoleMap}
          />
        ) : viewMode === "week" ? (
          <ImprovedWeekView
            schedules={filteredScheduleItems}
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
            totalAvailableHoursPerDay={totalAvailableHoursPerDay}
            workerRoleCapacity={workerRoleCapacity}
            cipServiceRoleMap={cipServiceRoleMap}
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
            schedules={filteredScheduleItems}
            companySchedule={companyScheduleFormatted}
            workOrdersForSchedule={workOrdersForSchedule}
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
        onConfirm={() =>
          scheduleToConfirm
            ? handleConfirmProgramar(scheduleToConfirm)
            : undefined
        }
        loading={emitting}
      />

      <BulkProgramacaoModal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        schedules={scheduleItems}
        scheduleIdsWithOS={scheduleIdsWithOS}
        getWOCountForSchedule={getWOCountForSchedule}
        routeCipServices={routeCipServices}
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
