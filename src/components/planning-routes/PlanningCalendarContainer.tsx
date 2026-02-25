"use client";

import { AddScheduleModal } from "@/components/planning-advanced/AddScheduleModal";
import { AdvancedDayView } from "@/components/planning-advanced/AdvancedDayView";
import { AdvancedMonthlyCalendar } from "@/components/planning-advanced/AdvancedMonthlyCalendar";
import { AutoGenerateModal } from "@/components/planning-advanced/AutoGenerateModal";
import { ImprovedWeekView } from "@/components/planning-advanced/ImprovedWeekView";
import { PlanningToolbar, type PlanningView } from "@/components/planning-advanced/PlanningToolbar";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
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
  RouteScheduleItem,
  ServiceScheduleItem,
  WorkloadIndicator
} from "@/lib/route-types";
import { addDays, addMonths, addWeeks, startOfDay, subDays, subMonths, subWeeks } from "date-fns";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [companySchedule, setCompanySchedule] = useState<CompanySchedule | null>(null);
  const [workloadIndicators, setWorkloadIndicators] = useState<WorkloadIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [addDefaultDateKey, setAddDefaultDateKey] = useState<string | undefined>();
  const [addDefaultSlotMin, setAddDefaultSlotMin] = useState<number | undefined>();
  const [addDefaultType, setAddDefaultType] = useState<"route" | "service">("route");

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
      setCompanySchedule(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Buscar agendamentos, rotas, serviços e configurações da empresa
      const [schedulesResult, companyRes, routesRes, servicesRes] = await Promise.all([
        fetchSchedules(effectiveCompanyId, apiContext),
        apiContext.GetAPI(`/company/${effectiveCompanyId}`, true),
        apiContext.GetAPI(isSuperAdmin ? `/route?companyId=${effectiveCompanyId}` : "/route", true),
        apiContext.PostAPI(`/filter-services`, { companyId: effectiveCompanyId }, true),
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

  // Navegação entre datas
  const handleNavigate = useCallback((action: "prev" | "next" | "today") => {
    if (action === "today") {
      setCurrentDate(startOfDay(new Date()));
      return;
    }

    if (viewMode === "month") {
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

  // Converter rotas e serviços para o formato esperado pelos componentes
  const planningRoutes = useMemo(() => {
    return routes.map((route) => {
      // Calcular duração da rota (soma dos tempos de execução dos serviços)
      // Por enquanto, usar um valor padrão ou buscar RouteCipService
      return {
        id: route.id,
        code: route.code,
        name: route.name,
        duration: 120, // 2 horas padrão (pode ser melhorado)
      };
    });
  }, [routes]);

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

  // Converter agendamentos para o formato esperado
  const scheduleItems = useMemo(() => {
    return schedules.map((schedule) => {
      if (schedule.type === "route") {
        const route = routes.find((r) => r.id === schedule.routeId);
        return {
          id: schedule.id,
          type: "route" as const,
          routeId: schedule.routeId,
          scheduledStartAt: schedule.scheduledStartAt,
          duration: 120, // TODO: Calcular duração real
          route: route
            ? {
                id: route.id,
                code: route.code,
                name: route.name,
                duration: 120,
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
      } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        alert("Erro ao criar agendamento. Tente novamente.");
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
      } catch (error) {
        console.error("Erro ao remover agendamento:", error);
        alert("Erro ao remover agendamento. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [effectiveCompanyId, schedules, apiContext, fetchData]
  );

  const handleMoveSchedule = useCallback(
    async (scheduleId: string, dateKey: string, slotMin: number) => {
      if (!effectiveCompanyId) return;

      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

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
          // Atualizar agendamento de rota (usar endpoint existente se houver, senão deletar e recriar)
          await apiContext.DeleteAPI(`/route/schedule/${scheduleId}`, true);
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
      } catch (error) {
        console.error("Erro ao mover agendamento:", error);
        alert("Erro ao mover agendamento. Tente novamente.");
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
        await autoGeneratePlanning(
          {
            ...options,
            companyId: isSuperAdmin ? effectiveCompanyId : undefined,
          },
          apiContext
        );
        await fetchData();
        setShowAutoGenerateModal(false);
        alert("Planejamento gerado com sucesso!");
      } catch (error) {
        console.error("Erro ao gerar planejamento:", error);
        alert("Erro ao gerar planejamento. Tente novamente.");
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
          <button
            type="button"
            onClick={() => setShowAutoGenerateModal(true)}
            className="flex items-center gap-2 rounded border border-primary bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 sm:px-4 sm:py-2"
          >
            <Sparkles className="h-4 w-4" />
            Gerar Planejamento Automático
          </button>
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
          />
        ) : (
          <AdvancedMonthlyCalendar
            indicators={workloadIndicators}
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
        onGenerate={handleAutoGenerate}
        loading={loading}
      />
    </div>
  );
}
