"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { useFilterCatalogs } from "@/hooks/useFilterCatalogs";
import type {
  AutoGenerateFilters,
  AutoGenerateOptions,
  PlanningBalanceMode,
} from "@/lib/planning-advanced-types";
import { Calendar, ChevronDown, Filter, Info, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Agendamento com pelo menos data de início (para contagem no período) */
interface ScheduleWithDate {
  scheduledStartAt: string;
  type?: "route" | "service";
}

interface AutoGenerateModalProps {
  open: boolean;
  onClose: () => void;
  existingSchedules?: ScheduleWithDate[];
  onGenerate: (options: AutoGenerateOptions) => void;
  loading?: boolean;
}

export function AutoGenerateModal({
  open,
  onClose,
  existingSchedules = [],
  onGenerate,
  loading = false,
}: AutoGenerateModalProps) {
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
  const [validationAlert, setValidationAlert] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [pendingOptions, setPendingOptions] =
    useState<AutoGenerateOptions | null>(null);
  const [balanceMode, setBalanceMode] =
    useState<PlanningBalanceMode>("by_os_count");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AutoGenerateFilters>({});
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { catalogs, loading: catalogsLoading } = useFilterCatalogs();
  const { PostAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();

  // Preview counts
  const [previewCounts, setPreviewCounts] = useState<{
    services: number | null;
    routes: number | null;
    loading: boolean;
  }>({ services: null, routes: null, loading: false });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || !effectiveCompanyId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPreviewCounts((prev) => ({ ...prev, loading: true }));

    debounceRef.current = setTimeout(async () => {
      try {
        const filterPayload: Record<string, unknown> = {
          companyId: effectiveCompanyId,
        };
        if (filters.periodIds?.length) filterPayload.periodIds = filters.periodIds;
        if (filters.priorityIds?.length) filterPayload.priorityIds = filters.priorityIds;
        if (filters.teamIds?.length) filterPayload.teamIds = filters.teamIds;
        if (filters.serviceModelIds?.length) filterPayload.serviceModelIds = filters.serviceModelIds;
        if (filters.sectorIds?.length) filterPayload.sectorIds = filters.sectorIds;
        if (filters.equipmentTypeIds?.length) filterPayload.equipmentTypeIds = filters.equipmentTypeIds;

        const [serviceRes, routeRes] = await Promise.all([
          PostAPI("/filter-services", { ...filterPayload, limit: 1, page: 1, excludeInPermanentRoutes: true }, true),
          PostAPI("/planning/route-count", filterPayload, true),
        ]);

        const serviceTotal =
          serviceRes.status === 200
            ? (serviceRes.body as { total?: number })?.total ?? null
            : null;
        const routeTotal =
          routeRes.status === 200
            ? (routeRes.body as { count?: number })?.count ?? null
            : null;

        setPreviewCounts({ services: serviceTotal, routes: routeTotal, loading: false });
      } catch {
        setPreviewCounts({ services: null, routes: null, loading: false });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(startDate) > new Date(endDate)) {
      setValidationAlert({
        open: true,
        message: "A data de início deve ser anterior à data de fim.",
      });
      return;
    }

    const options: AutoGenerateOptions = { startDate, endDate, balanceMode };
    if (activeFilterCount > 0) {
      options.filters = filters;
    }
    setPendingOptions(options);
    setShowGenerateConfirm(true);
  };

  const handleConfirmGenerate = () => {
    if (pendingOptions) {
      onGenerate(pendingOptions);
      setPendingOptions(null);
    }
    setShowGenerateConfirm(false);
  };

  const summary = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate + "T23:59:59.999Z").getTime();
    const inPeriod = existingSchedules.filter((s) => {
      const t = new Date(s.scheduledStartAt).getTime();
      return t >= start && t <= end;
    });
    const routeCount = inPeriod.filter((s) => s.type === "route").length;
    const serviceCount = inPeriod.filter((s) => s.type === "service").length;
    return {
      existingInPeriodCount: inPeriod.length,
      routeCount,
      serviceCount,
    };
  }, [existingSchedules, startDate, endDate]);

  if (!open) return null;

  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="my-4 max-h-[min(90dvh,900px)] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white px-6 py-4">
            <Sparkles className="text-primary h-5 w-5 shrink-0" />
            <h3 className="text-lg font-semibold text-slate-900">
              Gerar Planejamento Automático
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
            {/* Modo de balanceamento - compacto */}
            <fieldset className="space-y-2">
              <legend className="mb-1 block text-sm font-medium text-slate-700">
                Modo de balanceamento
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3">
                  <input
                    type="radio"
                    name="balanceMode"
                    value="by_os_count"
                    checked={balanceMode === "by_os_count"}
                    onChange={() => setBalanceMode("by_os_count")}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="min-w-0 text-sm text-slate-700">
                    <span className="font-medium">Por quantidade de OS</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Distribui uniformemente entre dias úteis
                    </span>
                  </span>
                </label>
                <label className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3">
                  <input
                    type="radio"
                    name="balanceMode"
                    value="by_hours"
                    checked={balanceMode === "by_hours"}
                    onChange={() => setBalanceMode("by_hours")}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="min-w-0 text-sm text-slate-700">
                    <span className="font-medium">Por quantidade de horas</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Data calculada pela periodicidade
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

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
                  Período: <strong className="text-slate-700">{daysDiff} dias</strong>
                </span>
                {summary.existingInPeriodCount > 0 && (
                  <span className="text-amber-600">
                    {summary.existingInPeriodCount} agendamento(s) existente(s) serão ignorados
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
                      <span className="text-xs text-slate-500">Carregando filtros...</span>
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 text-xs text-slate-500">
                        Limite a geração apenas para rotas e serviços que atendam aos filtros selecionados.
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

            {/* Preview de contagem */}
            <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {previewCounts.loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <span>
                    Serviços: <strong className="text-slate-800">{previewCounts.services ?? "—"}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Rotas: <strong className="text-slate-800">{previewCounts.routes ?? "—"}</strong>
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="text-slate-400">(filtrado)</span>
                  )}
                </>
              )}
            </div>

            {/* Como funciona - colapsável */}
            <button
              type="button"
              onClick={() => setShowHowItWorks((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="underline">Como funciona?</span>
            </button>

            {showHowItWorks && (
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Por OS:</strong> ancora serviços com última execução
                    preenchida; distribui os demais em dias úteis balanceados.
                  </li>
                  <li>
                    <strong>Por horas:</strong> data obtida diretamente da
                    periodicidade.
                  </li>
                  <li>Respeita dias úteis e horário comercial configurado.</li>
                  <li>Agendamentos já existentes no período serão ignorados.</li>
                  <li>Você poderá ajustar manualmente após a geração.</li>
                </ul>
              </div>
            )}

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
                disabled={loading || daysDiff <= 0}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Gerar Planejamento
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
        open={showGenerateConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowGenerateConfirm(false);
            setPendingOptions(null);
          }
        }}
        title="Gerar planejamento automático"
        description={
          activeFilterCount > 0
            ? `Tem certeza que deseja gerar o planejamento automático com ${activeFilterCount} filtro(s) aplicado(s)? Rotas e serviços que já possuem agendamento no período serão ignorados.`
            : "Tem certeza que deseja gerar o planejamento automático? Rotas e serviços que já possuem agendamento no período serão ignorados."
        }
        confirmLabel="Gerar"
        onConfirm={handleConfirmGenerate}
      />
    </div>
  );
}
