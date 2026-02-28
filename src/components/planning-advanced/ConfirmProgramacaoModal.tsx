"use client";

import { Loader2, Route as RouteIcon, Wrench } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ScheduleItem } from "@/lib/planning-advanced-types";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

interface ConfirmProgramacaoModalProps {
  open: boolean;
  onClose: () => void;
  schedule: ScheduleItem | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmProgramacaoModal({
  open,
  onClose,
  schedule,
  onConfirm,
  loading = false,
}: ConfirmProgramacaoModalProps) {
  if (!open) return null;

  const isRoute = schedule?.type === "route";
  const displayName = schedule
    ? isRoute
      ? `${schedule.route?.code} – ${schedule.route?.name}`
      : `${schedule.service?.name} (${schedule.service?.equipmentName})`
    : "";
  const dateStr = schedule
    ? format(new Date(schedule.scheduledStartAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Confirmar programação
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Será emitida uma ou mais ordem(ns) de serviço para o agendamento abaixo.
        </p>
        {schedule && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              {isRoute ? (
                <RouteIcon className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Wrench className="h-5 w-5 shrink-0 text-green-600" />
              )}
              <div>
                <p className="font-medium text-slate-900">{displayName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Data/hora: {dateStr}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Duração: {formatDuration(schedule.duration)}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Emitindo...
              </span>
            ) : (
              "Confirmar e emitir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
