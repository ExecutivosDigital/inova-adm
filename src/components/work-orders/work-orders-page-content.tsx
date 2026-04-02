"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { PlanningRoutesFiltersPanel } from "@/components/planning-routes/PlanningRoutesFiltersPanel";
import type { FilterServicesPayload } from "@/lib/route-types";
import {
  getWorkOrderStatusDisplay,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_VARIANT_CLASSES,
} from "@/lib/work-order-status";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

/* ───────── Tipos ───────── */

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
      name?: string;
      subset?: {
        name?: string;
        set?: {
          name?: string;
          equipment?: { id?: string; name?: string; tag?: string };
        };
      };
    } | null;
    cancellationReason?: string | null;
    cancellationReasonName?: string | null;
  } | null;
  cipServices?: Array<{
    id?: string;
    serviceModel?: { name?: string } | null;
    cip?: {
      name?: string;
      subset?: {
        name?: string;
        set?: {
          name?: string;
          equipment?: { id?: string; name?: string; tag?: string };
        };
      };
    } | null;
    cancellationReason?: string | null;
    cancellationReasonName?: string | null;
  }>;
}

/* ───────── Helpers ───────── */

const fmtDate = (iso: string | null | undefined) =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getDuration(wo: HistoryWorkOrder): string | null {
  if (wo.executedAt && wo.completedAt) {
    const mins = differenceInMinutes(
      new Date(wo.completedAt),
      new Date(wo.executedAt),
    );
    return formatDuration(mins);
  }
  return null;
}

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

function getServiceLabel(wo: HistoryWorkOrder): string {
  const s = wo.cipService ?? wo.cipServices?.[0];
  return s?.serviceModel?.name ?? "Serviço";
}

function getEquipmentLabel(wo: HistoryWorkOrder): string {
  const s = wo.cipService ?? wo.cipServices?.[0];
  const eq = s?.cip?.subset?.set?.equipment;
  if (eq?.tag && eq?.name) return `${eq.tag} — ${eq.name}`;
  return eq?.tag ?? eq?.name ?? "";
}

function getCipLabel(wo: HistoryWorkOrder): string {
  const s = wo.cipService ?? wo.cipServices?.[0];
  return s?.cip?.name ?? "";
}

/* ───────── Status options ───────── */

const ALL_STATUSES = Object.keys(WORK_ORDER_STATUS_LABELS);

/* ───────── Sort ───────── */

type SortField = "code" | "scheduledAt" | "status" | "service" | "equipment";
type SortDir = "asc" | "desc";

/* ───────── Component ───────── */

