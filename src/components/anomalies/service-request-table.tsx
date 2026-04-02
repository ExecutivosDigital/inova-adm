"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServiceRequestFromApi } from "@/lib/service-request-types";
import {
  getServiceRequestStatusLabel,
  getServiceRequestStatusVariant,
} from "@/lib/service-request-types";
import { AlertTriangle, Eye, Loader2 } from "lucide-react";

interface ServiceRequestTableProps {
  items: ServiceRequestFromApi[];
  loading: boolean;
  error: string | null;
  search: string;
  onViewDetail: (item: ServiceRequestFromApi) => void;
}

export function ServiceRequestTable({
  items,
  loading,
  error,
  search,
  onViewDetail,
}: ServiceRequestTableProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 p-8 text-center">
        <AlertTriangle className="mb-2 h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-white p-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-3 text-sm text-slate-500">Carregando...</span>
      </div>
    );
  }

  const filtered = items.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const equipment =
      item.workOrderCipService.cipService.cip.subset.set.equipment;
    const reason =
      item.workOrderCipService.cancellationReasonRef?.name ??
      item.workOrderCipService.cancellationReason ??
      "";
    const serviceName =
      item.workOrderCipService.cipService.serviceModel?.name ?? "";
    const woCode = String(item.workOrderCipService.workOrder.code);
    const workers = item.workOrderCipService.workOrder.workOrderWorkers
      .map((w) => w.worker.name)
      .join(" ");

    return (
      equipment.tag.toLowerCase().includes(term) ||
      (equipment.name ?? "").toLowerCase().includes(term) ||
      reason.toLowerCase().includes(term) ||
      serviceName.toLowerCase().includes(term) ||
      woCode.includes(term) ||
      workers.toLowerCase().includes(term)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-12 text-center">
        <AlertTriangle className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">
          Nenhuma solicitação encontrada
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {search
            ? "Tente ajustar os filtros de busca"
            : "As solicitações aparecerão aqui quando anomalias forem reportadas"}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Código</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Equipamento</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => {
            const equipment =
              item.workOrderCipService.cipService.cip.subset.set.equipment;
            const reason =
              item.workOrderCipService.cancellationReasonRef?.name ??
              item.workOrderCipService.cancellationReason ??
              "—";
            const serviceName =
              item.workOrderCipService.cipService.serviceModel?.name ?? "—";
            const workers = item.workOrderCipService.workOrder.workOrderWorkers
              .map((w) => w.worker.name)
              .join(", ");

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-slate-900">
                  #{item.code}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-700">
                    OS #{item.workOrderCipService.workOrder.code}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {equipment.tag}
                    </p>
                    {equipment.name && (
                      <p className="text-xs text-slate-400">
                        {equipment.name}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {serviceName}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{reason}</span>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {workers || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getServiceRequestStatusVariant(item.status)}
                  >
                    {getServiceRequestStatusLabel(item.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onViewDetail(item)}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
