"use client";

import type { Route } from "@/lib/route-types";
import { Route as RouteIcon, X } from "lucide-react";
import { useState } from "react";

interface RouteSelectModalProps {
  open: boolean;
  onClose: () => void;
  routes: Route[];
  selectedServiceIds: string[];
  onConfirm: (routeId: string) => Promise<void>;
}

export function RouteSelectModal({
  open,
  onClose,
  routes,
  selectedServiceIds,
  onConfirm,
}: RouteSelectModalProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!selectedRouteId || selectedServiceIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(selectedRouteId);
      setSelectedRouteId(null);
      onClose();
    } catch (e) {
      setError("Erro ao adicionar à rota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Adicionar a rota existente
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-600">
            {selectedServiceIds.length} serviço(s) selecionado(s). Escolha a rota para adicionar:
          </p>

          {routes.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma rota cadastrada.</p>
          ) : (
            <ul className="space-y-2">
              {routes.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                      selectedRouteId === r.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <RouteIcon className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{r.code} – {r.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !selectedRouteId || selectedServiceIds.length === 0}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
