"use client";

import { useApiContext } from "@/context/ApiContext";
import type { EquipmentFromApi } from "@/lib/equipment-types";
import {
  getWorkOrderStatusDisplay,
  WORK_ORDER_VARIANT_CLASSES,
} from "@/lib/work-order-status";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface HistoryTabProps {
  equipment: EquipmentFromApi | null;
}

/** Campos da WO retornados pela API — estendido com campos extras para o histórico. */
interface HistoryWorkOrder {
  id: string;
  code?: number;
  status: string;
  createdAt?: string | null;
  scheduledAt: string | null;
  executedAt: string | null;
  completedAt: string | null;
  cipServiceId: string | null;
  routeId: string | null;
  visibilityMode?: "all_with_team_role" | "assigned_workers";
  assignedWorkerIds?: string[];
  assignedWorkers?: Array<{ id: string; name: string }>;
  route?: { id: string; name: string; code: string } | null;
  cipService?: {
    id?: string;
    serviceModel?: { name?: string } | null;
    cip?: {
      subset?: { set?: { equipment?: { name?: string; tag?: string } } };
    } | null;
    cancellationReason?: string | null;
    cancellationReasonName?: string | null;
  } | null;
  cipServices?: Array<{
    id?: string;
    serviceModel?: { name?: string } | null;
    cip?: {
      subset?: { set?: { equipment?: { name?: string; tag?: string } } };
    } | null;
    cancellationReason?: string | null;
    cancellationReasonName?: string | null;
  }>;
}

/** Extrai todos os cipService IDs do equipamento (sets → subsets → cips → cipServices). */
function collectCipServiceIds(equipment: EquipmentFromApi): Set<string> {
  const ids = new Set<string>();
  for (const set of equipment.sets ?? []) {
    for (const subset of set.subsets ?? []) {
      for (const cip of subset.cips ?? []) {
        for (const cs of cip.cipServices ?? []) {
          ids.add(cs.id);
        }
      }
    }
  }
  return ids;
}

/** Cria mapa cipServiceId → nome do serviço para exibir na listagem. */
function buildServiceNameMap(
  equipment: EquipmentFromApi,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const set of equipment.sets ?? []) {
    for (const subset of set.subsets ?? []) {
      for (const cip of subset.cips ?? []) {
        for (const cs of cip.cipServices ?? []) {
          const name = cs.serviceModel?.name ?? "Serviço";
          map.set(cs.id, `${name} — ${cip.name}`);
        }
      }
    }
  }
  return map;
}

/** Formata duração em minutos para texto legível. */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Retorna lista de textos de problema(s) de uma WO. */
function getProblems(wo: HistoryWorkOrder): string[] {
  const problems: string[] = [];
  const add = (
    reason: string | null | undefined,
    name: string | null | undefined,
  ) => {
    const text = name || reason;
    if (text && !problems.includes(text)) problems.push(text);
  };
  if (wo.cipService) {
    add(wo.cipService.cancellationReason, wo.cipService.cancellationReasonName);
  }
  (wo.cipServices ?? []).forEach((s) => {
    add(s.cancellationReason, s.cancellationReasonName);
  });
  return problems;
}

const fmtDate = (iso: string | null | undefined) =>
  iso
    ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "—";

type SortField = "code" | "scheduledAt" | "status" | "service";
type SortDir = "asc" | "desc";

