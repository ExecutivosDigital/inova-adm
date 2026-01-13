import { MaterialsTable } from "@/components/materials/materials-table";
import { StockKPIs } from "@/components/materials/stock-kpis";
import { Input } from "@/components/ui/input";
import { Filter, Plus, Search } from "lucide-react";

export default function MateriaisPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Materiais
          </h1>
          <p className="text-slate-500">
            Controle de estoque de lubrificantes e insumos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
            <Plus className="h-4 w-4" />
            Novo Material
          </button>
        </div>
      </div>

      {/* KPIs */}
      <StockKPIs />

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, SKU ou fabricante..."
            className="pl-10"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Table */}
      <MaterialsTable />
    </div>
  );
}
