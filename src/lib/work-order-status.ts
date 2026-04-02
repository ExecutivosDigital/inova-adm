/**
 * Labels e cores para status de Ordem de Serviço (OS).
 * Verde: executado no prazo | Laranja: pendente | Vermelho: atrasado/recusado
 */

export type WorkOrderStatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "slate";

export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  scheduled: "Agendada",
  in_progress: "Em andamento",
  emitted: "Emitida",
  completed: "Concluída",
  cancelled: "Cancelada",
  refused: "Recusada",
  overdue: "Atrasada",
  paused: "Pausada",
  started: "Iniciada",
};

/** Variante de cor por status */
export const WORK_ORDER_STATUS_VARIANT: Record<string, WorkOrderStatusVariant> =
  {
    completed: "success",
    pending: "slate",
    scheduled: "purple",
    in_progress: "info",
    emitted: "warning",
    started: "info",
    paused: "warning",
    cancelled: "danger",
    refused: "danger",
    overdue: "danger",
  };

export function getWorkOrderStatusLabel(status: string): string {
  return WORK_ORDER_STATUS_LABELS[status] ?? status;
}

export function getWorkOrderStatusVariant(
  status: string,
): WorkOrderStatusVariant {
  return WORK_ORDER_STATUS_VARIANT[status] ?? "warning";
}

export interface WorkOrderStatusDisplay {
  label: string;
  variant: WorkOrderStatusVariant;
}

export function getWorkOrderStatusDisplay(
  status: string,
): WorkOrderStatusDisplay {
  return {
    label: getWorkOrderStatusLabel(status),
    variant: getWorkOrderStatusVariant(status),
  };
}

/** Classes Tailwind para badge por variante */
export const WORK_ORDER_VARIANT_CLASSES: Record<
  WorkOrderStatusVariant,
  { bg: string; text: string; border: string }
> = {
  success: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  warning: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  danger: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
  info: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

/** Verifica se todas as OS estão com status "completed". */
export function allWorkOrdersCompleted(
  workOrders: Array<{ status: string }>,
): boolean {
  return (
    workOrders.length > 0 && workOrders.every((wo) => wo.status === "completed")
  );
}

/** Verifica se há OS concluídas com problemas (cancelled ou refused). */
export function hasCompletedWithProblems(
  workOrders: Array<{ status: string }>,
): boolean {
  return workOrders.some(
    (wo) => wo.status === "cancelled" || wo.status === "refused",
  );
}

/** Para múltiplas OS: retorna a variante "mais crítica" para exibir no card. */
export function getSummaryVariantForWorkOrders(
  workOrders: Array<{ status: string }>,
): WorkOrderStatusVariant | null {
  if (!workOrders.length) return null;
  const order: WorkOrderStatusVariant[] = [
    "danger",
    "warning",
    "info",
    "purple",
    "slate",
    "success",
  ];
  let worst: WorkOrderStatusVariant = "success";
  for (const wo of workOrders) {
    const v = getWorkOrderStatusVariant(wo.status);
    if (order.indexOf(v) < order.indexOf(worst)) worst = v;
  }
  return worst;
}

/** Tipo mínimo para helpers de conclusão/problemas (evita dependência de ViewWorkOrdersModal). */
export interface WorkOrderForBadge {
  status: string;
  cipService?: {
    cancellationReason?: string | null;
    cancellationReasonName?: string | null;
  } | null;
  cipServices?: Array<{
    cancellationReason?: string | null;
    cancellationReasonName?: string | null;
  }>;
}
