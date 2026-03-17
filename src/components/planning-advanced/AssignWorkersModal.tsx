"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import type { ScheduleItem } from "@/lib/planning-advanced-types";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useApiContext } from "@/context/ApiContext";

interface AssignWorkersModalProps {
  open: boolean;
  onClose: () => void;
  schedule: ScheduleItem | null;
  companyId: string | null;
  eligibleWorkerRoleIds: string[];
  /** Nomes das funções (workerRoles) do time da rota/serviço, para exibição */
  eligibleWorkerRoleNames?: string[];
  onSaved: () => void;
}

export function AssignWorkersModal({
  open,
  onClose,
  schedule,
  companyId,
  eligibleWorkerRoleIds,
  eligibleWorkerRoleNames = [],
  onSaved,
}: AssignWorkersModalProps) {
  const apiContext = useApiContext();
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [workers, setWorkers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [saving, setSaving] = useState(false);

  const canAssign = eligibleWorkerRoleIds.length > 0 && !!companyId && !!schedule;

  const fetchWorkers = useCallback(async () => {
    if (!companyId || eligibleWorkerRoleIds.length === 0) return;
    setLoadingWorkers(true);
    try {
      const ids = eligibleWorkerRoleIds.join(",");
      const res = await apiContext.GetAPI(
        `/workers?companyId=${encodeURIComponent(companyId)}&workerRoleIds=${encodeURIComponent(ids)}`,
        true
      );
      if (res.status === 200 && res.body?.workers) {
        const list = (res.body.workers as Array<{ id: string; name: string }>).map((w) => ({
          id: w.id,
          name: w.name,
        }));
        setWorkers(list);
      } else {
        setWorkers([]);
      }
    } catch {
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  }, [companyId, eligibleWorkerRoleIds, apiContext]);

  useEffect(() => {
    if (open && schedule) {
      setSelectedWorkerIds(schedule.assignedWorkerIds ?? []);
      if (canAssign) fetchWorkers();
    }
  }, [open, schedule, canAssign, fetchWorkers]);

  const handleToggleWorker = useCallback((id: string, checked: boolean) => {
    setSelectedWorkerIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!schedule || !companyId) return;
    setSaving(true);
    try {
      if (schedule.type === "service") {
        await apiContext.PutAPI(
          `/planning/service-schedule/${schedule.id}/workers?companyId=${encodeURIComponent(companyId)}`,
          { workerIds: selectedWorkerIds },
          true
        );
      } else {
        await apiContext.PutAPI(
          `/route/schedule/${schedule.id}/workers?companyId=${encodeURIComponent(companyId)}`,
          { workerIds: selectedWorkerIds },
          true
        );
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [schedule, companyId, selectedWorkerIds, apiContext, onSaved, onClose]);

  if (!open) return null;

  const isRoute = schedule?.type === "route";
  const displayName = schedule
    ? isRoute
      ? `${schedule.route?.code} – ${schedule.route?.name}`
      : `${schedule.service?.name} (${schedule.service?.equipmentName})`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Users className="h-5 w-5 text-primary" />
          Atribuir colaboradores
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Selecione os colaboradores que realizarão este agendamento. Deixe vazio para que todos os colaboradores com a função do time possam ver a ordem de serviço quando emitida.
        </p>
        {schedule && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">{displayName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {isRoute ? "Rota" : "Serviço"} · {new Date(schedule.scheduledStartAt).toLocaleString("pt-BR")}
            </p>
            {eligibleWorkerRoleNames.length > 0 && (
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Funções do time:</span>{" "}
                {eligibleWorkerRoleNames.join(", ")}
              </p>
            )}
          </div>
        )}

        {!canAssign ? (
          <p className="mb-4 text-sm text-amber-700">
            Configure o time e as funções do serviço para poder atribuir colaboradores.
          </p>
        ) : (
          <div className="mb-6">
            {loadingWorkers ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando colaboradores...
              </p>
            ) : workers.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum colaborador encontrado com as funções do time.
              </p>
            ) : (
              <MultiSelectDropdown
                label="Colaboradores"
                items={workers}
                selectedIds={selectedWorkerIds}
                onToggle={handleToggleWorker}
                searchPlaceholder="Buscar colaborador..."
                listMaxHeight="12rem"
              />
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canAssign || loadingWorkers}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
