import { DashboardKPIs } from "@/components/dashboard/kpi-cards";
import { ScheduleWidget } from "@/components/dashboard/schedule-widget";
import { SupplyAlertsWidget } from "@/components/dashboard/supply-alerts";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel de Controle
          </h1>
          <p className="text-slate-500">
            Visão geral da operação e planejamento.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
            Planta: <strong className="text-slate-900">Matriz (SP)</strong>
          </span>
          <button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nova Ordem
          </button>
        </div>
      </div>

      {/* A. KPIs de Topo */}
      <DashboardKPIs />

      <div className="grid h-[500px] grid-cols-1 gap-6 lg:grid-cols-3">
        {/* B. Widget: Cronograma (Ocupa 2/3) */}
        <div className="h-full lg:col-span-2">
          <ScheduleWidget />
        </div>

        {/* C. Widget: Alertas de Insumos (Ocupa 1/3) */}
        <div className="h-full lg:col-span-1">
          <SupplyAlertsWidget />
        </div>
      </div>
    </div>
  );
}
