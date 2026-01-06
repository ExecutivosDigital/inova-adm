export function TechnicalTab() {
  return (
    <div className="space-y-6">
      {/* Identification */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Identificação
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-500">Nome</label>
            <p className="mt-1 font-medium text-slate-900">
              Mobilgear 600 XP 68
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">SKU</label>
            <p className="mt-1 text-slate-900">OLE-045</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Fabricante
            </label>
            <p className="mt-1 text-slate-900">Mobil (ExxonMobil)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Fornecedor
            </label>
            <p className="mt-1 text-slate-900">Distribuidor Autorizado XYZ</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">Tipo</label>
            <p className="mt-1 text-slate-900">Óleo Sint ético - ISO VG 68</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">
              Documentos
            </label>
            <button className="text-primary mt-1 flex items-center gap-1 text-sm font-medium hover:underline">
              Baixar Ficha Técnica/FISPQ
            </button>
          </div>
        </div>
      </div>

      {/* Physical Properties - Rheology */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Propriedades Físicas - Reologia
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Viscosidade @ 40°C</span>
            <span className="font-semibold text-slate-900">68 cSt</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Viscosidade @ 100°C</span>
            <span className="font-semibold text-slate-900">10.2 cSt</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">
              Índice de Viscosidade
            </span>
            <span className="font-semibold text-slate-900">160</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">
              Viscosidade do Óleo Base
            </span>
            <span className="font-semibold text-slate-900">PAO</span>
          </div>
        </div>
      </div>

      {/* Physical Properties - Safety */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Propriedades Físicas - Segurança
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Ponto de Fulgor</span>
            <span className="font-semibold text-slate-900">248°C</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Ponto de Ignição</span>
            <span className="font-semibold text-slate-900">275°C</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Ponto de Fluidez</span>
            <span className="font-semibold text-slate-900">-42°C</span>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Desempenho
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-primary/5 ring-primary/20 flex items-center justify-between rounded-lg p-3 ring-1">
            <span className="text-sm text-slate-600">Fator DN Suportado</span>
            <span className="text-primary text-lg font-bold">500,000</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Classificação</span>
            <span className="font-semibold text-slate-900">AGMA 9005-E02</span>
          </div>
        </div>
      </div>
    </div>
  );
}
