"use client";

import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type {
  CipService,
  FilterServicesPayload,
  Route,
  RouteCipServiceItem,
} from "@/lib/route-types";
import {
  formatExecutionMinutes,
  totalExecutionMinutes,
} from "@/lib/route-types";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Loader2,
  Lock,
  Minus,
  Plus,
  Route as RouteIcon,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getRoutePeriodMismatchWarning } from "./periodWarning";
import { PlanningRoutesFiltersPanel } from "./PlanningRoutesFiltersPanel";
import { RouteFormModal } from "./RouteFormModal";
import { RouteSelectModal } from "./RouteSelectModal";
import { ServiceDetailsModal } from "./ServiceDetailsModal";

/** Colunas disponíveis para as tabelas de serviços (campos da modal de detalhes). */
const SERVICE_TABLE_COLUMNS = [
  { id: "equipment", label: "Equipamento" },
  { id: "tag", label: "Tag" },
  { id: "equipmentCode", label: "Código do equipamento" },
  { id: "set", label: "Conjunto" },
  { id: "subset", label: "SubConjunto" },
  { id: "cip", label: "CIP" },
  { id: "cipCode", label: "Código CIP" },
  { id: "sector", label: "Setor" },
  { id: "equipmentType", label: "Tipo de equipamento" },
  { id: "manufacturer", label: "Fabricante" },
  { id: "costCenter", label: "Centro de custo" },
  { id: "safetyCondition", label: "Condição de segurança" },
  { id: "lubricationSystem", label: "Sistema de lubrificação" },
  { id: "mainComponent", label: "Componente principal" },
  { id: "powerUnit", label: "Unidade de potência" },
  { id: "serviceModel", label: "Serviço" },
  { id: "serviceModelDescription", label: "Descrição do serviço" },
  { id: "period", label: "Período" },
  { id: "periodDays", label: "Dias (período)" },
  { id: "priority", label: "Prioridade" },
  { id: "executionTime", label: "Tempo de execução" },
  { id: "team", label: "Equipe" },
  { id: "serviceCondition", label: "Condição do serviço" },
  { id: "jobSystem", label: "Sistema de trabalho" },
] as const;

export type ServiceTableColumnId = (typeof SERVICE_TABLE_COLUMNS)[number]["id"];

/** Colunas que sempre permanecem visíveis (não podem ser removidas). */
const FIXED_SERVICE_TABLE_COLUMN_IDS: ServiceTableColumnId[] = [
  "equipment",
  "tag",
  "executionTime",
  "period",
  "serviceModel",
  "cip",
];

function getServiceCellValue(
  service: CipService | undefined,
  columnId: string,
): string | number {
  if (!service) return "—";
  const eq = service.cip?.subset?.set?.equipment;
  const set = service.cip?.subset?.set;
  const subset = service.cip?.subset;
  const cip = service.cip;
  switch (columnId) {
    case "equipment":
      return eq?.name ?? eq?.tag ?? "—";
    case "tag":
      return eq?.tag ?? "—";
    case "equipmentCode":
      return eq?.code ?? "—";
    case "set":
      return set?.name ?? "—";
    case "subset":
      return subset?.name ?? "—";
    case "cip":
      return cip?.name ?? "—";
    case "cipCode":
      return cip?.code ?? "—";
    case "sector":
      return eq?.sector?.name ?? "—";
    case "equipmentType":
      return eq?.equipmentType?.name ?? "—";
    case "manufacturer":
      return eq?.manufacturer?.name ?? "—";
    case "costCenter":
      return eq?.costCenter?.name ?? "—";
    case "safetyCondition":
      return eq?.safetyCondition?.name ?? "—";
    case "lubricationSystem":
      return eq?.lubricationSystem?.name ?? "—";
    case "mainComponent":
      return eq?.mainComponent?.name ?? "—";
    case "powerUnit":
      return eq?.powerUnit?.name ?? "—";
    case "serviceModel":
      return service.serviceModel?.name ?? "—";
    case "serviceModelDescription":
      return service.serviceModel?.description ?? "—";
    case "period":
      return service.period?.name ?? "—";
    case "periodDays":
      return service.period?.days != null ? service.period.days : "—";
    case "priority":
      return service.priority?.name ?? "—";
    case "executionTime":
      return service.executionTime?.minutes != null
        ? `${service.executionTime.minutes} min`
        : (service.executionTime?.name ?? "—");
    case "team":
      return service.team?.name ?? "—";
    case "serviceCondition":
      return service.serviceCondition?.name ?? "—";
    case "jobSystem":
      return service.jobSystem?.name ?? "—";
    default:
      return "—";
  }
}

