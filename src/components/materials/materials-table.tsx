"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

// Mock data
const materials = [
  {
    id: "1",
    name: "Shell Gadus S2 V220",
    sku: "GRA-001",
    manufacturer: "Shell",
    type: "Graxa",
    current: 85,
    min: 20,
    max: 120,
    unit: "kg",
    value: "R$ 12.500",
  },
  {
    id: "2",
    name: "Mobilgear 600 XP 68",
    sku: "OLE-045",
    manufacturer: "Mobil",
    type: "Óleo Sintético",
    current: 180,
    min: 200,
    max: 500,
    unit: "L",
    value: "R$ 28.800",
  },
  {
    id: "3",
    name: "Hydac 0250 DN 010 BN4HC",
    sku: "FIL-882",
    manufacturer: "Hydac",
    type: "Filtro",
    current: 8,
    min: 5,
    max: 15,
    unit: "un",
    value: "R$ 4.200",
  },
  {
    id: "4",
    name: "Mobil DTE 25 Ultra",
    sku: "OLE-127",
    manufacturer: "Mobil",
    type: "Óleo Mineral",
    current: 420,
    min: 150,
    max: 600,
    unit: "L",
    value: "R$ 18.900",
  },
];

function getStockStatus(current: number, min: number, max: number) {
  const percentage = (current / max) * 100;
  if (current < min)
    return { label: "Crítico", color: "bg-red-500", textColor: "text-red-600" };
  if (percentage < 40)
    return {
      label: "Baixo",
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
    };
  if (percentage < 70)
    return {
      label: "Normal",
      color: "bg-blue-500",
      textColor: "text-blue-600",
    };
  return { label: "Bom", color: "bg-green-500", textColor: "text-green-600" };
}

export function MaterialsTable() {
  return (
    <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead>Material</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((item) => {
            const status = getStockStatus(item.current, item.min, item.max);
            const percentage = Math.min((item.current / item.max) * 100, 100);

            return (
              <TableRow
                key={item.id}
                className="border-slate-100 hover:bg-slate-50/50"
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-700">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      SKU: {item.sku} • {item.manufacturer}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {item.type}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {item.current} {item.unit}
                      </span>
                      <span className="text-xs text-slate-400">
                        / {item.max} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn("h-full transition-all", status.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Min: {item.min} {item.unit}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn("text-sm font-medium", status.textColor)}>
                    {status.label}
                  </span>
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-700">
                  {item.value}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/materiais/${item.id}`}
                      className="group rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button className="group rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
