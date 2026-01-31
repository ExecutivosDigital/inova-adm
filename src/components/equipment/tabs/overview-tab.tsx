"use client";

import type { EquipmentFromApi } from "@/lib/equipment-types";

interface OverviewTabProps {
  equipment: EquipmentFromApi | null;
}

function formatNum(value: number | null | undefined): string {
  if (value == null) return "—";
  return String(value);
}

export function OverviewTab({ equipment }: OverviewTabProps) {
  if (!equipment) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-500">Nenhum dado disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Identidade
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Fabricante
            </label>
            <p className="mt-1 text-slate-900">
              {equipment.manufacturer?.name ?? "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Modelo / Série
            </label>
            <p className="mt-1 text-slate-900">
              {equipment.model ?? "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">Ano</label>
            <p className="mt-1 text-slate-900">
              {equipment.year ?? "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">Setor</label>
            <p className="mt-1 text-slate-900">
              {equipment.sector?.name ?? "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Tipo de Equipamento
            </label>
            <p className="mt-1 text-slate-900">
              {equipment.equipmentType?.name ?? "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Centro de Custo
            </label>
            <p className="mt-1 text-slate-900">
              {equipment.costCenter?.name ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Especificações Operacionais
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Potência
            </label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.power)}{" "}
              <span className="text-sm text-slate-500">HP</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">RPM</label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.RPM)}{" "}
              <span className="text-sm text-slate-500">RPM</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Rotação Entrada
            </label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.initialRotation)}{" "}
              <span className="text-sm text-slate-500">RPM</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Rotação Saída
            </label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.finalRotation)}{" "}
              <span className="text-sm text-slate-500">RPM</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Temperatura Operação
            </label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.operationTemperature)}{" "}
              <span className="text-sm text-slate-500">°C</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Regime de Operação
            </label>
            <p className="mt-1 text-slate-900">
              {equipment.operationRegime ?? "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Posição Física
            </label>
            <p className="mt-1 text-slate-900">
              {equipment.physicalPosition ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Dados Dimensionais
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Diâmetro Externo
            </label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.externalDiameter)}{" "}
              <span className="text-sm text-slate-500">mm</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Diâmetro Interno
            </label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.innerDiameter)}{" "}
              <span className="text-sm text-slate-500">mm</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Largura (Rolamento)
            </label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.bearingWidth)}{" "}
              <span className="text-sm text-slate-500">mm</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">DN</label>
            <p className="mt-1 text-slate-900">
              {formatNum(equipment.DN)}
            </p>
          </div>
        </div>
      </div>

      {(equipment.filterOil ||
        equipment.filterPressure ||
        equipment.filterSuction ||
        equipment.filterReturn ||
        equipment.contaminationLevel) && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Lubrificação & Filtros
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-500">
                Nível de Contaminação
              </label>
              <p className="mt-1 text-slate-900">
                {equipment.contaminationLevel ?? "—"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">
                Filtros
              </label>
              <div className="mt-1 space-y-1 text-sm text-slate-900">
                {equipment.filterSuction && (
                  <p>
                    <span className="text-slate-500">Sucção:</span>{" "}
                    {equipment.filterSuction}
                  </p>
                )}
                {equipment.filterReturn && (
                  <p>
                    <span className="text-slate-500">Retorno:</span>{" "}
                    {equipment.filterReturn}
                  </p>
                )}
                {equipment.filterPressure && (
                  <p>
                    <span className="text-slate-500">Pressão:</span>{" "}
                    {equipment.filterPressure}
                  </p>
                )}
                {equipment.filterOil && (
                  <p>
                    <span className="text-slate-500">Óleo:</span>{" "}
                    {equipment.filterOil}
                  </p>
                )}
                {!equipment.filterOil &&
                  !equipment.filterPressure &&
                  !equipment.filterSuction &&
                  !equipment.filterReturn && (
                    <p className="text-slate-500">—</p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {equipment.description && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Descrição
          </h3>
          <p className="text-slate-700 whitespace-pre-wrap">
            {equipment.description}
          </p>
        </div>
      )}
    </div>
  );
}
