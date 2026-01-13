import { TeamTable } from "@/components/people/team-table";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Search, UserCheck, Users, Wrench } from "lucide-react";

export default function PessoasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pessoas
          </h1>
          <p className="text-slate-500">
            Gestão de equipes e responsabilidades
          </p>
        </div>
        <button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
          <Plus className="h-4 w-4" />
          Novo Membro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Total de Membros
              </p>
              <h3 className="text-2xl font-bold text-slate-900">24</h3>
            </div>
            <div className="bg-primary/10 text-primary ring-primary/20 rounded-xl p-3 ring-1">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">5 departamentos</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">Ativos</p>
              <h3 className="text-2xl font-bold text-slate-900">20</h3>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-600 ring-1 ring-green-100">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Em campo hoje</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Férias/Afastados
              </p>
              <h3 className="text-2xl font-bold text-slate-900">4</h3>
            </div>
            <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600 ring-1 ring-yellow-100">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Retorno previsto</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Certificações
              </p>
              <h3 className="text-2xl font-bold text-slate-900">87</h3>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 ring-1 ring-blue-100">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400">8 expiram este mês</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nome, departamento ou especialidade..."
          className="pl-10"
        />
      </div>

      {/* Team Table */}
      <TeamTable />

      {/* Department Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Mecânica</h3>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
              8 membros
            </span>
          </div>
          <p className="text-sm text-slate-500">Responsável: João Silva</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Preditiva</h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
              4 membros
            </span>
          </div>
          <p className="text-sm text-slate-500">Responsável: Maria Santos</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Elétrica</h3>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
              6 membros
            </span>
          </div>
          <p className="text-sm text-slate-500">Responsável: Pedro Oliveira</p>
        </div>
      </div>
    </div>
  );
}
