"use client";

import type { EquipmentFromApi, SetFromApi } from "@/lib/equipment-types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface StructureTabProps {
  equipment: EquipmentFromApi | null;
}

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
        <span className="font-medium text-slate-900">{title}</span>
      </button>
      {isOpen && <div className="space-y-3 p-4">{children}</div>}
    </div>
  );
}

export function StructureTab({ equipment }: StructureTabProps) {
  if (!equipment) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-500">Nenhum dado disponível.</p>
      </div>
    );
  }

  const sets: SetFromApi[] = equipment.sets ?? [];

  if (sets.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Estrutura Hierárquica & Serviços
        </h3>
        <p className="text-slate-500">
          Nenhum conjunto cadastrado para este equipamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Estrutura Hierárquica & Serviços
        </h3>
        <p className="mb-6 text-sm text-slate-500">
          Conjuntos, subconjuntos e pontos de inspeção e controle (CIPs)
        </p>

        <div className="space-y-3">
          {sets.map((setItem) => (
            <AccordionItem key={setItem.id} title={`${setItem.code} — ${setItem.name}`}>
              <div className="space-y-2 pl-4">
                {(setItem.subsets ?? []).map((subset) => (
                  <AccordionItem key={subset.id} title={`${subset.code} — ${subset.name}`}>
                    <div className="space-y-3 pl-4">
                      {(subset.cips ?? []).map((cip) => (
                        <div
                          key={cip.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                        >
                          <h5 className="mb-2 font-medium text-slate-900">
                            {cip.code} — {cip.name}
                          </h5>
                          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                            <div>
                              <span className="text-slate-500">Posição: </span>
                              <span className="text-slate-900">
                                {cip.position ?? "—"}
                              </span>
                            </div>
                            {cip.cipServices && (cip.cipServices as unknown[]).length > 0 && (
                              <div>
                                <span className="text-slate-500">Serviços: </span>
                                <span className="text-slate-900">
                                  {(cip.cipServices as unknown[]).length} vinculado(s)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(subset.cips ?? []).length === 0 && (
                        <p className="text-sm text-slate-500">
                          Nenhum CIP neste subconjunto.
                        </p>
                      )}
                    </div>
                  </AccordionItem>
                ))}
                {(setItem.subsets ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">
                    Nenhum subconjunto neste conjunto.
                  </p>
                )}
              </div>
            </AccordionItem>
          ))}
        </div>
      </div>
    </div>
  );
}
