"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

interface EquipmentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  criticality: string;
  onCriticalityChange: (value: string) => void;
  sectorFilter: string;
  onSectorFilterChange: (value: string) => void;
  sectorOptions: { id: string; name: string }[];
}

export function EquipmentFilters({
  search,
  onSearchChange,
  criticality,
  onCriticalityChange,
  sectorFilter,
  onSectorFilterChange,
  sectorOptions,
}: EquipmentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = [criticality, sectorFilter].filter(Boolean).length;

  const clearFilters = () => {
    onCriticalityChange("");
    onSectorFilterChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="default" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="hover:text-primary flex w-fit items-center gap-1 text-sm text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por TAG, nome ou modelo..."
          className="pl-10"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Setor
            </label>
            <Select
              value={sectorFilter || "all"}
              onValueChange={(v) => onSectorFilterChange(v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {sectorOptions.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Criticidade
            </label>
            <Select
              value={criticality || "all"}
              onValueChange={(v) => onCriticalityChange(v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="A">Alta</SelectItem>
                <SelectItem value="B">Média</SelectItem>
                <SelectItem value="C">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
