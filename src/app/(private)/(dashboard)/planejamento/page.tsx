import { PlanningCalendar } from "@/components/planning/planning-calendar";
import { PlanningFilters } from "@/components/planning/planning-filters";
import { PlanningKanban } from "@/components/planning/planning-kanban";
import { PlanningList } from "@/components/planning/planning-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutGrid,
  LayoutList,
  Plus,
} from "lucide-react";

export default function PlanejamentoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Planejamento
          </h1>
          <p className="text-slate-500">
            Gestão de programação e execução de manutenções
          </p>
        </div>
        <button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
          <Plus className="h-4 w-4" />
          Nova Ordem de Serviço
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Esta Semana
              </p>
              <h3 className="text-2xl font-bold text-slate-900">24</h3>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 ring-1 ring-blue-100">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Ordens programadas</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Em Andamento
              </p>
              <h3 className="text-2xl font-bold text-slate-900">8</h3>
            </div>
            <div className="bg-primary/10 ring-primary/20 text-primary rounded-xl p-3 ring-1">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Execução em campo</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Concluídas
              </p>
              <h3 className="text-2xl font-bold text-slate-900">142</h3>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-600 ring-1 ring-green-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Neste mês</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Atrasadas
              </p>
              <h3 className="text-2xl font-bold text-slate-900">5</h3>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-red-600 ring-1 ring-red-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Requerem atenção</p>
        </div>
      </div>

      {/* Filters */}
      <PlanningFilters />

      {/* Main Content */}
      <Tabs defaultValue="kanban" className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <LayoutList className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban">
          <PlanningKanban />
        </TabsContent>

        <TabsContent value="list">
          <PlanningList />
        </TabsContent>

        <TabsContent value="calendar">
          <PlanningCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
