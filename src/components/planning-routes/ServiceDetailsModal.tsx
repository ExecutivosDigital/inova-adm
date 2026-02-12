"use client";

import type { CipService } from "@/lib/route-types";
import {
    Calendar,
    Clock,
    Layers,
    Package,
    Settings,
    Tag,
    Users,
    Wrench,
    X,
} from "lucide-react";

interface ServiceDetailsModalProps {
  open: boolean;
  onClose: () => void;
  service: CipService | null;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 rounded bg-slate-100 p-1.5 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{String(value)}</p>
      </div>
    </div>
  );
}

export function ServiceDetailsModal({
  open,
  onClose,
  service,
}: ServiceDetailsModalProps) {
  if (!open) return null;

  const cip = service?.cip;
  const equipment = cip?.subset?.set?.equipment;
  const set = cip?.subset?.set;
  const subset = cip?.subset;

  const hasEquipmentCip =
    equipment?.name ||
    equipment?.tag ||
    equipment?.code ||
    set?.name ||
    subset?.name ||
    cip?.name ||
    cip?.code;

  const hasEquipmentRefs =
    equipment?.sector?.name ||
    equipment?.equipmentType?.name ||
    equipment?.manufacturer?.name ||
    equipment?.costCenter?.name ||
    equipment?.safetyCondition?.name ||
    equipment?.lubricationSystem?.name ||
    equipment?.mainComponent?.name ||
    equipment?.powerUnit?.name;
  const hasServiceInfo =
    service?.serviceModel?.name || service?.serviceModel?.description;
  const hasPlanningExecution =
    service?.period?.name ||
    service?.period?.days != null ||
    service?.priority?.name ||
    service?.executionTime?.name ||
    service?.team?.name ||
    service?.serviceCondition?.name ||
    service?.jobSystem?.name;

  const emptyGroupMessage = (
    <p className="py-3 text-center text-sm text-slate-500">
      Não informado
    </p>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Detalhes do serviço
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {!service ? (
            <p className="text-sm text-slate-500">Nenhum serviço selecionado.</p>
          ) : (
            <div className="space-y-6">
              {/* Identificação e equipamento */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Package className="h-4 w-4" />
                  Equipamento e CIP
                </h3>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  {hasEquipmentCip ? (
                    <>
                      <DetailRow
                        icon={Package}
                        label="Equipamento"
                        value={equipment?.name ?? equipment?.tag}
                      />
                      {equipment?.tag && equipment?.name && (
                        <DetailRow icon={Tag} label="Tag" value={equipment.tag} />
                      )}
                      {equipment?.code && (
                        <DetailRow
                          icon={Tag}
                          label="Código do equipamento"
                          value={equipment.code}
                        />
                      )}
                      <DetailRow icon={Layers} label="Set" value={set?.name} />
                      <DetailRow icon={Layers} label="Subset" value={subset?.name} />
                      <DetailRow icon={Tag} label="CIP" value={cip?.name} />
                      {cip?.code && (
                        <DetailRow
                          icon={Tag}
                          label="Código CIP"
                          value={cip.code}
                        />
                      )}
                    </>
                  ) : (
                    emptyGroupMessage
                  )}
                </div>
              </section>

              {/* Campos do cadastro de equipamento (setor, tipo, fabricante, etc.) */}
              {hasEquipmentRefs && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Package className="h-4 w-4" />
                    Dados do equipamento
                  </h3>
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                    <DetailRow
                      icon={Layers}
                      label="Setor"
                      value={equipment?.sector?.name}
                    />
                    <DetailRow
                      icon={Package}
                      label="Tipo de equipamento"
                      value={equipment?.equipmentType?.name}
                    />
                    <DetailRow
                      icon={Settings}
                      label="Fabricante"
                      value={equipment?.manufacturer?.name}
                    />
                    <DetailRow
                      icon={Tag}
                      label="Centro de custo"
                      value={equipment?.costCenter?.name}
                    />
                    <DetailRow
                      icon={Settings}
                      label="Condição de segurança"
                      value={equipment?.safetyCondition?.name}
                    />
                    <DetailRow
                      icon={Wrench}
                      label="Sistema de lubrificação"
                      value={equipment?.lubricationSystem?.name}
                    />
                    <DetailRow
                      icon={Package}
                      label="Componente principal"
                      value={equipment?.mainComponent?.name}
                    />
                    <DetailRow
                      icon={Settings}
                      label="Unidade de potência"
                      value={equipment?.powerUnit?.name}
                    />
                  </div>
                </section>
              )}

              {/* Modelo de serviço */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Settings className="h-4 w-4" />
                  Serviço
                </h3>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  {hasServiceInfo ? (
                    <>
                      <DetailRow
                        icon={Wrench}
                        label="Modelo de serviço"
                        value={service.serviceModel?.name}
                      />
                      {service.serviceModel?.description && (
                        <DetailRow
                          icon={Settings}
                          label="Descrição"
                          value={service.serviceModel.description}
                        />
                      )}
                    </>
                  ) : (
                    emptyGroupMessage
                  )}
                </div>
              </section>

              {/* Período, prioridade e execução */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4" />
                  Planejamento e execução
                </h3>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  {hasPlanningExecution ? (
                    <>
                      <DetailRow
                        icon={Calendar}
                        label="Período"
                        value={service.period?.name}
                      />
                      {service.period?.days != null && (
                        <DetailRow
                          icon={Calendar}
                          label="Dias (período)"
                          value={service.period.days}
                        />
                      )}
                      <DetailRow
                        icon={Tag}
                        label="Prioridade"
                        value={service.priority?.name}
                      />
                      <DetailRow
                        icon={Clock}
                        label="Tempo de execução"
                        value={service.executionTime?.name}
                      />
                      <DetailRow
                        icon={Users}
                        label="Equipe"
                        value={service.team?.name}
                      />
                      <DetailRow
                        icon={Settings}
                        label="Condição do serviço"
                        value={service.serviceCondition?.name}
                      />
                      <DetailRow
                        icon={Wrench}
                        label="Sistema de trabalho"
                        value={service.jobSystem?.name}
                      />
                    </>
                  ) : (
                    emptyGroupMessage
                  )}
                </div>
              </section>

              {/* IDs (opcional, para suporte) */}
              <section className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">ID do serviço: {service.id}</p>
              </section>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
