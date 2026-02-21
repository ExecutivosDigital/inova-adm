"use client";

import { useState } from "react";
import { Loader2, Calendar, Sparkles } from "lucide-react";
import type { AutoGenerateOptions } from "@/lib/planning-advanced-types";

interface AutoGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (options: AutoGenerateOptions) => void;
  loading?: boolean;
}

export function AutoGenerateModal({
  open,
  onClose,
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(startDate) > new Date(endDate)) {
      alert("A data de início deve ser anterior à data de fim.");
      return;
    }
    
    onGenerate({
      startDate,
      endDate,
    });
  };
  
  if (!open) return null;
  
  const daysDiff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-900">
            Gerar Planejamento Automático
          </h3>
        </div>
        
        <p className="mb-4 text-sm text-slate-600">
          O sistema irá gerar automaticamente agendamentos baseados na periodicidade
          configurada de cada serviço, calculando as próximas datas a partir da
          última execução.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  O sistema gerará agendamentos para todos os serviços com
                  periodicidade configurada neste período.
                </p>
              </div>
            )}
          </div>
          
          {/* Informações adicionais */}
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Busca a última data de execução de cada serviço (ou usa a data
                atual se não houver histórico)
              </li>
              <li>
                Calcula as próximas datas baseado na periodicidade configurada
              </li>
              <li>
                Gera agendamentos respeitando dias úteis e horário de trabalho
              </li>
              <li>Você poderá ajustar manualmente após a geração</li>
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
  );
}
