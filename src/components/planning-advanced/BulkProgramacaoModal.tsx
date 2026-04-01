"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { useFilterCatalogs } from "@/hooks/useFilterCatalogs";
import type {
  AutoGenerateFilters,
  ScheduleItem,
} from "@/lib/planning-advanced-types";
import type { RouteCipServiceItem } from "@/lib/route-types";
import { ChevronDown, ClipboardList, Filter, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface BulkProgramacaoModalProps {
  open: boolean;
  onClose: () => void;
  schedules: ScheduleItem[];
  /** IDs dos agendamentos que já possuem ordem de serviço emitida (serão ignorados) */
  scheduleIdsWithOS: Set<string>;
  /** Retorna quantas OS seriam emitidas para um agendamento */
  getWOCountForSchedule: (schedule: ScheduleItem) => number;
  /** Mapeamento rota → serviços para filtragem de rotas */
  routeCipServices: RouteCipServiceItem[];
  onConfirm: (
    startDate: string,
    endDate: string,
    filters?: AutoGenerateFilters,
  ) => void;
  loading?: boolean;
}

export function BulkProgramacaoModal({
  open,
  onClose,
  schedules,
  scheduleIdsWithOS,
  getWOCountForSchedule,
  routeCipServices,
  onConfirm,
  loading = false,
}: BulkProgramacaoModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    return oneYearLater.toISOString().split("T")[0];
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AutoGenerateFilters>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  const { catalogs, loading: catalogsLoading } = useFilterCatalogs();
  const { PostAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();

  // IDs de cipServices que casam com os filtros selecionados (null = sem filtro ativo)
  const [filteredCipServiceIds, setFilteredCipServiceIds] = useState<Set<string> | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Busca IDs de cipServices que casam com os filtros (mesmo padrão do ProgramacaoCalendarContainer)
  useEffect(() => {
    if (!open || !effectiveCompanyId) return;

    const hasActive = Object.values(filters).some(
      (v) => Array.isArray(v) && v.length > 0,
    );

    if (!hasActive) {
      setFilteredCipServiceIds(null);
      setFilterLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilterLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const filterPayload: Record<string, unknown> = {
          companyId: effectiveCompanyId,
        };
        if (filters.periodIds?.length)
          filterPayload.periodIds = filters.periodIds;
        if (filters.priorityIds?.length)
          filterPayload.priorityIds = filters.priorityIds;
        if (filters.teamIds?.length) filterPayload.teamIds = filters.teamIds;
        if (filters.serviceModelIds?.length)
          filterPayload.serviceModelIds = filters.serviceModelIds;
        if (filters.sectorIds?.length)
          filterPayload.sectorIds = filters.sectorIds;
        if (filters.equipmentTypeIds?.length)
          filterPayload.equipmentTypeIds = filters.equipmentTypeIds;

        const allIds: string[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await PostAPI(
            "/filter-services",
            { ...filterPayload, limit: 100, page },
            true,
          );
          if (res.status === 200 && res.body?.cipServices) {
            const batch = (
              res.body.cipServices as Array<{ id: string }>
            ).map((s) => s.id);
            allIds.push(...batch);
            const total =
              typeof res.body.total === "number" ? res.body.total : 0;
            hasMore = allIds.length < total;
            page += 1;
          } else {
            hasMore = false;
          }
        }
        setFilteredCipServiceIds(new Set(allIds));
      } catch {
        setFilteredCipServiceIds(null);
      } finally {
        setFilterLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, filters, effectiveCompanyId, PostAPI]);

  const toggleFilterArray = useCallback(
    (key: keyof AutoGenerateFilters, id: string, checked: boolean) => {
      setFilters((prev) => {
        const arr = (prev[key] as string[] | undefined) ?? [];
        const next = [...arr];
        if (checked) {
          if (!next.includes(id)) next.push(id);
        } else {
          const i = next.indexOf(id);
          if (i !== -1) next.splice(i, 1);
        }
        return { ...prev, [key]: next.length ? next : undefined };
      });
    },
    [],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        filters.periodIds?.length,
        filters.priorityIds?.length,
        filters.teamIds?.length,
        filters.serviceModelIds?.length,
        filters.sectorIds?.length,
        filters.equipmentTypeIds?.length,
      ].filter((n) => n && n > 0).length,
    [filters],
  );

  const summary = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate + "T23:59:59.999Z").getTime();
    const inPeriod: ScheduleItem[] = [];
    for (const s of schedules) {
      const t = new Date(s.scheduledStartAt).getTime();
      if (t >= start && t <= end) inPeriod.push(s);
    }
    const alreadyWithOS = inPeriod.filter((s) => scheduleIdsWithOS.has(s.id));

    // Filtra os agendamentos pendentes pelos cipServiceIds que casam com os filtros
    let toEmit = inPeriod.filter((s) => !scheduleIdsWithOS.has(s.id));
    if (filteredCipServiceIds) {
      toEmit = toEmit.filter((item) => {
        if (item.type === "service" && item.serviceId) {
          return filteredCipServiceIds.has(item.serviceId);
        }
        if (item.type === "route" && item.routeId) {
          const rcsForRoute = routeCipServices.filter(
            (rcs) => rcs.routeId === item.routeId,
          );
          return rcsForRoute.some((rcs) =>
            filteredCipServiceIds.has(rcs.cipServiceId),
          );
        }
        return true;
      });
    }

    const countWOsToEmit = toEmit.reduce(
      (acc, s) => acc + getWOCountForSchedule(s),
      0,
    );
    const routeCount = toEmit.filter((s) => s.type === "route").length;
    const serviceCount = toEmit.filter((s) => s.type === "service").length;
    return {
      totalInPeriod: inPeriod.length,
      routeCount,
      serviceCount,
      alreadyWithOSCount: alreadyWithOS.length,
      countWOsToEmit,
    };
  }, [
    schedules,
    startDate,
    endDate,
    scheduleIdsWithOS,
    getWOCountForSchedule,
    filteredCipServiceIds,
    routeCipServices,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(startDate) > new Date(endDate)) {
      setValidationAlert({
        open: true,
        message: "A data de início deve ser anterior à data de fim.",
      });
      return;
    }

    if (summary.countWOsToEmit === 0) return;
    setShowConfirm(true);
  };

  const handleConfirmEmit = () => {
    onConfirm(startDate, endDate, activeFilterCount > 0 ? filters : undefined);
    setShowConfirm(false);
  };

  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="my-4 max-h-[min(90dvh,900px)] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white px-6 py-4">
            <ClipboardList className="text-primary h-5 w-5 shrink-0" />
            <h3 className="text-lg font-semibold text-slate-900">
              Emitir Ordens de Serviço em Lote
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
            <p className="text-sm text-slate-600">
              Selecione o período e, opcionalmente, aplique filtros. Todas as
              rotas e serviços planejados no intervalo terão ordens de serviço
              emitidas. Os colaboradores atribuídos no planejamento serão
              vinculados a cada ordem.
            </p>

            {/* Período - datas lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Data de Fim
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            {/* Info compacta do período */}
            {daysDiff > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>
                  Período:{" "}
                  <strong className="text-slate-700">{daysDiff} dias</strong>
                </span>
                {summary.alreadyWithOSCount > 0 && (
                  <span className="text-amber-600">
                    {summary.alreadyWithOSCount} já possuem OS e serão ignorados
                  </span>
                )}
              </div>
            )}

            {/* Filtros colapsáveis */}
            <div className="rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {showFilters && (
                <div className="border-t border-slate-200 px-3 py-3">
                  {catalogsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="text-primary h-4 w-4 animate-spin" />
                      <span className="text-xs text-slate-500">
                        Carregando filtros...
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 text-xs text-slate-500">
                        Limite a emissão apenas para rotas e serviços que
                        atendam aos filtros selecionados.
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {catalogs.periods.length > 0 && (
                          <MultiSelectDropdown
                            label="Periodicidade"
                            items={catalogs.periods}
                            selectedIds={filters.periodIds ?? []}
                            onToggle={(id, checked) =>
                              toggleFilterArray("periodIds", id, checked)
                            }
                            searchPlaceholder="Buscar periodicidade..."
                          />
                        )}
                        {catalogs.priorities.length > 0 && (
                          <MultiSelectDropdown
                            label="Prioridade"
                            items={catalogs.priorities}
                            selectedIds={filters.priorityIds ?? []}
                            onToggle={(id, checked) =>
                              toggleFilterArray("priorityIds", id, checked)
                            }
                            searchPlaceholder="Buscar prioridade..."
                          />
                        )}
                        {catalogs.teams.length > 0 && (
                          <MultiSelectDropdown
                            label="Time"
                            items={catalogs.teams}
                            selectedIds={filters.teamIds ?? []}
                            onToggle={(id, checked) =>
                              toggleFilterArray("teamIds", id, checked)
                            }
                            searchPlaceholder="Buscar time..."
                          />
                        )}
                        {catalogs.serviceModels.length > 0 && (
                          <MultiSelectDropdown
                            label="Modelo de serviço"
                            items={catalogs.serviceModels}
                            selectedIds={filters.serviceModelIds ?? []}
                            onToggle={(id, checked) =>
                              toggleFilterArray("serviceModelIds", id, checked)
                            }
                            searchPlaceholder="Buscar modelo..."
                          />
                        )}
                        {catalogs.sectors.length > 0 && (
                          <MultiSelectDropdown
                            label="Setor"
                            items={catalogs.sectors}
                            selectedIds={filters.sectorIds ?? []}
                            onToggle={(id, checked) =>
                              toggleFilterArray("sectorIds", id, checked)
                            }
                            searchPlaceholder="Buscar setor..."
                          />
                        )}
                        {catalogs.equipmentTypes.length > 0 && (
                          <MultiSelectDropdown
                            label="Tipo de equipamento"
                            items={catalogs.equipmentTypes}
                            selectedIds={filters.equipmentTypeIds ?? []}
                            onToggle={(id, checked) =>
                              toggleFilterArray("equipmentTypeIds", id, checked)
                            }
                            searchPlaceholder="Buscar tipo..."
                          />
                        )}
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilters({})}
                          className="mt-2 text-xs text-slate-500 underline hover:text-slate-700"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Preview de contagem - indicador de OS */}
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              <p className="mb-2 text-xs font-medium text-slate-700">
                Ordens de serviço a emitir
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                {filterLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    <span>
                      Serviços:{" "}
                      <strong className="text-slate-800">
                        {summary.serviceCount}
                      </strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Rotas:{" "}
                      <strong className="text-slate-800">
                        {summary.routeCount}
                      </strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-primary font-semibold">
                      Total de OS: {summary.countWOsToEmit}
                    </span>
                    {activeFilterCount > 0 && (
                      <span className="text-slate-400">(filtrado)</span>
                    )}
                  </>
                )}
              </div>
              {summary.totalInPeriod > 0 && summary.countWOsToEmit === 0 && !filterLoading && (
                <p className="mt-2 text-xs text-slate-500">
                  Nenhuma nova ordem a emitir (todos os agendamentos do período
                  já possuem OS).
                </p>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
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
                disabled={loading || summary.countWOsToEmit === 0}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Emitindo...
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4" />
                    Emitir ordens de serviço
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={validationAlert.open}
        onOpenChange={(open) =>
          !open && setValidationAlert((prev) => ({ ...prev, open: false }))
        }
        title="Data inválida"
        description={validationAlert.message}
        onConfirm={() =>
          setValidationAlert((prev) => ({ ...prev, open: false }))
        }
        alertMode
      />

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => {
          if (!open) setShowConfirm(false);
        }}
        title="Emitir ordens de serviço em lote"
        description={
          activeFilterCount > 0
            ? `Tem certeza que deseja emitir ${summary.countWOsToEmit} ordem(ns) de serviço com ${activeFilterCount} filtro(s) aplicado(s)? Agendamentos que já possuem OS serão ignorados.`
            : `Tem certeza que deseja emitir ${summary.countWOsToEmit} ordem(ns) de serviço? Agendamentos que já possuem OS serão ignorados.`
        }
        confirmLabel="Emitir"
        onConfirm={handleConfirmEmit}
      />
    </div>
  );
}
