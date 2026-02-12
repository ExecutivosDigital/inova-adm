"use client";

import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useFilterCatalogs } from "@/hooks/useFilterCatalogs";
import type { FilterServicesPayload } from "@/lib/route-types";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface PlanningRoutesFiltersPanelProps {
  filters: FilterServicesPayload;
  onApply: (filters: FilterServicesPayload) => void;
  onClose?: () => void;
  /** Se true, exibe em layout compacto (ex.: dentro de modal/sheet) */
  compact?: boolean;
}

export function PlanningRoutesFiltersPanel({
  filters,
  onApply,
  onClose,
  compact = false,
}: PlanningRoutesFiltersPanelProps) {
  const { catalogs, loading, error } = useFilterCatalogs();
  const [draft, setDraft] = useState<FilterServicesPayload>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const toggleArray = useCallback((key: keyof FilterServicesPayload, id: string, checked: boolean) => {
    setDraft((prev) => {
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
  }, []);

  const handleApply = useCallback(() => {
    const payload: FilterServicesPayload = {};
    if (draft.periodIds?.length) payload.periodIds = draft.periodIds;
    if (draft.priorityIds?.length) payload.priorityIds = draft.priorityIds;
    if (draft.teamIds?.length) payload.teamIds = draft.teamIds;
    if (draft.serviceConditionIds?.length) payload.serviceConditionIds = draft.serviceConditionIds;
    if (draft.jobSystemIds?.length) payload.jobSystemIds = draft.jobSystemIds;
    if (draft.executionTimeIds?.length) payload.executionTimeIds = draft.executionTimeIds;
    if (draft.extraTeamIds?.length) payload.extraTeamIds = draft.extraTeamIds;
    if (draft.estimatedExtraTeamTimeIds?.length)
      payload.estimatedExtraTeamTimeIds = draft.estimatedExtraTeamTimeIds;
    if (draft.serviceModelIds?.length) payload.serviceModelIds = draft.serviceModelIds;
    if (draft.epiIds?.length) payload.epiIds = draft.epiIds;
    if (draft.toolkitIds?.length) payload.toolkitIds = draft.toolkitIds;
    if (draft.sectorIds?.length) payload.sectorIds = draft.sectorIds;
    if (draft.equipmentTypeIds?.length) payload.equipmentTypeIds = draft.equipmentTypeIds;
    if (draft.manufacturerIds?.length) payload.manufacturerIds = draft.manufacturerIds;
    if (draft.costCenterIds?.length) payload.costCenterIds = draft.costCenterIds;
    if (draft.safetyConditionIds?.length) payload.safetyConditionIds = draft.safetyConditionIds;
    if (draft.lubricationSystemIds?.length) payload.lubricationSystemIds = draft.lubricationSystemIds;
    if (draft.mainComponentIds?.length) payload.mainComponentIds = draft.mainComponentIds;
    if (draft.powerUnitIds?.length) payload.powerUnitIds = draft.powerUnitIds;
    onApply(payload);
    onClose?.();
  }, [draft, onApply, onClose]);

  const handleClear = useCallback(() => {
    setDraft({});
    onApply({});
    onClose?.();
  }, [onApply, onClose]);

  const activeCount = [
    draft.periodIds?.length,
    draft.priorityIds?.length,
    draft.teamIds?.length,
    draft.serviceConditionIds?.length,
    draft.jobSystemIds?.length,
    draft.executionTimeIds?.length,
    draft.extraTeamIds?.length,
    draft.estimatedExtraTeamTimeIds?.length,
    draft.serviceModelIds?.length,
    draft.epiIds?.length,
    draft.toolkitIds?.length,
    draft.sectorIds?.length,
    draft.equipmentTypeIds?.length,
    draft.manufacturerIds?.length,
    draft.costCenterIds?.length,
    draft.safetyConditionIds?.length,
    draft.lubricationSystemIds?.length,
    draft.mainComponentIds?.length,
    draft.powerUnitIds?.length,
  ].filter((n) => n && n > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-slate-600">Carregando opções de filtro...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  const gridClass = compact
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
    : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="space-y-4">
      {onClose && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-900">Filtros de serviços</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Filtre por dados do serviço (período, prioridade, time, modelo, EPI, toolkit, etc.) e por
        equipamento (setor, tipo, fabricante, centro de custo, condição de segurança, lubrificação,
        componente principal, unidade de potência). Os mesmos filtros valem para a lista e para a
        criação de rotas.
      </p>
      <div className={gridClass}>
        {catalogs.periods.length > 0 && (
          <MultiSelectDropdown
            label="Período"
            items={catalogs.periods}
            selectedIds={draft.periodIds ?? []}
            onToggle={(id, checked) => toggleArray("periodIds", id, checked)}
            searchPlaceholder="Buscar período..."
          />
        )}
        {catalogs.priorities.length > 0 && (
          <MultiSelectDropdown
              label="Prioridade"
              items={catalogs.priorities}
              selectedIds={draft.priorityIds ?? []}
              onToggle={(id, checked) => toggleArray("priorityIds", id, checked)}
              searchPlaceholder="Buscar prioridade..."
          />
        )}
        {catalogs.teams.length > 0 && (
          <MultiSelectDropdown
              label="Time"
              items={catalogs.teams}
              selectedIds={draft.teamIds ?? []}
              onToggle={(id, checked) => toggleArray("teamIds", id, checked)}
              searchPlaceholder="Buscar time..."
          />
        )}
        {catalogs.serviceConditions.length > 0 && (
          <MultiSelectDropdown
              label="Condição de serviço"
              items={catalogs.serviceConditions}
              selectedIds={draft.serviceConditionIds ?? []}
              onToggle={(id, checked) => toggleArray("serviceConditionIds", id, checked)}
              searchPlaceholder="Buscar condição..."
          />
        )}
        {catalogs.jobSystems.length > 0 && (
          <MultiSelectDropdown
              label="Sistema de trabalho"
              items={catalogs.jobSystems}
              selectedIds={draft.jobSystemIds ?? []}
              onToggle={(id, checked) => toggleArray("jobSystemIds", id, checked)}
              searchPlaceholder="Buscar sistema..."
          />
        )}
        {catalogs.executionTimes.length > 0 && (
          <MultiSelectDropdown
              label="Tempo de execução"
              items={catalogs.executionTimes}
              selectedIds={draft.executionTimeIds ?? []}
              onToggle={(id, checked) => toggleArray("executionTimeIds", id, checked)}
              searchPlaceholder="Buscar tempo..."
          />
        )}
        {catalogs.extraTeams.length > 0 && (
          <MultiSelectDropdown
              label="Time extra"
              items={catalogs.extraTeams}
              selectedIds={draft.extraTeamIds ?? []}
              onToggle={(id, checked) => toggleArray("extraTeamIds", id, checked)}
              searchPlaceholder="Buscar time extra..."
          />
        )}
        {catalogs.estimatedExtraTeamTimes.length > 0 && (
          <MultiSelectDropdown
              label="Tempo est. time extra"
              items={catalogs.estimatedExtraTeamTimes}
              selectedIds={draft.estimatedExtraTeamTimeIds ?? []}
              onToggle={(id, checked) => toggleArray("estimatedExtraTeamTimeIds", id, checked)}
              searchPlaceholder="Buscar..."
          />
        )}
        {catalogs.serviceModels.length > 0 && (
          <MultiSelectDropdown
              label="Modelo de serviço"
              items={catalogs.serviceModels}
              selectedIds={draft.serviceModelIds ?? []}
              onToggle={(id, checked) => toggleArray("serviceModelIds", id, checked)}
              searchPlaceholder="Buscar modelo..."
          />
        )}
        {catalogs.epis.length > 0 && (
          <MultiSelectDropdown
              label="EPI"
              items={catalogs.epis}
              selectedIds={draft.epiIds ?? []}
              onToggle={(id, checked) => toggleArray("epiIds", id, checked)}
              searchPlaceholder="Buscar EPI..."
          />
        )}
        {catalogs.toolkits.length > 0 && (
          <MultiSelectDropdown
              label="Toolkit"
              items={catalogs.toolkits}
              selectedIds={draft.toolkitIds ?? []}
              onToggle={(id, checked) => toggleArray("toolkitIds", id, checked)}
              searchPlaceholder="Buscar toolkit..."
          />
        )}
        {/* Filtros por equipamento */}
        {catalogs.sectors.length > 0 && (
          <MultiSelectDropdown
            label="Setor (equipamento)"
            items={catalogs.sectors}
            selectedIds={draft.sectorIds ?? []}
            onToggle={(id, checked) => toggleArray("sectorIds", id, checked)}
            searchPlaceholder="Buscar setor..."
          />
        )}
        {catalogs.equipmentTypes.length > 0 && (
          <MultiSelectDropdown
            label="Tipo de equipamento"
            items={catalogs.equipmentTypes}
            selectedIds={draft.equipmentTypeIds ?? []}
            onToggle={(id, checked) => toggleArray("equipmentTypeIds", id, checked)}
            searchPlaceholder="Buscar tipo..."
          />
        )}
        {catalogs.manufacturers.length > 0 && (
          <MultiSelectDropdown
            label="Fabricante"
            items={catalogs.manufacturers}
            selectedIds={draft.manufacturerIds ?? []}
            onToggle={(id, checked) => toggleArray("manufacturerIds", id, checked)}
            searchPlaceholder="Buscar fabricante..."
          />
        )}
        {catalogs.costCenters.length > 0 && (
          <MultiSelectDropdown
            label="Centro de custo"
            items={catalogs.costCenters}
            selectedIds={draft.costCenterIds ?? []}
            onToggle={(id, checked) => toggleArray("costCenterIds", id, checked)}
            searchPlaceholder="Buscar centro de custo..."
          />
        )}
        {catalogs.safetyConditions.length > 0 && (
          <MultiSelectDropdown
            label="Condição de segurança (equip.)"
            items={catalogs.safetyConditions}
            selectedIds={draft.safetyConditionIds ?? []}
            onToggle={(id, checked) => toggleArray("safetyConditionIds", id, checked)}
            searchPlaceholder="Buscar condição..."
          />
        )}
        {catalogs.lubricationSystems.length > 0 && (
          <MultiSelectDropdown
            label="Sistema de lubrificação"
            items={catalogs.lubricationSystems}
            selectedIds={draft.lubricationSystemIds ?? []}
            onToggle={(id, checked) => toggleArray("lubricationSystemIds", id, checked)}
            searchPlaceholder="Buscar sistema..."
          />
        )}
        {catalogs.mainComponents.length > 0 && (
          <MultiSelectDropdown
            label="Componente principal"
            items={catalogs.mainComponents}
            selectedIds={draft.mainComponentIds ?? []}
            onToggle={(id, checked) => toggleArray("mainComponentIds", id, checked)}
            searchPlaceholder="Buscar componente..."
          />
        )}
        {catalogs.powerUnits.length > 0 && (
          <MultiSelectDropdown
            label="Unidade de potência"
            items={catalogs.powerUnits}
            selectedIds={draft.powerUnitIds ?? []}
            onToggle={(id, checked) => toggleArray("powerUnitIds", id, checked)}
            searchPlaceholder="Buscar unidade..."
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {activeCount > 0 && (
          <span className="text-xs text-slate-500">{activeCount} filtro(s) ativo(s)</span>
        )}
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-1.5 text-sm font-medium text-white"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
