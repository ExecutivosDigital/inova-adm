"use client";

import { cn } from "@/lib/utils";
import {
  SERVICE_REQUEST_STATUS_LABELS,
  type ServiceRequestStatus,
} from "@/lib/service-request-types";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

interface ServiceRequestFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

export function ServiceRequestFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: ServiceRequestFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [status, dateFrom, dateTo].filter(Boolean).length;

  const clearFilters = () => {
    onStatusChange("");
    onDateFromChange("");
    onDateToChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por equipamento, OS, motivo..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
            filtersOpen
              ? "border-primary bg-primary/5 text-primary"
              : "border-slate-200 text-slate-700 hover:bg-slate-50",
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos</option>
              {(
                Object.entries(SERVICE_REQUEST_STATUS_LABELS) as [
                  ServiceRequestStatus,
                  string,
                ][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              De
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Até
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-end md:col-span-3">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
