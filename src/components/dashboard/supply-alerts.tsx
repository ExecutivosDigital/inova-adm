"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, ArrowRight, Droplets } from "lucide-react";

const alerts = [
  {
    id: 1,
    name: "Shell Gadus S2 V220",
    sku: "GRA-001",
    stock: 12,
    min: 20,
    unit: "kg",
  },
  {
    id: 2,
    name: "Mobil DTE 25 Ultra",
    sku: "OLE-045",
    stock: 180,
    min: 200,
    unit: "L",
  },
  {
    id: 3,
    name: "Filtro Hydac 0250",
    sku: "FIL-882",
    stock: 2,
    min: 5,
    unit: "un",
  },
];

export function SupplyAlertsWidget() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-slate-800">Alertas de Insumos</h3>
        </div>
        <button className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium transition-colors">
          Ver Todos <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="p-0">
        {alerts.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-4 transition-colors hover:bg-slate-50",
              index !== alerts.length - 1 && "border-b border-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {item.name}
                </p>
                <p className="text-xs text-slate-400">SKU: {item.sku}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-red-600">
                {item.stock}{" "}
                <span className="text-[10px] font-normal text-slate-400">
                  {item.unit}
                </span>
              </p>
              <p className="text-[10px] text-slate-400">Min: {item.min}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-b-xl border-t border-slate-100 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-500">
          Existem mais <span className="font-bold text-slate-700">8 itens</span>{" "}
          abaixo do estoque mínimo.
        </p>
      </div>
    </div>
  );
}
