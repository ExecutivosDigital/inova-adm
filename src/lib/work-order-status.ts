/**
 * Labels e cores para status de Ordem de Serviço (OS).
 * Verde: executado no prazo | Laranja: pendente | Vermelho: atrasado/recusado
 */

export type WorkOrderStatusVariant = "success" | "warning" | "danger";

export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  scheduled: "Agendada",
  in_progress: "Em andamento",
  emitted: "Emitido",
  completed: "Concluída",
  cancelled: "Cancelada",
  refused: "Recusado",
  overdue: "Atrasado",
};

/** Variante de cor por status: success = verde, warning = laranja, danger = vermelho */
export const WORK_ORDER_STATUS_VARIANT: Record<string, WorkOrderStatusVariant> = {
  completed: "success",
  pending: "warning",
  scheduled: "warning",
  in_progress: "warning",
  emitted: "warning",
  cancelled: "danger",
  refused: "danger",
  overdue: "danger",
};

export function getWorkOrderStatusLabel(status: string): string {
  return WORK_ORDER_STATUS_LABELS[status] ?? status;
}

export function getWorkOrderStatusVariant(status: string): WorkOrderStatusVariant {
  return WORK_ORDER_STATUS_VARIANT[status] ?? "warning";
}

export interface WorkOrderStatusDisplay {
  label: string;
  variant: WorkOrderStatusVariant;
}

export function getWorkOrderStatusDisplay(status: string): WorkOrderStatusDisplay {
  return {
    label: getWorkOrderStatusLabel(status),
    variant: getWorkOrderStatusVariant(status),
  };
}

/** Classes Tailwind para badge por variante */
export const WORK_ORDER_VARIANT_CLASSES: Record<WorkOrderStatusVariant, { bg: string; text: string; border: string }> = {
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
};

/** Para múltiplas OS: retorna a variante "mais crítica" (danger > warning > success) para exibir no card. */
export function getSummaryVariantForWorkOrders(
  workOrders: Array<{ status: string }>
): WorkOrderStatusVariant | null {
  if (!workOrders.length) return null;
  const order: WorkOrderStatusVariant[] = ["danger", "warning", "success"];
  let worst: WorkOrderStatusVariant = "success";
  for (const wo of workOrders) {
    const v = getWorkOrderStatusVariant(wo.status);
    if (order.indexOf(v) < order.indexOf(worst)) worst = v;
  }
  return worst;
}
