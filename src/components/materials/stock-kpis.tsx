"use client";

import { AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";

export function StockKPIs() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Valor Total em Estoque
            </p>
            <h3 className="text-2xl font-bold text-slate-900">R$ 2,4M</h3>
          </div>
          <div className="bg-primary/10 ring-primary/20 text-primary rounded-xl p-3 ring-1">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          <span className="mr-2 font-medium text-green-600">↑ 12%</span>
          vs. mês anterior
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Itens Críticos
            </p>
            <h3 className="text-2xl font-bold text-slate-900">23</h3>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-red-600 ring-1 ring-red-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Abaixo do ponto de ressuprimento
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Itens Vencidos/Vencendo
            </p>
            <h3 className="text-2xl font-bold text-slate-900">5</h3>
          </div>
          <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600 ring-1 ring-yellow-100">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400">Próximos 30 dias</p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Taxa de Giro
            </p>
            <h3 className="text-2xl font-bold text-slate-900">4.2x</h3>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 ring-1 ring-blue-100">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400">Média anual</p>
      </div>
    </div>
  );
}
