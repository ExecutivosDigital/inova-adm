"use client";

import { useState, useMemo } from "react";
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfDay } from "date-fns";
import { Sparkles } from "lucide-react";
import { AdvancedDayView } from "@/components/planning-advanced/AdvancedDayView";
import { ImprovedWeekView } from "@/components/planning-advanced/ImprovedWeekView";
import { AdvancedMonthlyCalendar } from "@/components/planning-advanced/AdvancedMonthlyCalendar";
import { PlanningToolbar, type PlanningView } from "@/components/planning-advanced/PlanningToolbar";
import { AddScheduleModal } from "@/components/planning-advanced/AddScheduleModal";
import { AutoGenerateModal } from "@/components/planning-advanced/AutoGenerateModal";
import {
  mockCompanySchedule,
  mockWorkersCount,
  mockRoutes,
  mockServices,
  mockSchedules,
  generateMockWorkloadIndicators,
} from "@/lib/planning-mock-data";
import type {
  ScheduleItem,
  ScheduleType,
  AutoGenerateOptions,
} from "@/lib/planning-advanced-types";

export default function Planejamento2Page() {
  const [viewMode, setViewMode] = useState<PlanningView>("week");
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [schedules, setSchedules] = useState<ScheduleItem[]>(mockSchedules);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [addDefaultDateKey, setAddDefaultDateKey] = useState<string | undefined>();
  const [addDefaultSlotMin, setAddDefaultSlotMin] = useState<number | undefined>();
  const [addDefaultType, setAddDefaultType] = useState<ScheduleType>("route");
  const [loading, setLoading] = useState(false);
  // Calcular indicadores de carga para o mês visualizado
  const indicators = useMemo(
    () =>
      generateMockWorkloadIndicators(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        schedules // Passar os schedules atuais (incluindo gerados)
      ),
    [currentDate, schedules] // Recalcular quando data ou schedules mudarem
  );
  
  // Navegação entre datas
  const handleNavigate = (action: "prev" | "next" | "today") => {
    if (action === "today") {
      setCurrentDate(startOfDay(new Date()));
      return;
    }

    if (viewMode === "month") {
      setCurrentDate(
        action === "prev"
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1)
      );
    } else if (viewMode === "week") {
      setCurrentDate(
        action === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1)
      );
    } else {
      // Visualização diária
      setCurrentDate(
        action === "prev"
          ? subDays(currentDate, 1)
          : addDays(currentDate, 1)
      );
    }
  };

  const handleViewChange = (newView: PlanningView) => {
    // Normalizar data quando muda para visualização diária
    if (newView === "day") {
      setCurrentDate(startOfDay(currentDate));
    }
    setViewMode(newView);
  };
  
  const handleAddSchedule = (
    type: ScheduleType,
    routeIdOrServiceId: string,
    scheduledStartAt: string
  ) => {
    setLoading(true);
    
    // Simular delay de API
    setTimeout(() => {
      const newSchedule: ScheduleItem = {
        id: `schedule-${Date.now()}`,
        type,
        ...(type === "route"
          ? {
              routeId: routeIdOrServiceId,
              route: mockRoutes.find((r) => r.id === routeIdOrServiceId),
            }
          : {
              serviceId: routeIdOrServiceId,
              service: mockServices.find((s) => s.id === routeIdOrServiceId),
            }),
        scheduledStartAt,
        duration:
          type === "route"
            ? mockRoutes.find((r) => r.id === routeIdOrServiceId)?.duration || 0
            : mockServices.find((s) => s.id === routeIdOrServiceId)?.duration || 0,
      };
      
      setSchedules((prev) => [...prev, newSchedule]);
      setShowAddModal(false);
      setAddDefaultDateKey(undefined);
      setAddDefaultSlotMin(undefined);
      setLoading(false);
    }, 500);
  };
  
  const handleRemoveSchedule = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  };
  
  const handleMoveSchedule = (
    scheduleId: string,
    dateKey: string,
    slotMin: number
  ) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s;
        
        const [y, m, d] = dateKey.split("-").map(Number);
        const h = Math.floor(slotMin / 60);
        const min = slotMin % 60;
        const newStartAt = `${dateKey}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000-03:00`;
        
        return { ...s, scheduledStartAt: newStartAt };
      })
    );
  };
  
  const handleAddScheduleClick = (
    type: ScheduleType,
    dateKey: string,
    slotMin: number
  ) => {
    setAddDefaultType(type);
    setAddDefaultDateKey(dateKey);
    setAddDefaultSlotMin(slotMin);
    setShowAddModal(true);
  };
  
  const handleAutoGenerate = (options: AutoGenerateOptions) => {
    setLoading(true);
    
    // Simular geração automática
    setTimeout(() => {
      const newSchedules: ScheduleItem[] = [];
      const startDate = new Date(options.startDate);
      const endDate = new Date(options.endDate);
      
      // Gerar agendamentos baseados em periodicidade dos serviços
      mockServices.forEach((service) => {
        if (!service.periodDays) return;
        
        let currentDate = new Date(
          service.lastExecutionDate || options.startDate
        );
        
        // Avançar até a data de início se necessário
        while (currentDate < startDate) {
          currentDate = new Date(
            currentDate.getTime() + service.periodDays * 24 * 60 * 60 * 1000
          );
        }
        
        // Gerar agendamentos até a data de fim
        while (currentDate <= endDate) {
          // Verificar se é dia útil (simplificado - apenas segunda a sexta)
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dateKey = currentDate.toISOString().split("T")[0];
            const scheduledStartAt = `${dateKey}T08:00:00.000-03:00`;
            
            newSchedules.push({
              id: `auto-${service.id}-${dateKey}`,
              type: "service",
              serviceId: service.id,
              service,
              scheduledStartAt,
              duration: service.duration,
            });
          }
          
          currentDate = new Date(
            currentDate.getTime() + service.periodDays * 24 * 60 * 60 * 1000
          );
        }
      });
      
      setSchedules((prev) => [...prev, ...newSchedules]);
      setShowAutoGenerateModal(false);
      setLoading(false);
      
      alert(
        `Planejamento gerado com sucesso! ${newSchedules.length} agendamentos criados.`
      );
    }, 1500);
  };
  
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden -m-6 lg:-m-8">
      {/* Header fixo */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Planejamento Avançado
            </h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Gerencie rotas e serviços com distribuição automática e indicadores de carga
            </p>
          </div>
          <div className="flex items-center gap-2">
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
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <PlanningToolbar
          currentDate={currentDate}
          view={viewMode}
          onNavigate={handleNavigate}
          onViewChange={handleViewChange}
        />
      </div>

      {/* Área do calendário - ocupa o resto da tela */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "day" ? (
          <AdvancedDayView
            schedules={schedules}
            currentDate={currentDate}
            companySchedule={mockCompanySchedule}
            routes={mockRoutes}
            services={mockServices}
            onAddSchedule={handleAddScheduleClick}
            onRemoveSchedule={handleRemoveSchedule}
            onMoveSchedule={handleMoveSchedule}
          />
        ) : viewMode === "week" ? (
          <ImprovedWeekView
            schedules={schedules}
            currentDate={currentDate}
            companySchedule={mockCompanySchedule}
            routes={mockRoutes}
            services={mockServices}
            onAddSchedule={handleAddScheduleClick}
            onRemoveSchedule={handleRemoveSchedule}
            onMoveSchedule={handleMoveSchedule}
          />
        ) : (
          <AdvancedMonthlyCalendar
            indicators={indicators}
            onDateClick={(dateKey) => {
              // Ao clicar em uma data no calendário mensal, mudar para diária e focar naquela data
              const date = new Date(dateKey);
              setCurrentDate(startOfDay(date));
              setViewMode("day");
            }}
            onMonthChange={(date) => {
              // Atualizar a data atual para recalcular indicadores
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
        routes={mockRoutes}
        services={mockServices}
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
