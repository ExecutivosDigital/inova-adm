"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

const MONTH_NAMES = [
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

export interface MonthSummary {
  scheduledHours: number;
  availableHours: number;
  utilization: number;
  status: "low" | "medium" | "high";
  routeCount: number;
  serviceCount: number;
}

interface AdvancedAnnualViewProps {
  /** Data que define o ano exibido (qualquer dia do ano). */
  displayDate: Date;
  /** Resumo por mês (12 itens): horas agendadas/disponíveis, utilização, status, contagem de rotas e serviços. */
  monthlySummaries?: (MonthSummary | null)[] | null;
  /** True enquanto os indicadores do ano estão sendo carregados. */
  loadingYearWorkload?: boolean;
  /** Chamado ao clicar em um mês: recebe o primeiro dia desse mês. */
  onMonthClick?: (firstDayOfMonth: Date) => void;
}

function getStatusColor(status: MonthSummary["status"] | null) {
  if (!status) return "border-blue-200 bg-blue-50/80";
  switch (status) {
    case "low":
      return "border-green-200 bg-green-50/80";
    case "medium":
      return "border-yellow-200 bg-yellow-50/80";
    case "high":
      return "border-red-200 bg-red-50/80";
    default:
      return "border-blue-200 bg-blue-50/80";
  }
}

function getStatusDot(status: MonthSummary["status"] | null) {
  if (!status) return "bg-blue-500";
  switch (status) {
    case "low":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-red-500";
    default:
      return "bg-blue-500";
  }
}

export function AdvancedAnnualView({
  displayDate,
  monthlySummaries,
  loadingYearWorkload = false,
  onMonthClick,
}: AdvancedAnnualViewProps) {
  const year = displayDate.getFullYear();
  const today = useMemo(() => new Date(), []);

  const months = useMemo(() => {
    return MONTH_NAMES.map((name, index) => {
      const monthDate = new Date(year, index, 1);
      const isCurrentMonth =
        today.getFullYear() === year && today.getMonth() === index;
      const summary = monthlySummaries?.[index] ?? null;
      return { name, monthDate, isCurrentMonth, summary };
    });
  }, [year, today, monthlySummaries]);

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-center text-xl font-semibold text-slate-900">
          {year}
        </h2>

        {loadingYearWorkload && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-4 text-sm text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando indicadores do ano...
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map(({ name, monthDate, isCurrentMonth, summary }) => (
            <button
              key={name}
              type="button"
              onClick={() => onMonthClick?.(monthDate)}
              className={cn(
                "flex min-h-[140px] flex-col rounded-lg border-2 px-3 py-3 text-left transition-all",
                "hover:border-primary/50 hover:shadow-md",
                getStatusColor(summary?.status ?? null),
                isCurrentMonth && "ring-2 ring-primary ring-offset-2",
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900">{name}</span>
                {summary && (
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      getStatusDot(summary.status),
                    )}
                    title={
                      summary.status === "high"
                        ? "Sobrecarga"
                        : summary.status === "medium"
                          ? "Carga moderada"
                          : "Carga adequada"
                    }
                  />
                )}
              </div>

              {loadingYearWorkload && !summary ? (
                <div className="flex flex-1 items-center text-xs text-slate-400">
                  Carregando...
                </div>
              ) : summary ? (
                <div className="flex flex-1 flex-col gap-1 text-xs text-slate-700">
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500">Agendado:</span>
                    <span className="font-medium">
                      {summary.scheduledHours.toFixed(1)} h
                    </span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500">Disponível:</span>
                    <span className="font-medium">
                      {summary.availableHours.toFixed(1)} h
                    </span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500">Utilização:</span>
                    <span className="font-medium">
                      {summary.utilization.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 border-t border-slate-200/80 pt-1.5">
                    <span className="text-slate-500">
                      {summary.routeCount} rota
                      {summary.routeCount !== 1 ? "s" : ""}
                      {" · "}
                      {summary.serviceCount} serviço
                      {summary.serviceCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center text-xs text-slate-400">
                  Sem dados
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda (igual à visão mensal) */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
          <span>Período vazio</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          <span>Carga adequada (&lt; 80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
          <span>Carga moderada (80–95%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          <span>Sobrecarga (&gt; 95%)</span>
        </div>
      </div>
    </div>
  );
}
