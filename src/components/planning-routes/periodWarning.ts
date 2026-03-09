import type { CipService } from "@/lib/route-types";

export interface PeriodWarningResult {
  shouldWarn: boolean;
  message?: string;
}

/**
 * Verifica se algum serviço selecionado tem periodicidade diferente da rota.
 * Exibe aviso quando a rota tem routePeriodId e algum serviço selecionado tem periodId !== routePeriodId.
 */
export function getRoutePeriodMismatchWarning(
  routePeriodId: string | null | undefined,
  services: CipService[],
  selectedIds?: Set<string> | string[]
): PeriodWarningResult {
  if (!routePeriodId) return { shouldWarn: false };

  const ids = selectedIds instanceof Set ? Array.from(selectedIds) : selectedIds;
  const list = ids?.length
    ? services.filter((s) => ids.includes(s.id))
    : services;

  const withDifferentPeriod = list.filter(
    (s) => s.periodId != null && s.periodId !== routePeriodId
  );

  if (withDifferentPeriod.length === 0) return { shouldWarn: false };

  const names = withDifferentPeriod
    .map((s) => s.serviceModel?.name || s.period?.name || "Serviço")
    .slice(0, 3);
  const more = withDifferentPeriod.length > 3 ? ` e mais ${withDifferentPeriod.length - 3}` : "";

  return {
    shouldWarn: true,
    message: `${withDifferentPeriod.length} serviço(s) selecionado(s) têm periodicidade diferente da rota (${names.join(", ")}${more}). Deseja continuar?`,
  };
}
