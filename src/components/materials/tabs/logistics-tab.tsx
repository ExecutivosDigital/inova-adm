"use client";

export function LogisticsTab() {
  const current = 180;
  const min = 50;
  const max = 500;
  const percentage = (current / max) * 100;

  return (
    <div className="space-y-6">
      {/* Location */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Localização
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Armazenagem
            </label>
            <p className="mt-1 text-slate-900">
              Almoxarifado Central - Prateleira B-14
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Tipo de Embalagem
            </label>
            <p className="mt-1 text-slate-900">Tambor 200L / Balde 20L</p>
          </div>
        </div>
      </div>

      {/* Stock Levels */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-6 text-lg font-semibold text-slate-900">
          Níveis de Controle
        </h3>

        {/* Gauge Chart */}
        <div className="mb-6">
          <div className="relative h-40">
            <svg viewBox="0 0 200 120" className="h-full w-full">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Progress Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#ed6842"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 2.51} 251`}
              />
              {/* Center Text */}
              <text
                x="100"
                y="90"
                textAnchor="middle"
                className="fill-slate-900 text-3xl font-bold"
              >
                {current}L
              </text>
              <text
                x="100"
                y="108"
                textAnchor="middle"
                className="fill-slate-500 text-sm"
              >
                em estoque
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between px-4">
            <div className="text-center">
              <p className="text-sm font-medium text-red-600">Mínimo</p>
              <p className="text-xl font-bold text-slate-900">{min}L</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Atual</p>
              <p className="text-primary text-xl font-bold">{current}L</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-green-600">Máximo</p>
              <p className="text-xl font-bold text-slate-900">{max}L</p>
            </div>
          </div>
        </div>

        {/* Resupply Data */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Ponto de Pedido
            </label>
            <p className="mt-1 font-medium text-slate-900">100 L</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Lead Time (Tempo de Entrega)
            </label>
            <p className="mt-1 font-medium text-slate-900">15 dias úteis</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Último Ressuprimento
            </label>
            <p className="mt-1 text-slate-900">15/12/2024</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Próximo Pedido Sugerido
            </label>
            <p className="text-primary mt-1 font-medium">Em 45 dias</p>
          </div>
        </div>
      </div>

      {/* Cost Information */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Informações de Custo
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Custo Unitário</span>
            <span className="font-semibold text-slate-900">R$ 160,00/L</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Valor em Estoque</span>
            <span className="font-semibold text-slate-900">R$ 28.800,00</span>
          </div>
          <div className="bg-primary/5 ring-primary/20 flex items-center justify-between rounded-lg p-3 ring-1">
            <span className="text-sm text-slate-600">Consumo Médio/Mês</span>
            <span className="text-primary font-semibold">42 L</span>
          </div>
        </div>
      </div>
    </div>
  );
}
