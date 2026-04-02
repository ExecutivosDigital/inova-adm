"use client";

import { Badge } from "@/components/ui/badge";
import type {
  ServiceRequestFromApi,
  ServiceRequestStatus,
} from "@/lib/service-request-types";
import {
  getServiceRequestStatusLabel,
  getServiceRequestStatusVariant,
  SERVICE_REQUEST_STATUS_LABELS,
} from "@/lib/service-request-types";
import { X } from "lucide-react";
import { useState } from "react";

interface ServiceRequestDetailDialogProps {
  item: ServiceRequestFromApi | null;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: ServiceRequestStatus,
    resolution?: string,
  ) => Promise<void>;
}

export function ServiceRequestDetailDialog({
  item,
  onClose,
  onUpdateStatus,
}: ServiceRequestDetailDialogProps) {
  const [newStatus, setNewStatus] = useState<ServiceRequestStatus | "">("");
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const equipment =
    item.workOrderCipService.cipService.cip.subset.set.equipment;
  const reason =
    item.workOrderCipService.cancellationReasonRef?.name ??
    item.workOrderCipService.cancellationReason ??
    "Não informado";
  const serviceName =
    item.workOrderCipService.cipService.serviceModel?.name ?? "—";
  const workers = item.workOrderCipService.workOrder.workOrderWorkers
    .map((w) => w.worker.name)
    .join(", ");

  const handleSave = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await onUpdateStatus(
        item.id,
        newStatus,
        resolution.trim() || undefined,
      );
      setNewStatus("");
      setResolution("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Solicitação #{item.code}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Status atual */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Status:</span>
            <Badge variant={getServiceRequestStatusVariant(item.status)}>
              {getServiceRequestStatusLabel(item.status)}
            </Badge>
          </div>

          {/* Informações da anomalia */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Anomalia Reportada
            </h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Motivo</dt>
                <dd className="font-medium text-slate-900">{reason}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Data</dt>
                <dd className="text-slate-700">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </dd>
              </div>
              {item.description && (
                <div>
                  <dt className="mb-1 text-slate-500">Descrição</dt>
                  <dd className="rounded-md bg-slate-50 p-2 text-slate-700">
                    {item.description}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Informações da OS */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Ordem de Serviço
            </h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">OS</dt>
                <dd className="font-medium text-slate-900">
                  #{item.workOrderCipService.workOrder.code}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Serviço</dt>
                <dd className="text-slate-700">{serviceName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Equipamento</dt>
                <dd className="text-slate-700">
                  {equipment.tag}
                  {equipment.name ? ` — ${equipment.name}` : ""}
                </dd>
              </div>
              {equipment.sector && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Setor</dt>
                  <dd className="text-slate-700">{equipment.sector.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Técnico(s)</dt>
                <dd className="text-slate-700">{workers || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Resolução existente */}
          {item.resolution && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-800">
                Resolução
              </h3>
              <p className="text-sm text-green-700">{item.resolution}</p>
              {item.resolvedAt && (
                <p className="mt-2 text-xs text-green-600">
                  Resolvida em{" "}
                  {new Date(item.resolvedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          )}

          {/* Alterar status */}
          {item.status !== "completed" && item.status !== "cancelled" && (
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Atualizar Status
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Novo status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as ServiceRequestStatus)
                    }
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Selecionar...</option>
                    {(
                      Object.entries(SERVICE_REQUEST_STATUS_LABELS) as [
                        ServiceRequestStatus,
                        string,
                      ][]
                    )
                      .filter(([key]) => key !== item.status)
                      .map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Resolução (opcional)
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                    placeholder="Descreva a resolução ou ação tomada..."
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={!newStatus || saving}
                  className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
