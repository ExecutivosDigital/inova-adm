"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

interface EquipmentHeaderProps {
  equipment: {
    id: string;
    tag: string;
    name: string;
    criticality: "alta" | "media" | "baixa";
    availability: number;
  };
}

const criticalityMap = {
  alta: { label: "Alta", variant: "high" as const },
  media: { label: "Média", variant: "medium" as const },
  baixa: { label: "Baixa", variant: "low" as const },
};

export function EquipmentHeader({ equipment }: EquipmentHeaderProps) {
  return (
    <div className="sticky top-0 z-10 -mx-8 -mt-6 border-b border-slate-200 bg-white px-8 py-4">
      <div className="flex items-start justify-between">
        {/* Left */}
        <div className="flex items-start gap-4">
          <Link
            href="/equipamentos"
            className="hover:text-primary mt-1 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            <span className="text-sm text-slate-400">IMG</span>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {equipment.tag}
              </h1>
              <Badge variant={criticalityMap[equipment.criticality].variant}>
                {criticalityMap[equipment.criticality].label}
              </Badge>
            </div>
            <p className="mb-2 text-slate-600">{equipment.name}</p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-slate-500">Disponibilidade: </span>
                <span className="text-primary font-semibold">
                  {equipment.availability}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