export function WorkOrdersPageContent() {
  const { GetAPI, PostAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();

  // Data
  const [allWorkOrders, setAllWorkOrders] = useState<HistoryWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [serviceFilters, setServiceFilters] = useState<FilterServicesPayload>(
    {},
  );
  const [filteredCipServiceIds, setFilteredCipServiceIds] =
    useState<Set<string> | null>(null);
  const [serviceFiltersOpen, setServiceFiltersOpen] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>("scheduledAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Expand
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ───── Fetch all work orders ───── */

  const fetchWorkOrders = useCallback(async () => {
    if (!effectiveCompanyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await GetAPI(
        `/work-order/company/${effectiveCompanyId}`,
        true,
      );
      if (res.status === 200 && res.body?.workOrders) {
        setAllWorkOrders(res.body.workOrders as HistoryWorkOrder[]);
      } else {
        setError("Não foi possível carregar as ordens de serviço.");
      }
    } catch {
      setError("Erro ao buscar ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, GetAPI]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  /* ───── Apply service/equipment filters (same as programação) ───── */

  const serviceFiltersCount = useMemo(() => {
    return Object.values(serviceFilters).filter(
      (v) => Array.isArray(v) && v.length > 0,
    ).length;
  }, [serviceFilters]);

  const handleApplyServiceFilters = useCallback(
    async (filters: FilterServicesPayload) => {
      setServiceFilters(filters);

      const hasAny = Object.values(filters).some(
        (v) => Array.isArray(v) && v.length > 0,
      );
      if (!hasAny) {
        setFilteredCipServiceIds(null);
        return;
      }

      if (!effectiveCompanyId) return;
      const ids = new Set<string>();
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const res = await PostAPI(
          "/filter-services",
          { ...filters, companyId: effectiveCompanyId, page, limit },
          true,
        );
        if (res.status === 200 && res.body?.cipServices) {
          const services = res.body.cipServices as Array<{ id: string }>;
          services.forEach((s) => ids.add(s.id));
          hasMore = services.length === limit;
          page++;
        } else {
          hasMore = false;
        }
      }
      setFilteredCipServiceIds(ids);
    },
    [effectiveCompanyId, PostAPI],
  );

  /* ───── Derived: filtered + sorted list ───── */

  const displayed = useMemo(() => {
    let list = [...allWorkOrders];

    // Status filter
    if (statusFilter.length > 0) {
      list = list.filter((wo) => statusFilter.includes(wo.status));
    }

    // Date range (based on scheduledAt)
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter(
        (wo) => wo.scheduledAt && new Date(wo.scheduledAt).getTime() >= from,
      );
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59").getTime();
      list = list.filter(
        (wo) => wo.scheduledAt && new Date(wo.scheduledAt).getTime() <= to,
      );
    }

    // Service/equipment filters (cipServiceIds from /filter-services)
    if (filteredCipServiceIds) {
      list = list.filter((wo) => {
        if (wo.cipServiceId && filteredCipServiceIds.has(wo.cipServiceId))
          return true;
        if (wo.cipService?.id && filteredCipServiceIds.has(wo.cipService.id))
          return true;
        if (
          wo.cipServices?.some(
            (cs) => cs.id && filteredCipServiceIds.has(cs.id),
          )
        )
          return true;
        return false;
      });
    }

    // Text search (code, service name, equipment tag/name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((wo) => {
        const code = wo.code
          ? `OS ${String(wo.code).padStart(8, "0")}`.toLowerCase()
          : wo.id.slice(0, 8);
        if (code.includes(q)) return true;
        if (getServiceLabel(wo).toLowerCase().includes(q)) return true;
        if (getEquipmentLabel(wo).toLowerCase().includes(q)) return true;
        if (getCipLabel(wo).toLowerCase().includes(q)) return true;
        if (wo.route && `${wo.route.code} ${wo.route.name}`.toLowerCase().includes(q)) return true;
        if (
          wo.assignedWorkers?.some((w) =>
            w.name.toLowerCase().includes(q),
          )
        )
          return true;
        return false;
      });
    }

    // Sort
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
        cmp = getServiceLabel(a).localeCompare(getServiceLabel(b));
      } else if (sortField === "equipment") {
        cmp = getEquipmentLabel(a).localeCompare(getEquipmentLabel(b));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    allWorkOrders,
    statusFilter,
    dateFrom,
    dateTo,
    filteredCipServiceIds,
    searchQuery,
    sortField,
    sortDir,
  ]);

  /* ───── Status counts ───── */

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allWorkOrders.forEach((wo) => {
      map[wo.status] = (map[wo.status] ?? 0) + 1;
    });
    return map;
  }, [allWorkOrders]);

  /* ───── Sort handlers ───── */

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

  /* ───── Active filter count ───── */

  const totalActiveFilters =
    (statusFilter.length > 0 ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    serviceFiltersCount;

  const handleClearAll = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setDateFrom("");
    setDateTo("");
    setServiceFilters({});
    setFilteredCipServiceIds(null);
  };

  /* ───── Render ───── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Ordens de Serviço
          </h1>
          <p className="text-sm text-slate-500">
            Histórico geral de todas as ordens de serviço emitidas
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {!loading && (
            <span>
              {allWorkOrders.length}{" "}
              {allWorkOrders.length === 1 ? "ordem total" : "ordens totais"}
            </span>
          )}
        </div>
      </div>

      {/* Barra de busca + filtros rápidos */}
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        {/* Row 1: Search + filter toggle + clear */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[250px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, serviço, equipamento, rota ou colaborador..."
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Service/equipment filters toggle */}
          <button
            type="button"
            onClick={() => setServiceFiltersOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium ${
              serviceFiltersCount > 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros avançados
            {serviceFiltersCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                {serviceFiltersCount}
              </span>
            )}
          </button>

          {/* Clear all */}
          {totalActiveFilters > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtros ({totalActiveFilters})
            </button>
          )}
        </div>

        {/* Row 2: Status + Date range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-slate-500">
              Status:
            </span>
            {ALL_STATUSES.filter((s) => statusCounts[s]).map((s) => {
              const { label, variant } = getWorkOrderStatusDisplay(s);
              const cls = WORK_ORDER_VARIANT_CLASSES[variant];
              const isSelected = statusFilter.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatusFilter((prev) =>
                      prev.includes(s)
                        ? prev.filter((x) => x !== s)
                        : [...prev, s],
                    );
                  }}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-all ${
                    isSelected
                      ? `${cls.bg} ${cls.text} ${cls.border} ring-1 ring-offset-1 ring-current`
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {label}
                  <span className="text-[10px] opacity-70">
                    {statusCounts[s]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Date range */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Período:
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 3: Results count */}
        {!loading && (
          <div className="border-t border-slate-100 pt-2 text-xs text-slate-500">
            {displayed.length}{" "}
            {displayed.length === 1 ? "resultado" : "resultados"}
            {totalActiveFilters > 0 &&
              ` (filtrado de ${allWorkOrders.length})`}
          </div>
        )}
      </div>

      {/* Advanced filters panel (collapsible) */}
      {serviceFiltersOpen && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <PlanningRoutesFiltersPanel
            filters={serviceFilters}
            onApply={handleApplyServiceFilters}
            onClose={() => setServiceFiltersOpen(false)}
            compact
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">
            Carregando ordens de serviço…
          </span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Nenhuma ordem de serviço encontrada
          </h3>
          <p className="text-slate-500">
            {totalActiveFilters > 0
              ? "Nenhum resultado para os filtros selecionados. Tente ajustar os filtros."
              : "Nenhuma ordem de serviço foi emitida ainda."}
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
                    onClick={() => handleSort("equipment")}
                  >
                    Equipamento{sortIcon("equipment")}
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
                  const duration = getDuration(wo);

                  return (
                    <Fragment key={wo.id}>
                      <tr
                        className="group cursor-pointer hover:bg-slate-50/50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : wo.id)
                        }
                      >
                        <td className="px-2 py-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                          {wo.code
                            ? `OS ${String(wo.code).padStart(8, "0")}`
                            : wo.id.slice(0, 8)}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            {getEquipmentLabel(wo) || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-slate-700">
                            {getServiceLabel(wo)}
                          </span>
                          {wo.route && (
                            <span className="ml-2 whitespace-nowrap text-xs text-slate-500">
                              Rota: {wo.route.code} – {wo.route.name}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cls.bg} ${cls.text} ${cls.border}`}
                          >
                            {label}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {fmtDate(wo.scheduledAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {fmtDate(wo.completedAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {duration ?? "—"}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                                    <dt className="text-slate-500">
                                      Agendada:
                                    </dt>
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

                              {/* Equipamento / CIP */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                  Equipamento
                                </h4>
                                <dl className="space-y-1 text-sm">
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">
                                      Equipamento:
                                    </dt>
                                    <dd className="text-slate-700">
                                      {getEquipmentLabel(wo) || "—"}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">CIP:</dt>
                                    <dd className="text-slate-700">
                                      {getCipLabel(wo) || "—"}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500">
                                      Serviço:
                                    </dt>
                                    <dd className="text-slate-700">
                                      {getServiceLabel(wo)}
                                    </dd>
                                  </div>
                                  {wo.cipServiceId && (
                                    <div className="flex gap-2">
                                      <dt className="text-slate-500">
                                        CipService ID:
                                      </dt>
                                      <dd className="font-mono text-xs text-slate-500">
                                        {wo.cipServiceId.slice(0, 8)}…
                                      </dd>
                                    </div>
                                  )}
                                </dl>
                              </div>

                              {/* Rota */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                  Rota
                                </h4>
                                {wo.route ? (
                                  <dl className="space-y-1 text-sm">
                                    <div className="flex gap-2">
                                      <dt className="text-slate-500">
                                        Código:
                                      </dt>
                                      <dd className="text-slate-700">
                                        {wo.route.code}
                                      </dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="text-slate-500">Nome:</dt>
                                      <dd className="text-slate-700">
                                        {wo.route.name}
                                      </dd>
                                    </div>
                                  </dl>
                                ) : (
                                  <p className="text-sm text-slate-400">
                                    Serviço avulso (sem rota)
                                  </p>
                                )}
                                {(wo.cipServices?.length ?? 0) > 1 && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    +{" "}
                                    {(wo.cipServices?.length ?? 0) - 1} outro(s)
                                    serviço(s) na OS
                                  </p>
                                )}
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
                            {(() => {
                              const problems = getProblems(wo);
                              if (problems.length === 0) return null;
                              return (
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
                              );
                            })()}
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
