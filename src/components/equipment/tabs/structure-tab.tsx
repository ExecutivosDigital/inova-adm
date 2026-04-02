"use client";

import type {
  CipServiceFromApi,
  EquipmentFromApi,
  SetFromApi,
} from "@/lib/equipment-types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function formatText(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Título do acordeão: nome do modelo de serviço (nome “do” serviço no cadastro); sem ID. */
function getCipServiceAccordionTitle(service: CipServiceFromApi): string {
  const modelName = service.serviceModel?.name?.trim();
  if (modelName) return modelName;
  const procedureName = service.serviceProcedure?.name?.trim();
  if (procedureName) return procedureName;
  const reasonName = service.serviceReason?.name?.trim();
  if (reasonName) return reasonName;
  return "Serviço";
}

function ServiceDetailAccordion({ service }: { service: CipServiceFromApi }) {
  const title = getCipServiceAccordionTitle(service);

  const execLabel = service.executionTime
    ? `${service.executionTime.name}${
        service.executionTime.minutes != null
          ? ` (${service.executionTime.minutes} min)`
          : ""
      }`
    : null;

  return (
    <AccordionItem title={title}>
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div>
          <span className="text-slate-500">Modelo de serviço: </span>
          <span className="text-slate-900">
            {formatText(service.serviceModel?.name)}
          </span>
        </div>
        {service.serviceModel?.description ? (
          <div className="md:col-span-2">
            <span className="text-slate-500">Descrição: </span>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">
              {service.serviceModel.description}
            </p>
          </div>
        ) : null}
        <div>
          <span className="text-slate-500">Período: </span>
          <span className="text-slate-900">
            {formatText(service.period?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Dias (período): </span>
          <span className="text-slate-900">
            {service.period?.days != null ? String(service.period.days) : "—"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Prioridade: </span>
          <span className="text-slate-900">
            {formatText(service.priority?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Tempo de execução: </span>
          <span className="text-slate-900">{formatText(execLabel)}</span>
        </div>
        <div>
          <span className="text-slate-500">Equipe: </span>
          <span className="text-slate-900">{formatText(service.team?.name)}</span>
        </div>
        <div>
          <span className="text-slate-500">Condição do serviço: </span>
          <span className="text-slate-900">
            {formatText(service.serviceCondition?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Sistema de trabalho: </span>
          <span className="text-slate-900">
            {formatText(service.jobSystem?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Medidor: </span>
          <span className="text-slate-900">{formatText(service.meter?.name)}</span>
        </div>
        <div>
          <span className="text-slate-500">Procedimento: </span>
          <span className="text-slate-900">
            {formatText(service.serviceProcedure?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Motivo: </span>
          <span className="text-slate-900">
            {formatText(service.serviceReason?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Condição de segurança: </span>
          <span className="text-slate-900">
            {formatText(service.safetyCondition?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Kit de ferramentas: </span>
          <span className="text-slate-900">
            {formatText(service.toolkit?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Equipe extra: </span>
          <span className="text-slate-900">
            {formatText(service.extraTeam?.name)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Tempo estimado (equipe extra): </span>
          <span className="text-slate-900">
            {service.estimatedExtraTeamTime
              ? `${service.estimatedExtraTeamTime.name}${
                  service.estimatedExtraTeamTime.minutes != null
                    ? ` (${service.estimatedExtraTeamTime.minutes} min)`
                    : ""
                }`
              : "—"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Última execução: </span>
          <span className="text-slate-900">
            {formatDate(service.lastExecutionAt)}
          </span>
        </div>
      </div>
    </AccordionItem>
  );
}

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
                      {(subset.cips ?? []).map((cip) => {
                        const services = cip.cipServices ?? [];
                        return (
                          <div
                            key={cip.id}
                            className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                          >
                            <h5 className="mb-2 font-medium text-slate-900">
                              {cip.code} — {cip.name}
                            </h5>
                            <div className="mb-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                              <div>
                                <span className="text-slate-500">Posição: </span>
                                <span className="text-slate-900">
                                  {cip.position ?? "—"}
                                </span>
                              </div>
                              {services.length > 0 && (
                                <div>
                                  <span className="text-slate-500">Serviços: </span>
                                  <span className="text-slate-900">
                                    {services.length} vinculado(s)
                                  </span>
                                </div>
                              )}
                            </div>
                            {services.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                Nenhum serviço vinculado a este CIP.
                              </p>
                            ) : (
                              <div className="space-y-2 border-t border-slate-200 pt-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                  Detalhamento dos serviços
                                </p>
                                <div className="space-y-2 pl-0">
                                  {services.map((svc) => (
                                    <ServiceDetailAccordion
                                      key={svc.id}
                                      service={svc}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
