"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface ShiftPeriodModalProps {
  open: boolean;
  onClose: () => void;
  onShift: (options: {
    periodStart: string;
    periodEnd: string;
    shiftWorkDays: number;
    direction: "forward" | "backward";
  }) => void;
  loading?: boolean;
}

export function ShiftPeriodModal({
  open,
  onClose,
  onShift,
  loading = false,
}: ShiftPeriodModalProps) {
  const [periodStart, setPeriodStart] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split("T")[0];
  });
  const [shiftWorkDays, setShiftWorkDays] = useState(5);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onShift({ periodStart, periodEnd, shiftWorkDays, direction });
    setShowConfirm(false);
  };

  if (!open) return null;

  const daysDiff = Math.ceil(
    (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="my-4 w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-slate-900">
              Deslocar Período
            </h3>
          </div>

          <p className="mb-4 text-sm text-slate-600">
            Move todos os agendamentos do período selecionado para uma nova faixa de datas,
            preservando a ordem relativa. Agendamentos com OS emitida serão ignorados.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Início do período
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fim do período
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-1 block text-sm font-medium text-slate-700">
                Direção
              </legend>
              <div className="flex gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-slate-200 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="direction"
                    value="forward"
                    checked={direction === "forward"}
                    onChange={() => setDirection("forward")}
                    className="shrink-0"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">Adiar</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Mover para frente</span>
                  </span>
                </label>
                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-slate-200 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="direction"
                    value="backward"
                    checked={direction === "backward"}
                    onChange={() => setDirection("backward")}
                    className="shrink-0"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">Antecipar</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Mover para trás</span>
                  </span>
                </label>
              </div>
            </fieldset>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Dias úteis de deslocamento
              </label>
              <input
                type="number"
                min={1}
                value={shiftWorkDays}
                onChange={(e) => setShiftWorkDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Apenas dias úteis da empresa são contados.
              </p>
            </div>

            {daysDiff > 0 && (
              <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">
                <p>
                  Período selecionado: <strong>{daysDiff + 1} dia(s)</strong> •
                  Deslocamento: <strong>{shiftWorkDays} dia(s) útil(eis)</strong> para{" "}
                  <strong>{direction === "forward" ? "frente" : "trás"}</strong>
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || daysDiff < 0 || shiftWorkDays < 1}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Movendo...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-4 w-4" />
                    Deslocar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => !open && setShowConfirm(false)}
        title="Confirmar deslocamento"
        description={`Os agendamentos entre ${periodStart} e ${periodEnd} serão movidos ${shiftWorkDays} dia(s) útil(eis) para ${direction === "forward" ? "frente" : "trás"}. Agendamentos com OS emitida serão ignorados. Deseja continuar?`}
        confirmLabel="Confirmar"
        onConfirm={handleConfirm}
      />
    </div>
  );
}
