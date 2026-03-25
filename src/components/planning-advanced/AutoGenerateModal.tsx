"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AutoGenerateOptions, PlanningBalanceMode } from "@/lib/planning-advanced-types";
import { Calendar, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

/** Agendamento com pelo menos data de início (para contagem no período) */
interface ScheduleWithDate {
  scheduledStartAt: string;
  type?: "route" | "service";
}

interface AutoGenerateModalProps {
  open: boolean;
  onClose: () => void;
  /** Agendamentos já existentes (para mostrar quantos serão ignorados no período) */
  existingSchedules?: ScheduleWithDate[];
  onGenerate: (options: AutoGenerateOptions) => void;
  loading?: boolean;
}

export function AutoGenerateModal({
  open,
  onClose,
  existingSchedules = [],
  onGenerate,
  loading = false,
}: AutoGenerateModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    return oneYearLater.toISOString().split("T")[0];
  });
  const [validationAlert, setValidationAlert] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [pendingOptions, setPendingOptions] = useState<AutoGenerateOptions | null>(null);
  const [balanceMode, setBalanceMode] = useState<PlanningBalanceMode>("by_os_count");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(startDate) > new Date(endDate)) {
      setValidationAlert({
        open: true,
        message: "A data de início deve ser anterior à data de fim.",
      });
      return;
    }

    setPendingOptions({ startDate, endDate, balanceMode });
    setShowGenerateConfirm(true);
  };

  const handleConfirmGenerate = () => {
    if (pendingOptions) {
      onGenerate(pendingOptions);
      setPendingOptions(null);
    }
    setShowGenerateConfirm(false);
  };

  const summary = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate + "T23:59:59.999Z").getTime();
    const inPeriod = existingSchedules.filter((s) => {
      const t = new Date(s.scheduledStartAt).getTime();
      return t >= start && t <= end;
    });
    const routeCount = inPeriod.filter((s) => s.type === "route").length;
    const serviceCount = inPeriod.filter((s) => s.type === "service").length;
    return {
      existingInPeriodCount: inPeriod.length,
      routeCount,
      serviceCount,
    };
  }, [existingSchedules, startDate, endDate]);

  if (!open) return null;

  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="my-4 w-full max-w-2xl max-h-[min(90dvh,900px)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-900">
            Gerar Planejamento Automático
          </h3>
        </div>
        
        <p className="mb-4 text-sm text-slate-600">
          O sistema gera agendamentos conforme a periodicidade de cada serviço ou rota. O modo de
          balanceamento define como as datas são distribuídas no período.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 block text-sm font-medium text-slate-700">
              Modo de balanceamento
            </legend>
            <label className="flex min-w-0 cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="balanceMode"
                value="by_os_count"
                checked={balanceMode === "by_os_count"}
                onChange={() => setBalanceMode("by_os_count")}
                className="mt-0.5 shrink-0"
              />
              <span className="min-w-0 text-sm break-words text-slate-700">
                <span className="font-medium">Por quantidade de OS</span>
                <span className="mt-0.5 block text-slate-600">
                  Distribui as ordens de serviço de forma uniforme entre os dias úteis do período.
                  Serviços com contagem a partir da última execução (e data de última execução
                  preenchida) mantêm o calendário alinhado à periodicidade a partir dessa data.
                </span>
              </span>
            </label>
            <label className="flex min-w-0 cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="balanceMode"
                value="by_hours"
                checked={balanceMode === "by_hours"}
                onChange={() => setBalanceMode("by_hours")}
                className="mt-0.5 shrink-0"
              />
              <span className="min-w-0 text-sm break-words text-slate-700">
                <span className="font-medium">Por quantidade de horas</span>
                <span className="mt-0.5 block text-slate-600">
                  Coloca cada agendamento na data calculada estritamente pela periodicidade (comportamento
                  anterior). O balanceamento fino por carga de horas será tratado em uma próxima etapa.
                </span>
              </span>
            </label>
          </fieldset>

          {/* Período */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data de Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            
            {daysDiff > 0 && (
              <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">
                <p>
                  Período selecionado: <strong>{daysDiff} dias</strong>
                </p>
                <p className="mt-1">
                  O total de OS geradas depende da periodicidade; no modo &quot;por quantidade de
                  OS&quot;, a distribuição entre dias úteis tende a uniformizar a carga.
                </p>
                <p className="mt-1.5 text-blue-700">
                  Rotas e serviços que já possuem agendamento no período serão ignorados.
                </p>
              </div>
            )}
          </div>

          {/* Resumo do período (estilo igual à modal de OS em lote) */}
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Resumo do período</p>
            <p className="mt-1">
              Novos agendamentos seguem a periodicidade configurada. Agendamentos já existentes no
              período serão ignorados.
            </p>
            {summary.existingInPeriodCount > 0 && (
              <p className="mt-1.5 text-amber-700">
                <span className="font-medium">{summary.existingInPeriodCount}</span> agendamento(s) já existem no período selecionado e serão ignorados
                {summary.routeCount > 0 || summary.serviceCount > 0 ? (
                  <span> ({summary.routeCount} rota(s), {summary.serviceCount} serviço(s))</span>
                ) : null}.
              </p>
            )}
          </div>
          
          {/* Informações adicionais */}
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                No modo por OS: ancora serviços com &quot;contar período a partir da última
                execução&quot; e última execução preenchida; os demais preenchem o período com a
                mesma quantidade de visitas, em dias úteis balanceados.
              </li>
              <li>
                No modo por horas: cada data é obtida diretamente da periodicidade (como antes).
              </li>
              <li>Respeita dias úteis da empresa e horário comercial configurado.</li>
              <li>Você poderá ajustar manualmente após a geração.</li>
            </ul>
          </div>
          
          {/* Botões */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || daysDiff <= 0}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Gerar Planejamento
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>

      <ConfirmDialog
        open={validationAlert.open}
        onOpenChange={(open) => !open && setValidationAlert((prev) => ({ ...prev, open: false }))}
        title="Data inválida"
        description={validationAlert.message}
        onConfirm={() => setValidationAlert((prev) => ({ ...prev, open: false }))}
        alertMode
      />

      <ConfirmDialog
        open={showGenerateConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowGenerateConfirm(false);
            setPendingOptions(null);
          }
        }}
        title="Gerar planejamento automático"
        description="Tem certeza que deseja gerar o planejamento automático? Rotas e serviços que já possuem agendamento no período serão ignorados."
        confirmLabel="Gerar"
        onConfirm={handleConfirmGenerate}
      />
    </div>
  );
}
