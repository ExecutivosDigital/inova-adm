import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { Plus } from "lucide-react";

export default function EquipamentosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Equipamentos
          </h1>
          <p className="text-slate-500">
            Gerenciamento completo de ativos da planta
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            <strong className="text-slate-900">248</strong> equipamentos
            cadastrados
          </span>
          <button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
            <Plus className="h-4 w-4" />
            Novo Equipamento
          </button>
        </div>
      </div>

      {/* Filters */}
      <EquipmentFilters />

      {/* Table */}
      <EquipmentTable />

      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>Mostrando 4 de 248 equipamentos</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-1.5 transition-colors hover:bg-slate-50">
            Anterior
          </button>
          <span className="px-3 py-1.5">Página 1 de 62</span>
          <button className="rounded-md border border-slate-200 px-3 py-1.5 transition-colors hover:bg-slate-50">
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