/** Resumo dos campos de equipamento para exibir nas listas (setor, tipo, fabricante). */
function equipmentSummary(service: CipService | undefined): string {
  const eq = service?.cip?.subset?.set?.equipment;
  if (!eq) return "";
  const parts = [
    eq.sector?.name,
    eq.equipmentType?.name,
    eq.manufacturer?.name,
  ].filter(Boolean) as string[];
  return parts.join(" · ");
}

export function PlanningRoutesContent() {
  const { GetAPI, PostAPI, PutAPI, DeleteAPI } = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [cipServices, setCipServices] = useState<CipService[]>([]);
  const [routeCipServices, setRouteCipServices] = useState<
    RouteCipServiceItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [viewingRoute, setViewingRoute] = useState<Route | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRouteServiceIds, setSelectedRouteServiceIds] = useState<
    Set<string>
  >(new Set());
  const [filtersAccordionOpen, setFiltersAccordionOpen] = useState(false);
  const [filters, setFilters] = useState<FilterServicesPayload>({});
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [showSelectRouteModal, setShowSelectRouteModal] = useState(false);
  const [serviceForDetails, setServiceForDetails] = useState<CipService | null>(
    null,
  );
  const [routesAccordionOpen, setRoutesAccordionOpen] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<ServiceTableColumnId[]>(
    () => [...FIXED_SERVICE_TABLE_COLUMN_IDS],
  );
  const [pageAvailable, setPageAvailable] = useState(1);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [routeServicesPaginated, setRouteServicesPaginated] = useState<{
    routeCipServices: RouteCipServiceItem[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loadingRouteServices, setLoadingRouteServices] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "danger";
    confirmLabel?: string;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const limitPerPage = 20;

  const routeUrl = useMemo(() => {
    if (!effectiveCompanyId) return null;
    return isSuperAdmin ? `/route?companyId=${effectiveCompanyId}` : "/route";
  }, [effectiveCompanyId, isSuperAdmin]);

  const fetchRoutes = useCallback(async () => {
    if (!routeUrl) return;
    const res = await GetAPI(routeUrl, true);
    if (res.status === 200 && res.body?.routes) {
      setRoutes(res.body.routes as Route[]);
    } else if (res.status !== 200) {
      toast.error(
        (res.body as { message?: string })?.message ??
          "Erro ao carregar rotas.",
      );
    }
  }, [routeUrl, GetAPI]);

  const fetchCipServices = useCallback(
    async (payload: FilterServicesPayload, page = 1) => {
      if (!effectiveCompanyId) return;
      setLoadingServices(true);
      const res = await PostAPI(
        "/filter-services",
        {
          ...payload,
          companyId: effectiveCompanyId,
          page,
          limit: limitPerPage,
          excludeWithServiceSchedule: true,
        },
        true,
      );
      if (res.status === 200 && res.body?.cipServices) {
        setCipServices(res.body.cipServices as CipService[]);
        setTotalAvailable(
          typeof res.body.total === "number" ? res.body.total : 0,
        );
        setPageAvailable(page);
        setSelectedServiceIds(new Set());
      } else if (res.status !== 200) {
        toast.error(
          (res.body as { message?: string })?.message ??
            "Erro ao carregar serviços.",
        );
      }
      setLoadingServices(false);
    },
    [effectiveCompanyId, PostAPI],
  );

  const fetchRouteServicesPaginated = useCallback(
    async (routeId: string, page = 1) => {
      setLoadingRouteServices(true);
      const res = await GetAPI(
        `/route/single/${routeId}/services?page=${page}&limit=${limitPerPage}`,
        true,
      );
      if (res.status === 200 && res.body?.routeCipServices) {
        setRouteServicesPaginated({
          routeCipServices: res.body.routeCipServices as RouteCipServiceItem[],
          total: typeof res.body.total === "number" ? res.body.total : 0,
          page: typeof res.body.page === "number" ? res.body.page : page,
          limit:
            typeof res.body.limit === "number" ? res.body.limit : limitPerPage,
        });
      } else {
        setRouteServicesPaginated(null);
        if (res.status !== 200) {
          toast.error(
            (res.body as { message?: string })?.message ??
              "Erro ao carregar serviços da rota.",
          );
        }
      }
      setLoadingRouteServices(false);
    },
    [GetAPI],
  );

  const fetchRouteCipServices = useCallback(async () => {
    if (!effectiveCompanyId) return;
    const res = await GetAPI(
      `/route/company/${effectiveCompanyId}/route-services`,
      true,
    );
    if (res.status === 200 && res.body?.routeCipServices) {
      setRouteCipServices(res.body.routeCipServices as RouteCipServiceItem[]);
    } else if (res.status !== 200) {
      toast.error(
        (res.body as { message?: string })?.message ??
          "Erro ao carregar vínculos rota-serviço.",
      );
    }
  }, [effectiveCompanyId, GetAPI]);

  useEffect(() => {
    if (!effectiveCompanyId) {
      setRoutes([]);
      setCipServices([]);
      setRouteCipServices([]);
      setPageAvailable(1);
      setTotalAvailable(0);
      setRouteServicesPaginated(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setPageAvailable(1);
    Promise.all([
      fetchRoutes(),
      fetchCipServices(filters, 1),
      fetchRouteCipServices(),
    ]).finally(() => setLoading(false));
  }, [effectiveCompanyId, fetchRoutes, fetchRouteCipServices]);

  useEffect(() => {
    if (!viewingRoute) {
      setRouteServicesPaginated(null);
      return;
    }
    setRouteServicesPaginated(null);
    fetchRouteServicesPaginated(viewingRoute.id, 1);
  }, [viewingRoute?.id, fetchRouteServicesPaginated]);

  const applyFilters = useCallback(
    (newFilters: FilterServicesPayload) => {
      setFilters(newFilters);
      setPageAvailable(1);
      fetchCipServices(newFilters, 1);
      setFiltersAccordionOpen(false);
    },
    [fetchCipServices],
  );

  const permanentRoutes = useMemo(
    () => routes.filter((r) => !r.isTemporary),
    [routes],
  );

  const columnsToShow = useMemo(
    () =>
      SERVICE_TABLE_COLUMNS.filter(
        (c) =>
          visibleColumns.includes(c.id) ||
          FIXED_SERVICE_TABLE_COLUMN_IDS.includes(c.id),
      ),
    [visibleColumns],
  );

  const columnDropdownItems = useMemo(
    () => SERVICE_TABLE_COLUMNS.map((c) => ({ id: c.id, name: c.label })),
    [],
  );

  const handleColumnToggle = useCallback(
    (columnId: string, checked: boolean) => {
      if (
        !checked &&
        FIXED_SERVICE_TABLE_COLUMN_IDS.includes(
          columnId as ServiceTableColumnId,
        )
      ) {
        return;
      }
      setVisibleColumns((prev) =>
        checked
          ? [...prev, columnId as ServiceTableColumnId]
          : prev.filter((c) => c !== columnId),
      );
    },
    [],
  );

  const handleSelectAllColumns = useCallback(() => {
    setVisibleColumns(SERVICE_TABLE_COLUMNS.map((c) => c.id));
  }, []);

  const handleDeselectAllColumns = useCallback(() => {
    setVisibleColumns([...FIXED_SERVICE_TABLE_COLUMN_IDS]);
  }, []);

  const totalPagesAvailable = Math.max(
    1,
    Math.ceil(totalAvailable / limitPerPage),
  );
  const totalPagesRoute = useMemo(() => {
    const total = routeServicesPaginated?.total ?? 0;
    return Math.max(1, Math.ceil(total / limitPerPage));
  }, [routeServicesPaginated?.total]);

  const goToPageAvailable = useCallback(
    (page: number) => {
      const p = Math.max(1, Math.min(page, totalPagesAvailable));
      setPageAvailable(p);
      fetchCipServices(filters, p);
    },
    [fetchCipServices, filters, totalPagesAvailable],
  );

  const goToPageRoute = useCallback(
    (page: number) => {
      if (!viewingRoute) return;
      const p = Math.max(1, Math.min(page, totalPagesRoute));
      fetchRouteServicesPaginated(viewingRoute.id, p);
    },
    [viewingRoute, totalPagesRoute, fetchRouteServicesPaginated],
  );

  const activeFiltersCount = useMemo(() => {
    const keys: (keyof FilterServicesPayload)[] = [
      "periodIds",
      "priorityIds",
      "teamIds",
      "serviceConditionIds",
      "jobSystemIds",
      "executionTimeIds",
      "extraTeamIds",
      "estimatedExtraTeamTimeIds",
      "serviceModelIds",
      "epiIds",
      "toolkitIds",
      "sectorIds",
      "equipmentTypeIds",
      "manufacturerIds",
      "costCenterIds",
      "safetyConditionIds",
      "lubricationSystemIds",
      "mainComponentIds",
      "powerUnitIds",
    ];
    return keys.filter((k) => (filters[k] as string[] | undefined)?.length)
      .length;
  }, [filters]);

  const servicesInViewingRoute = useMemo(() => {
    if (!viewingRoute) return [];
    return routeServicesPaginated?.routeCipServices ?? [];
  }, [viewingRoute, routeServicesPaginated]);

  const cipServicesAvailableForRoute = useMemo(() => {
    const idsInPermanent = new Set(
      routeCipServices
        .filter((rcs) => permanentRoutes.some((r) => r.id === rcs.routeId))
        .map((rcs) => rcs.cipServiceId),
    );
    return cipServices.filter((cs) => !idsInPermanent.has(cs.id));
  }, [cipServices, routeCipServices, permanentRoutes]);

  /** Tempo total (min) dos serviços selecionados para criar/adicionar à rota */
  const totalExecutionMinutesSelected = useMemo(() => {
    const services = Array.from(selectedServiceIds)
      .map((id) => cipServicesAvailableForRoute.find((cs) => cs.id === id))
      .filter(Boolean) as CipService[];
    return totalExecutionMinutes(services);
  }, [selectedServiceIds, cipServicesAvailableForRoute]);

  /** Tempo total (min) dos serviços da rota visualizada (roda inteira, para exibir no header) */
  const totalExecutionMinutesViewingRoute = useMemo(() => {
    if (!viewingRoute) return 0;
    const items = routeCipServices.filter(
      (rcs) => rcs.routeId === viewingRoute.id,
    );
    return totalExecutionMinutes(items);
  }, [viewingRoute, routeCipServices]);

  /** Mapa routeId -> tempo total em minutos (para exibir nos chips) */
  const totalExecutionMinutesByRouteId = useMemo(() => {
    const map = new Map<string, number>();
    for (const route of permanentRoutes) {
      const items = routeCipServices.filter((rcs) => rcs.routeId === route.id);
      map.set(route.id, totalExecutionMinutes(items));
    }
    return map;
  }, [permanentRoutes, routeCipServices]);

  /** Aviso quando algum serviço selecionado tem periodicidade diferente da rota (ao adicionar à rota visualizada ou ao criar nova) */
  const routePeriodMismatchWarning = useMemo(() => {
    if (selectedServiceIds.size === 0) return { shouldWarn: false as const };
    const routePeriodId = viewingRoute?.routePeriodId ?? null;
    return getRoutePeriodMismatchWarning(
      routePeriodId,
      cipServicesAvailableForRoute,
      selectedServiceIds,
    );
  }, [
    selectedServiceIds,
    cipServicesAvailableForRoute,
    viewingRoute?.routePeriodId,
  ]);

  const cipServiceIdsToRemove = useMemo(() => {
    if (!viewingRoute) return [];
    return routeCipServices
      .filter(
        (rcs) =>
          rcs.routeId === viewingRoute.id &&
          selectedRouteServiceIds.has(rcs.id),
      )
      .map((rcs) => rcs.cipServiceId);
  }, [viewingRoute, routeCipServices, selectedRouteServiceIds]);

  const toggleViewingRoute = useCallback((route: Route) => {
    setViewingRoute((current) => (current?.id === route.id ? null : route));
    setSelectedRouteServiceIds(new Set());
  }, []);

  const toggleServiceSelection = useCallback((id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleRouteServiceSelection = useCallback((id: string) => {
    setSelectedRouteServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allAvailableSelected =
    cipServicesAvailableForRoute.length > 0 &&
    cipServicesAvailableForRoute.every((cs) => selectedServiceIds.has(cs.id));
  const someAvailableSelected = cipServicesAvailableForRoute.some((cs) =>
    selectedServiceIds.has(cs.id),
  );

  const toggleAllAvailableServices = useCallback(() => {
    if (allAvailableSelected) {
      setSelectedServiceIds((prev) => {
        const next = new Set(prev);
        cipServicesAvailableForRoute.forEach((cs) => next.delete(cs.id));
        return next;
      });
    } else {
      setSelectedServiceIds((prev) => {
        const next = new Set(prev);
        cipServicesAvailableForRoute.forEach((cs) => next.add(cs.id));
        return next;
      });
    }
  }, [allAvailableSelected, cipServicesAvailableForRoute]);

  const allRouteServicesSelected =
    !!viewingRoute &&
    servicesInViewingRoute.length > 0 &&
    servicesInViewingRoute.every((rcs) => selectedRouteServiceIds.has(rcs.id));
  const someRouteServicesSelected = servicesInViewingRoute.some((rcs) =>
    selectedRouteServiceIds.has(rcs.id),
  );

  const toggleAllRouteServices = useCallback(() => {
    if (allRouteServicesSelected) {
      setSelectedRouteServiceIds(new Set());
    } else {
      setSelectedRouteServiceIds(
        new Set(servicesInViewingRoute.map((rcs) => rcs.id)),
      );
    }
  }, [allRouteServicesSelected, servicesInViewingRoute]);

  const handleCreateRoute = useCallback(() => {
    setEditingRoute(null);
    setShowRouteModal(true);
  }, []);

  const handleEditRoute = useCallback((route: Route) => {
    setEditingRoute(route);
    setShowRouteModal(true);
  }, []);

  const handleRouteModalSuccess = useCallback(() => {
    setShowRouteModal(false);
    setEditingRoute(null);
    fetchRoutes();
    fetchRouteCipServices();
  }, [fetchRoutes, fetchRouteCipServices]);

  const handleAddToRoute = useCallback(
    async (routeId: string) => {
      const availableIds = new Set(
        cipServicesAvailableForRoute.map((cs) => cs.id),
      );
      const validIds = Array.from(selectedServiceIds).filter((id) =>
        availableIds.has(id),
      );
      if (validIds.length === 0) {
        toast.error("Nenhum serviço válido selecionado.");
        return;
      }
      const res = await PostAPI(
        `/route/single/${routeId}/services`,
        { cipServiceIds: validIds },
        true,
      );
      if (res.status === 200 || res.status === 201) {
        setSelectedServiceIds(new Set());
        fetchRouteCipServices();
        fetchRoutes();
        if (viewingRoute?.id === routeId) {
          fetchRouteServicesPaginated(
            routeId,
            routeServicesPaginated?.page ?? 1,
          );
        }
        toast.success("Serviços adicionados à rota.");
      } else {
        toast.error(
          (res.body as { message?: string })?.message ??
            "Erro ao adicionar serviços.",
        );
      }
    },
    [
      selectedServiceIds,
      cipServicesAvailableForRoute,
      PostAPI,
      fetchRouteCipServices,
      fetchRoutes,
      viewingRoute?.id,
      routeServicesPaginated?.page,
      fetchRouteServicesPaginated,
    ],
  );

  const handleRemoveFromRoute = useCallback(async () => {
    if (!viewingRoute || cipServiceIdsToRemove.length === 0) return;
    const res = await PostAPI(
      `/route/single/${viewingRoute.id}/services/remove`,
      { cipServiceIds: cipServiceIdsToRemove },
      true,
    );
    if (res.status === 200) {
      setSelectedRouteServiceIds(new Set());
      fetchRouteCipServices();
      fetchRoutes();
      fetchRouteServicesPaginated(
        viewingRoute.id,
        routeServicesPaginated?.page ?? 1,
      );
      toast.success("Serviços removidos da rota.");
    } else {
      toast.error(
        (res.body as { message?: string })?.message ??
          "Erro ao remover serviços.",
      );
    }
  }, [
    viewingRoute,
    cipServiceIdsToRemove,
    PostAPI,
    fetchRouteCipServices,
    fetchRoutes,
    routeServicesPaginated?.page,
    fetchRouteServicesPaginated,
  ]);

  const handleDeleteRoute = useCallback(
    async (route: Route) => {
      const res = await DeleteAPI(`/route/single/${route.id}`, true);
      if (res.status === 200 || (res as { status?: number }).status === 204) {
        if (viewingRoute?.id === route.id) setViewingRoute(null);
        fetchRoutes();
        fetchRouteCipServices();
        toast.success("Rota excluída.");
      } else {
        toast.error(
          (res.body as { message?: string })?.message ??
            "Erro ao excluir rota.",
        );
      }
    },
    [viewingRoute, DeleteAPI, fetchRoutes, fetchRouteCipServices],
  );

  const handleDeleteRouteClick = useCallback(
    async (route: Route) => {
      try {
        const res = await GetAPI(
          `/route/single/${route.id}/deletion-info`,
          true,
        );
        if (res.status !== 200 || !res.body) {
          toast.error("Não foi possível verificar a rota.");
          return;
        }
        const { workOrderCount = 0, routeScheduleCount = 0 } = res.body as {
          workOrderCount?: number;
          routeScheduleCount?: number;
        };
        const hasDependencies = workOrderCount > 0 || routeScheduleCount > 0;
        const parts: string[] = [];
        if (workOrderCount > 0) {
          parts.push(`${workOrderCount} ordem(ns) de serviço emitida(s)`);
        }
        if (routeScheduleCount > 0) {
          parts.push(`${routeScheduleCount} agendamento(s)`);
        }
        const description = hasDependencies
          ? `Esta rota possui ${parts.join(" e ")}. Ao excluir a rota, todos serão removidos. Deseja continuar?`
          : `Excluir a rota "${route.code} - ${route.name}"?`;
        setConfirmDialog({
          open: true,
          title: "Excluir rota",
          description,
          confirmLabel: "Excluir",
          variant: "danger",
          onConfirm: () => handleDeleteRoute(route),
        });
      } catch {
        toast.error("Erro ao verificar a rota.");
      }
    },
    [GetAPI, handleDeleteRoute],
  );

  if (!effectiveCompanyId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="text-sm">
          {isSuperAdmin
            ? "Selecione uma empresa no dropdown do header para gerenciar rotas e serviços."
            : "Empresa não disponível."}
        </p>
      </div>
    );
  }

  if (loading && routes.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-slate-100 bg-white">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accordion: Filtros */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setFiltersAccordionOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-0.5">
                {activeFiltersCount}
              </Badge>
            )}
          </span>
          {filtersAccordionOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          )}
        </button>
        {filtersAccordionOpen && (
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <PlanningRoutesFiltersPanel
              filters={filters}
              onApply={applyFilters}
              onClose={() => setFiltersAccordionOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Accordion: Rotas (só título + chevron quando fechado) */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setRoutesAccordionOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50"
        >
          <span className="text-sm font-semibold text-slate-700">
            Rotas ({permanentRoutes.length})
          </span>
          {routesAccordionOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          )}
        </button>
        {routesAccordionOpen && (
          <>
            <div className="border-t border-slate-100 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateRoute}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" />
                  Nova Rota
                </button>
              </div>
              {permanentRoutes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma rota cadastrada. Crie uma nova rota pelo botão acima
                  ou adicione serviços à rota na tabela &quot;Serviços
                  disponíveis&quot;.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {permanentRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleViewingRoute(route)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          viewingRoute?.id === route.id
                            ? "border-primary bg-primary text-white"
                            : "border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {route.code} – {route.name}
                        {(totalExecutionMinutesByRouteId.get(route.id) ?? 0) >
                          0 && (
                          <span className="ml-1.5 opacity-90">
                            (
                            {formatExecutionMinutes(
                              totalExecutionMinutesByRouteId.get(route.id) ?? 0,
                            )}
                            )
                          </span>
                        )}
                        {route.period?.name && (
                          <span
                            className={`ml-1.5 inline-flex items-center gap-0.5 opacity-90 ${
                              viewingRoute?.id === route.id
                                ? "text-white"
                                : "text-slate-500"
                            }`}
                            title="Período da rota"
                          >
                            <Calendar className="h-3.5 w-3.5" aria-hidden />
                            {route.period.name}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditRoute(route)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        title="Editar rota"
                      >
                        <RouteIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRouteClick(route)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Excluir rota"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {viewingRoute && (
                <p className="text-primary mt-2 flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span>
                    Visualizando: {viewingRoute.code} – {viewingRoute.name}
                  </span>
                  {viewingRoute.period?.name && (
                    <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded px-1.5 py-0.5">
                      <Calendar className="h-3 w-3" aria-hidden />
                      {viewingRoute.period.name}
                    </span>
                  )}
                </p>
              )}
            </div>
            {/* Tabela: Serviços nesta rota (dentro do accordion) */}
            {viewingRoute && (
              <div className="border-t border-slate-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Serviços nesta rota
                      {totalExecutionMinutesViewingRoute > 0 && (
                        <span className="ml-2 font-normal text-slate-600">
                          (total:{" "}
                          {formatExecutionMinutes(
                            totalExecutionMinutesViewingRoute,
                          )}
                          )
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Selecione os serviços para remover da rota.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveFromRoute}
                      disabled={cipServiceIdsToRemove.length === 0}
                      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        cipServiceIdsToRemove.length === 0
                          ? "Selecione serviços na tabela para remover"
                          : "Remover selecionados da rota"
                      }
                    >
                      <Minus className="h-4 w-4" />
                      Remover da rota
                    </button>
                    <MultiSelectDropdown
                      label="Colunas"
                      items={columnDropdownItems}
                      selectedIds={visibleColumns}
                      onToggle={handleColumnToggle}
                      searchPlaceholder="Buscar coluna..."
                      className="w-[200px] shrink-0"
                      showSelectAllDeselectAll
                      onSelectAll={handleSelectAllColumns}
                      onDeselectAll={handleDeselectAllColumns}
                      fixedIds={FIXED_SERVICE_TABLE_COLUMN_IDS}
                    />
                  </div>
                </div>
                {loadingRouteServices ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                  </div>
                ) : servicesInViewingRoute.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Nenhum serviço nesta rota.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="w-10">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={allRouteServicesSelected}
                              ref={(el) => {
                                if (el)
                                  el.indeterminate =
                                    someRouteServicesSelected &&
                                    !allRouteServicesSelected;
                              }}
                              onChange={toggleAllRouteServices}
                              className="text-primary h-4 w-4 rounded border-slate-300"
                            />
                          </label>
                        </TableHead>
                        {columnsToShow.map((col) => (
                          <TableHead
                            key={col.id}
                            className="text-slate-500"
                            title={
                              FIXED_SERVICE_TABLE_COLUMN_IDS.includes(col.id)
                                ? "Campo fixo – não pode ser removido"
                                : undefined
                            }
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {col.label}
                              {FIXED_SERVICE_TABLE_COLUMN_IDS.includes(
                                col.id,
                              ) && (
                                <Lock
                                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                  aria-hidden
                                />
                              )}
                            </span>
                          </TableHead>
                        ))}
                        <TableHead className="w-16">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicesInViewingRoute.map((rcs) => (
                        <TableRow
                          key={rcs.id}
                          className={`cursor-pointer border-slate-100 ${
                            selectedRouteServiceIds.has(rcs.id)
                              ? "bg-primary/5"
                              : "hover:bg-slate-50/50"
                          }`}
                          onClick={() => toggleRouteServiceSelection(rcs.id)}
                        >
                          <TableCell
                            className="w-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRouteServiceIds.has(rcs.id)}
                              onChange={() =>
                                toggleRouteServiceSelection(rcs.id)
                              }
                              className="text-primary h-4 w-4 rounded border-slate-300"
                            />
                          </TableCell>
                          {columnsToShow.map((col) => (
                            <TableCell
                              key={col.id}
                              className="text-sm text-slate-700"
                            >
                              {getServiceCellValue(rcs.cipService, col.id)}
                            </TableCell>
                          ))}
                          <TableCell
                            className="w-16"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                rcs.cipService &&
                                setServiceForDetails(rcs.cipService)
                              }
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                              title="Ver detalhes do serviço"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {viewingRoute &&
                  routeServicesPaginated &&
                  routeServicesPaginated.total > limitPerPage && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
                      <p className="text-sm text-slate-600">
                        {(routeServicesPaginated.page - 1) * limitPerPage + 1}–
                        {Math.min(
                          routeServicesPaginated.page * limitPerPage,
                          routeServicesPaginated.total,
                        )}{" "}
                        de {routeServicesPaginated.total} serviços
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            goToPageRoute(routeServicesPaginated!.page - 1)
                          }
                          disabled={routeServicesPaginated.page <= 1}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-slate-600">
                          Página {routeServicesPaginated.page} de{" "}
                          {totalPagesRoute}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            goToPageRoute(routeServicesPaginated!.page + 1)
                          }
                          disabled={
                            routeServicesPaginated.page >= totalPagesRoute
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabela: Serviços disponíveis */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <h3 className="font-semibold text-slate-900">
              Serviços disponíveis
            </h3>
            <p className="text-xs text-slate-500">
              Serviços ainda não vinculados a nenhuma rota. Selecione e adicione
              a uma rota.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (viewingRoute && selectedServiceIds.size > 0) {
                  if (
                    routePeriodMismatchWarning.shouldWarn &&
                    routePeriodMismatchWarning.message
                  ) {
                    setConfirmDialog({
                      open: true,
                      title: "Atenção",
                      description: `${routePeriodMismatchWarning.message}\n\nDeseja continuar mesmo assim?`,
                      confirmLabel: "Continuar",
                      onConfirm: () => handleAddToRoute(viewingRoute.id),
                    });
                    return;
                  }
                  handleAddToRoute(viewingRoute.id);
                } else if (selectedServiceIds.size > 0) {
                  setShowSelectRouteModal(true);
                } else {
                  toast.error("Selecione ao menos um serviço.");
                }
              }}
              disabled={selectedServiceIds.size === 0}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              title={
                selectedServiceIds.size === 0
                  ? "Selecione serviços na tabela"
                  : viewingRoute
                    ? "Adicionar à rota visualizada"
                    : "Escolher rota para adicionar"
              }
            >
              <ArrowRight className="h-4 w-4" />
              Adicionar à rota
            </button>
            <MultiSelectDropdown
              label="Colunas"
              items={columnDropdownItems}
              selectedIds={visibleColumns}
              onToggle={handleColumnToggle}
              searchPlaceholder="Buscar coluna..."
              className="w-[200px] shrink-0"
              showSelectAllDeselectAll
              onSelectAll={handleSelectAllColumns}
              onDeselectAll={handleDeselectAllColumns}
              fixedIds={FIXED_SERVICE_TABLE_COLUMN_IDS}
            />
          </div>
        </div>
        {loadingServices ? (
          <div className="flex justify-center py-12">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          </div>
        ) : cipServicesAvailableForRoute.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Nenhum serviço disponível (todos já estão em alguma rota, já possuem
            agendamento ou não há resultados).
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="w-10">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allAvailableSelected}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            someAvailableSelected && !allAvailableSelected;
                      }}
                      onChange={toggleAllAvailableServices}
                      className="text-primary h-4 w-4 rounded border-slate-300"
                    />
                  </label>
                </TableHead>
                {columnsToShow.map((col) => (
                  <TableHead
                    key={col.id}
                    className="text-slate-500"
                    title={
                      FIXED_SERVICE_TABLE_COLUMN_IDS.includes(col.id)
                        ? "Campo fixo – não pode ser removido"
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {FIXED_SERVICE_TABLE_COLUMN_IDS.includes(col.id) && (
                        <Lock
                          className="h-3.5 w-3.5 shrink-0 text-slate-400"
                          aria-hidden
                        />
                      )}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cipServicesAvailableForRoute.map((cs) => (
                <TableRow
                  key={cs.id}
                  className={`cursor-pointer border-slate-100 ${
                    selectedServiceIds.has(cs.id)
                      ? "bg-primary/5"
                      : "hover:bg-slate-50/50"
                  }`}
                  onClick={() => toggleServiceSelection(cs.id)}
                >
                  <TableCell
                    className="w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.has(cs.id)}
                      onChange={() => toggleServiceSelection(cs.id)}
                      className="text-primary m-auto h-4 w-4 rounded border-slate-300"
                    />
                  </TableCell>
                  {columnsToShow.map((col) => (
                    <TableCell key={col.id} className="text-sm text-slate-700">
                      {getServiceCellValue(cs, col.id)}
                    </TableCell>
                  ))}
                  <TableCell
                    className="w-16"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setServiceForDetails(cs)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      title="Ver detalhes do serviço"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {totalAvailable > limitPerPage && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-600">
              {(pageAvailable - 1) * limitPerPage + 1}–
              {Math.min(pageAvailable * limitPerPage, totalAvailable)} de{" "}
              {totalAvailable} serviços
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPageAvailable(pageAvailable - 1)}
                disabled={pageAvailable <= 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-600">
                Página {pageAvailable} de {totalPagesAvailable}
              </span>
              <button
                type="button"
                onClick={() => goToPageAvailable(pageAvailable + 1)}
                disabled={pageAvailable >= totalPagesAvailable}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <RouteFormModal
        open={showRouteModal}
        onClose={() => {
          setShowRouteModal(false);
          setEditingRoute(null);
        }}
        route={editingRoute}
        effectiveCompanyId={effectiveCompanyId}
        isSuperAdmin={isSuperAdmin}
        onSuccess={handleRouteModalSuccess}
        initialSelectedServiceIds={
          editingRoute ? undefined : Array.from(selectedServiceIds)
        }
        initialCipServices={
          editingRoute ? undefined : cipServicesAvailableForRoute
        }
        fetchRouteCipServices={fetchRouteCipServices}
        createRoutePayload={{ companyId: effectiveCompanyId }}
        postApi={PostAPI}
        putApi={PutAPI}
      />

      <RouteSelectModal
        open={showSelectRouteModal}
        onClose={() => setShowSelectRouteModal(false)}
        routes={permanentRoutes}
        selectedServiceIds={Array.from(selectedServiceIds)}
        onConfirm={async (routeId) => {
          const route = permanentRoutes.find((r) => r.id === routeId);
          if (route) {
            const warning = getRoutePeriodMismatchWarning(
              route.routePeriodId ?? null,
              cipServicesAvailableForRoute,
              Array.from(selectedServiceIds),
            );
            if (warning.shouldWarn && warning.message) {
              setConfirmDialog({
                open: true,
                title: "Atenção",
                description: `${warning.message}\n\nDeseja continuar mesmo assim?`,
                confirmLabel: "Continuar",
                onConfirm: async () => {
                  await handleAddToRoute(routeId);
                  setSelectedServiceIds(new Set());
                  await fetchRouteCipServices();
                  setShowSelectRouteModal(false);
                },
              });
              return;
            }
          }
          await handleAddToRoute(routeId);
          setSelectedServiceIds(new Set());
          await fetchRouteCipServices();
          setShowSelectRouteModal(false);
        }}
        onCreateNew={() => {
          setShowSelectRouteModal(false);
          setEditingRoute(null);
          setShowRouteModal(true);
        }}
      />

      <ServiceDetailsModal
        open={!!serviceForDetails}
        onClose={() => setServiceForDetails(null)}
        service={serviceForDetails}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog((prev) => ({ ...prev, open: false }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel ?? "Confirmar"}
        variant={confirmDialog.variant}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }}
      />
    </div>
  );
}
