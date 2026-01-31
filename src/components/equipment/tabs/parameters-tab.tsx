"use client";

import type { EquipmentFromApi } from "@/lib/equipment-types";

interface ParametersTabProps {
  equipment: EquipmentFromApi | null;
}

function formatVal(
  value: string | number | null | undefined
): string {
  if (value == null || value === "") return "—";
  return String(value);
}

export function ParametersTab({ equipment }: ParametersTabProps) {
  if (!equipment) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-500">Nenhum dado disponível.</p>
      </div>
    );
  }

  const hasFluidParams =
    equipment.iso4406Required != null ||
    equipment.particleCountRequired != null ||
    equipment.pqiRequired != null ||
    equipment.varnishPotentialRequired != null ||
    equipment.varnishPotentialLevel != null ||
    equipment.concentrationPercentage != null ||
    equipment.phLevel != null ||
    equipment.alkalinity != null ||
    equipment.trampOilPercentage != null ||
    equipment.tanRequired != null ||
    equipment.tbnRequired != null ||
    equipment.demulsibilityRequired != null ||
    equipment.oxidationRequired != null ||
    equipment.rpvotRequired != null ||
    equipment.ftirRequired != null ||
    equipment.clayContentRequired != null;

  if (!hasFluidParams) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Parâmetros de Fluidos
        </h3>
        <p className="text-slate-500">
          Nenhum parâmetro de fluido cadastrado para este equipamento.
        </p>
      </div>
    );
  }

  const items: { label: string; value: string }[] = [
    { label: "ISO 4406", value: formatVal(equipment.iso4406Required) },
    {
      label: "Contagem de Partículas",
      value: formatVal(equipment.particleCountRequired),
    },
    { label: "PQI", value: formatVal(equipment.pqiRequired) },
    {
      label: "Potencial de Verniz (requerido)",
      value: formatVal(equipment.varnishPotentialRequired),
    },
    {
      label: "Nível de Verniz",
      value: formatVal(equipment.varnishPotentialLevel),
    },
    {
      label: "Concentração %",
      value: formatVal(equipment.concentrationPercentage),
    },
    { label: "pH", value: formatVal(equipment.phLevel) },
    { label: "Alcalinidade", value: formatVal(equipment.alkalinity) },
    {
      label: "Óleo arrastado %",
      value: formatVal(equipment.trampOilPercentage),
    },
    { label: "TAN (mg KOH/g)", value: formatVal(equipment.tanRequired) },
    { label: "TBN", value: formatVal(equipment.tbnRequired) },
    {
      label: "Demulsibilidade",
      value: formatVal(equipment.demulsibilityRequired),
    },
    { label: "Oxidação", value: formatVal(equipment.oxidationRequired) },
    { label: "RPVOT", value: formatVal(equipment.rpvotRequired) },
    { label: "FTIR", value: formatVal(equipment.ftirRequired) },
    {
      label: "Teor de Argila",
      value: formatVal(equipment.clayContentRequired),
    },
  ].filter((i) => i.value !== "—");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Requisitos e Parâmetros de Fluidos
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
            >
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
