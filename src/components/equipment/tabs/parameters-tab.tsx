export function ParametersTab() {
  return (
    <div className="space-y-6">
      {/* Chemical Requirements */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Requisitos Químicos
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Demulsibilidade</span>
            <span className="font-semibold text-slate-900">40-37-3 (máx)</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">FTIR</span>
            <span className="font-semibold text-slate-900">Conforme</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Oxidação</span>
            <span className="font-semibold text-slate-900">{"<"}0.5 Abs</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">RPVOT</span>
            <span className="font-semibold text-slate-900">{">"}25%</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">TAN</span>
            <span className="font-semibold text-slate-900">
              {"<"}2.0 mg KOH/g
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">TBN</span>
            <span className="font-semibold text-slate-900">{">"}50%</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Teor de Argila</span>
            <span className="font-semibold text-slate-900">{"<"}8% (PQ)</span>
          </div>
        </div>
      </div>

      {/* Contamination Control */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Controle de Contaminação
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Nível de Verniz</span>
              <span className="font-semibold text-green-600">{"<"}20</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/4 bg-green-500"></div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">PQI</span>
            <span className="font-semibold text-slate-900">15</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text -slate-600 text-sm">
                Contagem de Partículas
              </span>
              <span className="text-primary font-semibold">16/14/11</span>
            </div>
            <p className="text-xs text-slate-500">ISO 4406</p>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">NAS 1638</span>
            <span className="font-semibold text-slate-900">Classe 7</span>
          </div>
        </div>
      </div>

      {/* Trending Chart Placeholder */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Tendência de Parâmetros
        </h3>
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50">
          <p className="text-slate-400">
            Gráfico de tendência será implementado aqui
          </p>
        </div>
      </div>
    </div>
  );
}
