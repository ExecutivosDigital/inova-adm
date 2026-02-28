"use client";

import type { WorkloadIndicator } from "@/lib/planning-advanced-types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface AdvancedMonthlyCalendarProps {
  /** Data que define o mês exibido (qualquer dia do mês). Controlado pelo pai para manter sincronia ao alternar visões. */
  displayDate: Date;
  indicators: WorkloadIndicator[];
  onDateClick?: (date: string) => void;
  onMonthChange?: (date: Date) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function AdvancedMonthlyCalendar({
  displayDate,
  indicators,
  onDateClick,
  onMonthChange,
}: AdvancedMonthlyCalendarProps) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth() + 1;
  
  const indicatorsMap = useMemo(() => {
    const map = new Map<string, WorkloadIndicator>();
    indicators.forEach((ind) => {
      map.set(ind.date, ind);
    });
    return map;
  }, [indicators]);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    
    // Preencher dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Adicionar todos os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [firstDayOfMonth, daysInMonth]);
  
  const goToPreviousMonth = () => {
    const newDate = new Date(year, month - 2, 1);
    onMonthChange?.(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(year, month, 1);
    onMonthChange?.(newDate);
  };

  const goToToday = () => {
    onMonthChange?.(new Date());
  };
  
  const getIndicatorForDay = (day: number | null): WorkloadIndicator | null => {
    if (day === null) return null;
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return indicatorsMap.get(dateKey) || null;
  };
  
  const getStatusColor = (status: WorkloadIndicator["status"] | null) => {
    if (!status) return "bg-blue-50 hover:bg-blue-100 border-blue-200";
    switch (status) {
      case "low":
        return "bg-green-100 hover:bg-green-200 border-green-300";
      case "medium":
        return "bg-yellow-100 hover:bg-yellow-200 border-yellow-300";
      case "high":
        return "bg-red-100 hover:bg-red-200 border-red-300";
      default:
        return "bg-blue-50 hover:bg-blue-100 border-blue-200";
    }
  };
  
  const getStatusIcon = (status: WorkloadIndicator["status"] | null) => {
    if (!status) return "🔵";
    switch (status) {
      case "low":
        return "🟢";
      case "medium":
        return "🟡";
      case "high":
        return "🔴";
      default:
        return "🔵";
    }
  };
  
  const today = new Date();
  const isToday = (day: number | null) => {
    if (day === null) return false;
    return (
      day === today.getDate() &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear()
    );
  };
  
  return (
    <div className="flex h-full flex-col  overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">
            {MONTHS[month - 1]} {year}
          </h2>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Hoje
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-blue-50 border border-blue-200"></span>
            <span className="text-slate-600">Período vazio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-green-100 border border-green-300"></span>
            <span className="text-slate-600">Carga adequada (&lt; 80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-yellow-100 border border-yellow-300"></span>
            <span className="text-slate-600">Carga moderada (80-95%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-red-100 border border-red-300"></span>
            <span className="text-slate-600">Sobrecarga (&gt; 95%)</span>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-7 gap-2">
          {/* Cabeçalho dos dias da semana */}
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-slate-700 py-2"
            >
              {day}
            </div>
          ))}
          
          {/* Dias do calendário */}
          {calendarDays.map((day, index) => {
            const indicator = getIndicatorForDay(day);
            // Dia vazio: sem indicador ou com 0 horas agendadas → azul
            const isEmptyDay = !indicator || indicator.scheduledHours === 0;
            const status = isEmptyDay ? null : indicator!.status;
            const isTodayDay = isToday(day);
            
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-[3/2] bg-slate-50 rounded border border-slate-100"
                />
              );
            }
            
            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            
            return (
              <button
                key={day}
                type="button"
                onClick={() => onDateClick?.(dateKey)}
                className={cn(
                  "aspect-[3/2] rounded border-2 transition-all relative overflow-hidden",
                  getStatusColor(status),
                  isTodayDay && "ring-2 ring-primary ring-offset-2",
                  indicator && "cursor-pointer hover:shadow-md"
                )}
                title={
                  indicator
                    ? `${dateKey}\nAgendado: ${indicator.scheduledHours}h\nDisponível: ${indicator.availableHours}h\nUtilização: ${indicator.utilization.toFixed(1)}%`
                    : dateKey
                }
              >
                <div className="flex flex-col items-center justify-center h-full p-1">
                  <div className="text-lg font-semibold text-slate-900">{day}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    <div className="font-medium">{getStatusIcon(status)}</div>
                    {indicator && indicator.scheduledHours > 0 && (
                      <div className="text-[10px] mt-0.5">
                        {indicator.scheduledHours.toFixed(1)}h
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Resumo do mês */}
      {indicators.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Resumo do Mês</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Total Agendado</div>
              <div className="text-lg font-semibold text-slate-900">
                {indicators
                  .reduce((sum, ind) => sum + ind.scheduledHours, 0)
                  .toFixed(1)}{" "}
                horas
              </div>
            </div>
            <div>
              <div className="text-slate-500">Total Disponível</div>
              <div className="text-lg font-semibold text-slate-900">
                {indicators
                  .reduce((sum, ind) => sum + ind.availableHours, 0)
                  .toFixed(1)}{" "}
                horas
              </div>
            </div>
            <div>
              <div className="text-slate-500">Utilização Média</div>
              <div className="text-lg font-semibold text-slate-900">
                {indicators.length > 0
                  ? (
                      indicators.reduce((sum, ind) => sum + ind.utilization, 0) /
                      indicators.length
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
