export function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Identity Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Identidade
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Fabricante
            </label>
            <p className="mt-1 text-slate-900">Flender</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Modelo/Série
            </label>
            <p className="mt-1 text-slate-900">H4SH18 - SN: 45678912</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">Ano</label>
            <p className="mt-1 text-slate-900">2018</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Tipo de Componente
            </label>
            <p className="mt-1 text-slate-900">Redutor de Velocidade</p>
          </div>
        </div>
      </div>

      {/* Operational Specifications */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Especificações Operacionais
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Potência
            </label>
            <p className="mt-1 text-slate-900">
              500 <span className="text-sm text-slate-500">HP</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">Tensão</label>
            <p className="mt-1 text-slate-900">
              480 <span className="text-sm text-slate-500">V</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Rotação Entrada
            </label>
            <p className="mt-1 text-slate-900">
              1800 <span className="text-sm text-slate-500">RPM</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Rotação Saída
            </label>
            <p className="mt-1 text-slate-900">
              450 <span className="text-sm text-slate-500">RPM</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Temperatura Operação
            </label>
            <p className="mt-1 text-slate-900">
              65 <span className="text-sm text-slate-500">°C (máx)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Dimensional (Engineering) */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Dados Dimensionais
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700">
              Rolamentos
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Diâmetro Externo</span>
                <span className="font-medium text-slate-900">
                  250 <span className="text-xs text-slate-500">mm</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Diâmetro Interno</span>
                <span className="font-medium text-slate-900">
                  170 <span className="text-xs text-slate-500">mm</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Largura</span>
                <span className="font-medium text-slate-900">
                  55 <span className="text-xs text-slate-500">mm</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-slate-700">
                  Fator DN
                </span>
                <span className="text-primary text-lg font-bold">382,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lubrication & Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Lubrificação & Filtros
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-500">
              Sistema de Lubrificação
            </label>
            <p className="mt-1 text-slate-900">Banho de Óleo + Bombeamento</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Filtros
            </label>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-slate-900">
                <span className="text-slate-500">Sucção:</span> 10 µm
              </p>
              <p className="text-sm text-slate-900">
                <span className="text-slate-500">Retorno:</span> 25 µm
              </p>
              <p className="text-sm text-slate-900">
                <span className="text-slate-500">Pressão:</span> 3 µm
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
