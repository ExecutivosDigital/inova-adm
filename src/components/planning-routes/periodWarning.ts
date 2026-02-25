import type { CipService } from "@/lib/route-types";

const PERIOD_RATIO_THRESHOLD = 2;
const PERIOD_DAYS_DIFF_THRESHOLD = 60;

export interface PeriodWarningResult {
  shouldWarn: boolean;
  message?: string;
}

/**
 * Verifica se os períodos dos serviços selecionados são muito diferentes.
 * Retorna aviso quando a razão max/min > 2 ou a diferença em dias > 60.
 */
export function getPeriodDifferenceWarning(
  services: CipService[],
  selectedIds?: Set<string> | string[]
): PeriodWarningResult {
  const ids = selectedIds instanceof Set ? Array.from(selectedIds) : selectedIds;
  const list = ids?.length
    ? services.filter((s) => ids.includes(s.id))
    : services;

  const daysList = list
    .map((s) => s.period?.days)
    .filter((d): d is number => typeof d === "number" && d > 0);

  if (daysList.length < 2) {
    return { shouldWarn: false };
  }

  const minDays = Math.min(...daysList);
  const maxDays = Math.max(...daysList);
  const ratio = maxDays / minDays;
  const diff = maxDays - minDays;

  if (ratio > PERIOD_RATIO_THRESHOLD || diff > PERIOD_DAYS_DIFF_THRESHOLD) {
    return {
      shouldWarn: true,
      message: `Os períodos dos serviços selecionados são muito diferentes (de ${minDays} a ${maxDays} dias). Considere agrupar serviços com periodicidades próximas.`,
    };
  }

  return { shouldWarn: false };
}
