"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WorkOrderSummary {
  id: string;
  status: string;
  scheduledAt: string | null;
  executedAt: string | null;
  completedAt: string | null;
  cipServiceId: string;
  routeId: string | null;
  route?: { id: string; name: string; code: string } | null;
  cipService?: {
    serviceModel?: { name?: string } | null;
    cip?: { subset?: { set?: { equipment?: { name?: string; tag?: string } } } } | null;
  } | null;
}

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  scheduled: "Agendada",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

interface ViewWorkOrdersModalProps {
  open: boolean;
  onClose: () => void;
  workOrders: WorkOrderSummary[];
}

export function ViewWorkOrdersModal({
  open,
  onClose,
  workOrders,
}: ViewWorkOrdersModalProps) {
  if (!open) return null;

  const label = workOrders.length === 1 ? "Ordem de serviço" : "Ordens de serviço";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg max-h-[80vh] flex flex-col">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          {label} emitida(s)
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3">
          {workOrders.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma ordem de serviço.</p>
          ) : (
            workOrders.map((wo) => {
              const serviceName =
                wo.cipService?.serviceModel?.name ||
                wo.cipService?.cip?.subset?.set?.equipment?.name ||
                wo.cipService?.cip?.subset?.set?.equipment?.tag ||
                "Serviço";
              const status = statusLabel[wo.status] || wo.status;
              return (
                <div
                  key={wo.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                >
                  <p className="font-medium text-slate-900">
                    {serviceName}
                    {wo.route && (
                      <span className="ml-2 text-slate-500">
                        · {wo.route.code} – {wo.route.name}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-slate-600">
                    Status: <span className="font-medium">{status}</span>
                  </p>
                  {wo.scheduledAt && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Agendada: {format(new Date(wo.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  {wo.completedAt && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Concluída: {format(new Date(wo.completedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400 font-mono">ID: {wo.id.slice(0, 8)}…</p>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
