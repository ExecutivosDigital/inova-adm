"use client";

import { Badge } from "@/components/ui/badge";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type {
    CipService,
    FilterServicesPayload,
    Route,
    RouteCipServiceItem,
} from "@/lib/route-types";
import { formatExecutionMinutes, totalExecutionMinutes } from "@/lib/route-types";
import {
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Eye,
    Filter,
    Loader2,
    Minus,
    Plus,
    Route as RouteIcon,
    Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlanningRoutesFiltersPanel } from "./PlanningRoutesFiltersPanel";
import { RouteFormModal } from "./RouteFormModal";
import { RouteSelectModal } from "./RouteSelectModal";
import { ServiceDetailsModal } from "./ServiceDetailsModal";

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
  const [routeCipServices, setRouteCipServices] = useState<RouteCipServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [viewingRoute, setViewingRoute] = useState<Route | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [selectedRouteServiceIds, setSelectedRouteServiceIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterServicesPayload>({});
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [showSelectRouteModal, setShowSelectRouteModal] = useState(false);
  const [serviceForDetails, setServiceForDetails] = useState<CipService | null>(null);
  const [routesListExpanded, setRoutesListExpanded] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const routeUrl = useMemo(() => {
    if (!effectiveCompanyId) return null;
    return isSuperAdmin ? `/route?companyId=${effectiveCompanyId}` : "/route";
  }, [effectiveCompanyId, isSuperAdmin]);

  const fetchRoutes = useCallback(async () => {
    if (!routeUrl) return;
    const res = await GetAPI(routeUrl, true);
    if (res.status === 200 && res.body?.routes) {
      setRoutes(res.body.routes as Route[]);
    }
  }, [routeUrl, GetAPI]);

  const fetchCipServices = useCallback(async (payload: FilterServicesPayload) => {
    if (!effectiveCompanyId) return;
    setLoadingServices(true);
    const res = await PostAPI("/filter-services", { ...payload, companyId: effectiveCompanyId }, true);
    if (res.status === 200 && res.body?.cipServices) {
      setCipServices(res.body.cipServices as CipService[]);
      setSelectedServiceIds(new Set());
    }
    setLoadingServices(false);
  }, [effectiveCompanyId, PostAPI]);

  const fetchRouteCipServices = useCallback(async () => {
    if (!effectiveCompanyId) return;
    const res = await GetAPI(`/route/company/${effectiveCompanyId}/route-services`, true);
    if (res.status === 200 && res.body?.routeCipServices) {
      setRouteCipServices(res.body.routeCipServices as RouteCipServiceItem[]);
    }
  }, [effectiveCompanyId, GetAPI]);

  useEffect(() => {
    if (!effectiveCompanyId) {
      setRoutes([]);
      setCipServices([]);
      setRouteCipServices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchRoutes(),
      fetchCipServices(filters),
      fetchRouteCipServices(),
    ]).finally(() => setLoading(false));
  }, [effectiveCompanyId, fetchRoutes, fetchRouteCipServices]);

  const applyFilters = useCallback(
    (newFilters: FilterServicesPayload) => {
      setFilters(newFilters);
      fetchCipServices(newFilters);
      setShowFilters(false);
    },
    [fetchCipServices]
  );

  const permanentRoutes = useMemo(() => routes.filter((r) => !r.isTemporary), [routes]);

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
    return keys.filter((k) => (filters[k] as string[] | undefined)?.length).length;
  }, [filters]);

  const servicesInViewingRoute = useMemo(() => {
    if (!viewingRoute) return [];
    return routeCipServices.filter((rcs) => rcs.routeId === viewingRoute.id);
  }, [routeCipServices, viewingRoute]);

  const cipServicesAvailableForRoute = useMemo(() => {
    const idsInPermanent = new Set(
      routeCipServices
        .filter((rcs) => permanentRoutes.some((r) => r.id === rcs.routeId))
        .map((rcs) => rcs.cipServiceId)
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

  /** Tempo total (min) dos serviços da rota visualizada */
  const totalExecutionMinutesViewingRoute = useMemo(
    () => totalExecutionMinutes(servicesInViewingRoute),
    [servicesInViewingRoute]
  );

  /** Mapa routeId -> tempo total em minutos (para exibir nos chips) */
  const totalExecutionMinutesByRouteId = useMemo(() => {
    const map = new Map<string, number>();
    for (const route of permanentRoutes) {
      const items = routeCipServices.filter((rcs) => rcs.routeId === route.id);
      map.set(route.id, totalExecutionMinutes(items));
    }
    return map;
  }, [permanentRoutes, routeCipServices]);

  const cipServiceIdsToRemove = useMemo(() => {
    if (!viewingRoute) return [];
    return routeCipServices
      .filter((rcs) => rcs.routeId === viewingRoute.id && selectedRouteServiceIds.has(rcs.id))
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
  const someAvailableSelected = cipServicesAvailableForRoute.some((cs) => selectedServiceIds.has(cs.id));

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
  const someRouteServicesSelected = servicesInViewingRoute.some((rcs) => selectedRouteServiceIds.has(rcs.id));

  const toggleAllRouteServices = useCallback(() => {
    if (allRouteServicesSelected) {
      setSelectedRouteServiceIds(new Set());
    } else {
      setSelectedRouteServiceIds(new Set(servicesInViewingRoute.map((rcs) => rcs.id)));
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
    setToastMessage({ type: "success", text: "Rota salva com sucesso." });
  }, [fetchRoutes, fetchRouteCipServices]);

  const handleAddToRoute = useCallback(
    async (routeId: string) => {
      const availableIds = new Set(cipServicesAvailableForRoute.map((cs) => cs.id));
      const validIds = Array.from(selectedServiceIds).filter((id) => availableIds.has(id));
      if (validIds.length === 0) {
        setToastMessage({ type: "error", text: "Nenhum serviço válido selecionado." });
        return;
      }
      const res = await PostAPI(`/route/single/${routeId}/services`, { cipServiceIds: validIds }, true);
      if (res.status === 200 || res.status === 201) {
        setSelectedServiceIds(new Set());
        fetchRouteCipServices();
        fetchRoutes();
        setToastMessage({ type: "success", text: "Serviços adicionados à rota." });
      } else {
        setToastMessage({ type: "error", text: (res.body as { message?: string })?.message ?? "Erro ao adicionar." });
      }
    },
    [selectedServiceIds, cipServicesAvailableForRoute, PostAPI, fetchRouteCipServices, fetchRoutes]
  );

  const handleRemoveFromRoute = useCallback(async () => {
    if (!viewingRoute || cipServiceIdsToRemove.length === 0) return;
    const res = await PostAPI(
      `/route/single/${viewingRoute.id}/services/remove`,
      { cipServiceIds: cipServiceIdsToRemove },
      true
    );
    if (res.status === 200) {
      setSelectedRouteServiceIds(new Set());
      fetchRouteCipServices();
      fetchRoutes();
      setToastMessage({ type: "success", text: "Serviços removidos da rota." });
    } else {
      setToastMessage({ type: "error", text: (res.body as { message?: string })?.message ?? "Erro ao remover." });
    }
  }, [viewingRoute, cipServiceIdsToRemove, PostAPI, fetchRouteCipServices, fetchRoutes]);

  const handleDeleteRoute = useCallback(
    async (route: Route) => {
      if (!confirm(`Excluir a rota "${route.code} - ${route.name}"?`)) return;
      const res = await DeleteAPI(`/route/single/${route.id}`, true);
      if (res.status === 200 || (res as { status?: number }).status === 204) {
        if (viewingRoute?.id === route.id) setViewingRoute(null);
        fetchRoutes();
        fetchRouteCipServices();
        setToastMessage({ type: "success", text: "Rota excluída." });
      } else {
        setToastMessage({ type: "error", text: (res.body as { message?: string })?.message ?? "Erro ao excluir." });
      }
    },
    [viewingRoute, DeleteAPI, fetchRoutes, fetchRouteCipServices]
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`rounded-lg border p-4 ${
            toastMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm">{toastMessage.text}</p>
          <button
            type="button"
            className="mt-2 text-sm underline"
            onClick={() => setToastMessage(null)}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Ações da aba (filtros e nova rota) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-0.5">
                {activeFiltersCount}
              </Badge>
            )}
          </button>
          <button
            type="button"
            onClick={handleCreateRoute}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Rota
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <PlanningRoutesFiltersPanel
            filters={filters}
            onApply={applyFilters}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Rotas (chips) */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Rotas ({permanentRoutes.length})
          </h2>
          {permanentRoutes.length > 0 && (
            <button
              type="button"
              onClick={() => setRoutesListExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              title={routesListExpanded ? "Ver apenas a primeira linha" : "Ver todas"}
            >
              {routesListExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Fechar
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Ver todas
                </>
              )}
            </button>
          )}
        </div>
        {permanentRoutes.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Nenhuma rota cadastrada. Clique em &quot;Nova Rota&quot; para criar.
          </p>
        ) : (
          <div
            className={`flex flex-wrap gap-2 transition-[max-height] duration-200 ${
              routesListExpanded ? "max-h-none" : "max-h-[3.25rem] overflow-hidden"
            }`}
          >
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
                  {(totalExecutionMinutesByRouteId.get(route.id) ?? 0) > 0 && (
                    <span className="ml-1.5 opacity-90">
                      ({formatExecutionMinutes(totalExecutionMinutesByRouteId.get(route.id) ?? 0)})
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
                  onClick={() => handleDeleteRoute(route)}
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
          <p className="mt-2 text-xs text-primary font-medium">
            Visualizando: {viewingRoute.code} – {viewingRoute.name}
          </p>
        )}
      </div>

      {/* Action bar: serviços selecionados, sem rota visualizada → Criar nova rota ou Adicionar a rota existente */}
      {!viewingRoute && selectedServiceIds.size > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            {selectedServiceIds.size} serviço(s) selecionado(s)
            {totalExecutionMinutesSelected > 0 && (
              <span className="ml-2 font-normal text-slate-600">
                (tempo total estimado: {formatExecutionMinutes(totalExecutionMinutesSelected)})
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingRoute(null);
                setShowRouteModal(true);
              }}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Criar nova rota
            </button>
            <button
              type="button"
              onClick={() => setShowSelectRouteModal(true)}
              className="flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
            >
              <RouteIcon className="h-4 w-4" />
              Adicionar a rota existente
            </button>
          </div>
        </div>
      )}

      {/* Action bar: adicionar à rota visualizada */}
      {viewingRoute && selectedServiceIds.size > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            {selectedServiceIds.size} serviço(s) selecionado(s) → {viewingRoute.code}
            {totalExecutionMinutesSelected > 0 && (
              <span className="ml-2 font-normal text-slate-600">
                (+ {formatExecutionMinutes(totalExecutionMinutesSelected)})
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => handleAddToRoute(viewingRoute.id)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            <ArrowRight className="h-4 w-4" />
            Adicionar à rota
          </button>
        </div>
      )}

      {/* Action bar: remover da rota */}
      {viewingRoute && cipServiceIdsToRemove.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            {cipServiceIdsToRemove.length} serviço(s) selecionado(s) para remover
          </p>
          <button
            type="button"
            onClick={handleRemoveFromRoute}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Minus className="h-4 w-4" />
            Remover da rota
          </button>
        </div>
      )}

      {/* Grid: Serviços nesta rota | Serviços disponíveis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Serviços nesta rota */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="font-semibold text-slate-900">
              Serviços nesta rota
              {viewingRoute && totalExecutionMinutesViewingRoute > 0 && (
                <span className="ml-2 font-normal text-slate-600">
                  (total: {formatExecutionMinutes(totalExecutionMinutesViewingRoute)})
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {viewingRoute
                ? "Selecione para remover da rota."
                : "Selecione uma rota acima para ver os serviços."}
            </p>
            {viewingRoute && servicesInViewingRoute.length > 0 && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={allRouteServicesSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someRouteServicesSelected && !allRouteServicesSelected;
                  }}
                  onChange={toggleAllRouteServices}
                  className="h-4 w-4 rounded border-slate-300 text-primary"
                />
                {allRouteServicesSelected ? "Desmarcar todos" : "Marcar todos"}
              </label>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto p-4">
            {!viewingRoute ? (
              <p className="text-sm text-slate-500">Nenhuma rota selecionada.</p>
            ) : servicesInViewingRoute.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum serviço nesta rota.</p>
            ) : (
              <ul className="space-y-2">
                {servicesInViewingRoute.map((rcs) => (
                  <li
                    key={rcs.id}
                    className={`flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      selectedRouteServiceIds.has(rcs.id)
                        ? "border-primary bg-primary/5"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                    onClick={() => toggleRouteServiceSelection(rcs.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-800">
                        {rcs.cipService?.cip?.subset?.set?.equipment?.name ?? "—"} /{" "}
                        {rcs.cipService?.serviceModel?.name ?? "—"}
                      </span>
                      {equipmentSummary(rcs.cipService) && (
                        <p className="mt-1 text-xs text-slate-500">
                          {equipmentSummary(rcs.cipService)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (rcs.cipService) setServiceForDetails(rcs.cipService);
                      }}
                      className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      title="Ver detalhes do serviço"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedRouteServiceIds.has(rcs.id)}
                      onChange={() => toggleRouteServiceSelection(rcs.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Serviços disponíveis para adicionar */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Serviços disponíveis</h3>
            <p className="text-xs text-slate-500">
              Serviços ainda não vinculados a nenhuma rota. Selecione e adicione a uma rota.
            </p>
            {cipServicesAvailableForRoute.length > 0 && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={allAvailableSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someAvailableSelected && !allAvailableSelected;
                  }}
                  onChange={toggleAllAvailableServices}
                  className="h-4 w-4 rounded border-slate-300 text-primary"
                />
                {allAvailableSelected ? "Desmarcar todos" : "Marcar todos"}
              </label>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto p-4">
            {loadingServices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : cipServicesAvailableForRoute.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum serviço disponível (todos já estão em alguma rota ou não há resultados).
              </p>
            ) : (
              <ul className="space-y-2">
                {cipServicesAvailableForRoute.map((cs) => (
                  <li
                    key={cs.id}
                    className={`flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      selectedServiceIds.has(cs.id)
                        ? "border-primary bg-primary/5"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                    onClick={() => toggleServiceSelection(cs.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-800">
                        {cs.cip?.subset?.set?.equipment?.name ?? "—"} /{" "}
                        {cs.serviceModel?.name ?? "—"}
                        {cs.period?.name && (
                          <span className="ml-1 text-slate-500">({cs.period.name})</span>
                        )}
                      </span>
                      {equipmentSummary(cs) && (
                        <p className="mt-1 text-xs text-slate-500">
                          {equipmentSummary(cs)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setServiceForDetails(cs);
                      }}
                      className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      title="Ver detalhes do serviço"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.has(cs.id)}
                      onChange={() => toggleServiceSelection(cs.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
        initialSelectedServiceIds={editingRoute ? undefined : Array.from(selectedServiceIds)}
        initialCipServices={editingRoute ? undefined : cipServicesAvailableForRoute}
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
          await handleAddToRoute(routeId);
          setSelectedServiceIds(new Set());
          await fetchRouteCipServices();
          setShowSelectRouteModal(false);
        }}
      />

      <ServiceDetailsModal
        open={!!serviceForDetails}
        onClose={() => setServiceForDetails(null)}
        service={serviceForDetails}
      />
    </div>
  );
}