export function HistoryTab({ equipment }: HistoryTabProps) {
  const { GetAPI } = useApiContext();
  const [workOrders, setWorkOrders] = useState<HistoryWorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("scheduledAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cipServiceIds = useMemo(
    () => (equipment ? collectCipServiceIds(equipment) : new Set<string>()),
    [equipment],
  );

  const serviceNameMap = useMemo(
    () =>
      equipment
        ? buildServiceNameMap(equipment)
        : new Map<string, string>(),
    [equipment],
  );

  const fetchWorkOrders = useCallback(async () => {
    if (!equipment?.companyId || cipServiceIds.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await GetAPI(
        `/work-order/company/${equipment.companyId}`,
        true,
      );
      if (res.status === 200 && res.body?.workOrders) {
        const all = res.body.workOrders as HistoryWorkOrder[];
        const filtered = all.filter((wo) => {
          if (wo.cipServiceId && cipServiceIds.has(wo.cipServiceId)) return true;
          if (wo.cipService?.id && cipServiceIds.has(wo.cipService.id))
            return true;
          if (wo.cipServices?.some((cs) => cs.id && cipServiceIds.has(cs.id)))
            return true;
          return false;
        });
        setWorkOrders(filtered);
      } else {
        setError("Não foi possível carregar as ordens de serviço.");
      }
    } catch {
      setError("Erro ao buscar ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }, [equipment?.companyId, cipServiceIds, GetAPI]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    workOrders.forEach((wo) => set.add(wo.status));
    return Array.from(set).sort();
  }, [workOrders]);

  const getServiceName = (wo: HistoryWorkOrder): string => {
    if (wo.cipServiceId && serviceNameMap.has(wo.cipServiceId))
      return serviceNameMap.get(wo.cipServiceId)!;
    if (wo.cipService?.id && serviceNameMap.has(wo.cipService.id))
      return serviceNameMap.get(wo.cipService.id)!;
    return wo.cipService?.serviceModel?.name ?? "Serviço";
  };

  const getDuration = (wo: HistoryWorkOrder): string | null => {
    if (wo.executedAt && wo.completedAt) {
      const mins = differenceInMinutes(
        new Date(wo.completedAt),
        new Date(wo.executedAt),
      );
      return formatDuration(mins);
    }
    return null;
  };

  const displayed = useMemo(() => {
    const list =
      statusFilter === "all"
        ? [...workOrders]
        : workOrders.filter((wo) => wo.status === statusFilter);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "scheduledAt") {
        const da = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const db = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        cmp = da - db;
      } else if (sortField === "code") {
        cmp = (a.code ?? 0) - (b.code ?? 0);
      } else if (sortField === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === "service") {
        cmp = getServiceName(a).localeCompare(getServiceName(b));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [workOrders, statusFilter, sortField, sortDir, serviceNameMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortIcon = (field: SortField) =>
    sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  if (!equipment) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">Carregando equipamento…</p>
      </div>
    );
  }

  if (cipServiceIds.size === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Nenhum serviço cadastrado
        </h3>
        <p className="text-slate-500">
          Este equipamento não possui serviços vinculados para exibir histórico.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" />
        <span className="text-slate-500">Carregando histórico…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-700">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Todos ({workOrders.length})</option>
          {statuses.map((s) => {
            const { label } = getWorkOrderStatusDisplay(s);
            const count = workOrders.filter((wo) => wo.status === s).length;
            return (
              <option key={s} value={s}>
                {label} ({count})
              </option>
            );
          })}
        </select>
        <span className="ml-auto text-sm text-slate-500">
          {displayed.length}{" "}
          {displayed.length === 1 ? "ordem" : "ordens"} encontrada(s)
        </span>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Nenhuma ordem de serviço
          </h3>
          <p className="text-slate-500">
            {statusFilter === "all"
              ? "Nenhuma ordem de serviço foi emitida para os serviços deste equipamento."
              : "Nenhuma ordem de serviço encontrada com o filtro selecionado."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="w-8 px-2 py-3" />
                  <th
                    className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-slate-700"
                    onClick={() => handleSort("code")}
                  >
                    Código{sortIcon("code")}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-slate-700"
                    onClick={() => handleSort("service")}
                  >
                    Serviço{sortIcon("service")}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-slate-700"
                    onClick={() => handleSort("status")}
                  >
                    Status{sortIcon("status")}
                  </th>
                  <th
                    className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-slate-700"
                    onClick={() => handleSort("scheduledAt")}
                  >
                    Agendada{sortIcon("scheduledAt")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">Concluída</th>
                  <th className="whitespace-nowrap px-4 py-3">Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((wo) => {
                  const { label, variant } = getWorkOrderStatusDisplay(
                    wo.status,
                  );
                  const cls = WORK_ORDER_VARIANT_CLASSES[variant];
                  const isExpanded = expandedId === wo.id;
                  const problems = getProblems(wo);
                  const duration = getDuration(wo);

                  return (
                    <Fragment key={wo.id}>
                      <tr
                        className="group cursor-pointer hover:bg-slate-50/50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : wo.id)
                        }
                      >
                        {/* Expand icon */}
                        <td className="px-2 py-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </td>

                        {/* Código */}
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                          {wo.code
                            ? `OS ${String(wo.code).padStart(8, "0")}`
                            : wo.id.slice(0, 8)}
                        </td>

                        {/* Serviço + Rota */}
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            {getServiceName(wo)}
                          </span>
                          {wo.route && (
                            <span className="ml-2 whitespace-nowrap text-xs text-slate-500">
                              Rota: {wo.route.code} – {wo.route.name}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cls.bg} ${cls.text} ${cls.border}`}
                          >
                            {label}
                          </span>
                        </td>

                        {/* Agendada */}
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {fmtDate(wo.scheduledAt)}
                        </td>

                        {/* Concluída */}
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {fmtDate(wo.completedAt)}
                        </td>

                        {/* Duração */}
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {duration ?? "—"}
                        </td>
                      </tr>

                      {/* Linha expandida (detalhes) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {/* Datas */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                  Datas
                                </h4>
                                <dl className="space-y-1 text-sm">
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">Criada:</dt>
                                    <dd className="text-slate-700">
                                      {fmtDate(wo.createdAt)}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">Agendada:</dt>
                                    <dd className="text-slate-700">
                                      {fmtDate(wo.scheduledAt)}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">
                                      Início execução:
                                    </dt>
                                    <dd className="text-slate-700">
                                      {fmtDate(wo.executedAt)}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">
                                      Finalizada:
                                    </dt>
                                    <dd className="text-slate-700">
                                      {fmtDate(wo.completedAt)}
                                    </dd>
                                  </div>
                                  {duration && (
                                    <div className="flex gap-2">
                                      <dt className="text-slate-500">
                                        Tempo de execução:
                                      </dt>
                                      <dd className="font-medium text-slate-700">
                                        {duration}
                                      </dd>
                                    </div>
                                  )}
                                </dl>
                              </div>

                              {/* Vínculo */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                  Vínculo
                                </h4>
                                <dl className="space-y-1 text-sm">
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">
                                      CipService ID:
                                    </dt>
                                    <dd className="font-mono text-xs text-slate-600">
                                      {wo.cipServiceId
                                        ? wo.cipServiceId.slice(0, 8) + "…"
                                        : "—"}
                                    </dd>
                                  </div>
                                  {wo.route && (
                                    <div className="flex gap-2">
                                      <dt className="text-slate-500">Rota:</dt>
                                      <dd className="text-slate-700">
                                        {wo.route.code} – {wo.route.name}
                                      </dd>
                                    </div>
                                  )}
                                </dl>
                              </div>

                              {/* Colaboradores */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                  Colaboradores
                                </h4>
                                {wo.assignedWorkers?.length ? (
                                  <ul className="space-y-0.5 text-sm text-slate-700">
                                    {wo.assignedWorkers.map((w) => (
                                      <li key={w.id}>• {w.name}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-slate-400">
                                    Nenhum colaborador atribuído
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Problemas */}
                            {problems.length > 0 && (
                              <div className="mt-4 rounded border border-amber-200 bg-amber-50/80 p-3">
                                <p className="text-xs font-semibold text-amber-800">
                                  Problema(s) relatado(s):
                                </p>
                                <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
                                  {problems.map((text, i) => (
                                    <li key={i}>{text}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
