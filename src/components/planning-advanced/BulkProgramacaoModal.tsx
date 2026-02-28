"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ScheduleItem } from "@/lib/planning-advanced-types";

interface BulkProgramacaoModalProps {
  open: boolean;
  onClose: () => void;
  schedules: ScheduleItem[];
  onConfirm: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

export function BulkProgramacaoModal({
  open,
  onClose,
  schedules,
  onConfirm,
  loading = false,
}: BulkProgramacaoModalProps) {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2027-01-01");

  const summary = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate + "T23:59:59.999Z").getTime();
    let routeCount = 0;
    let serviceCount = 0;
    for (const s of schedules) {
      const t = new Date(s.scheduledStartAt).getTime();
      if (t >= start && t <= end) {
        if (s.type === "route") routeCount += 1;
        else serviceCount += 1;
      }
    }
    return { routeCount, serviceCount, total: routeCount + serviceCount };
  }, [schedules, startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (summary.total === 0) return;
    onConfirm(startDate, endDate);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Emitir ordens de serviço em lote
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Selecione o período. Todas as rotas e serviços planejados nesse intervalo terão ordens de serviço emitidas.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Data inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Data final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Resumo do período</p>
            <p className="mt-1">
              {summary.total} agendamento(s): {summary.routeCount} rota(s), {summary.serviceCount} serviço(s).
            </p>
            {summary.total > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Será emitida uma ou mais ordem(ns) de serviço por agendamento (cada ocorrência gera suas ordens).
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || summary.total === 0}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Emitindo...
                </span>
              ) : (
                "Emitir ordens de serviço"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
