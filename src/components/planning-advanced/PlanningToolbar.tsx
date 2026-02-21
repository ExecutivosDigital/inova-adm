"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type PlanningView = "day" | "week" | "month";

interface PlanningToolbarProps {
  currentDate: Date;
  view: PlanningView;
  onNavigate: (action: "prev" | "next" | "today") => void;
  onViewChange: (view: PlanningView) => void;
}

const viewLabels: Record<PlanningView, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

export function PlanningToolbar({
  currentDate,
  view,
  onNavigate,
  onViewChange,
}: PlanningToolbarProps) {
  const getDateLabel = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
    if (view === "week") {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, "d", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Navegação */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onNavigate("prev")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white p-0 text-slate-700 transition-colors hover:bg-slate-50 sm:h-9 sm:w-9"
        >
          <ChevronLeft size={14} className="sm:h-4 sm:w-4" />
        </button>
        <button
          onClick={() => onNavigate("today")}
          className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:h-9 sm:px-3 sm:text-sm"
        >
          Hoje
        </button>
        <button
          onClick={() => onNavigate("next")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white p-0 text-slate-700 transition-colors hover:bg-slate-50 sm:h-9 sm:w-9"
        >
          <ChevronRight size={14} className="sm:h-4 sm:w-4" />
        </button>
        <span className="ml-2 text-sm font-semibold capitalize text-slate-800 sm:ml-4 sm:text-lg">
          {getDateLabel()}
        </span>
      </div>

      {/* Seleção de Visualização */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {(Object.keys(viewLabels) as PlanningView[]).map((v) => {
          return (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm",
                view === v
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {viewLabels[v]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
