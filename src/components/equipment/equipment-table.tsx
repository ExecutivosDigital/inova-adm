"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

// Mock data
const equipment = [
  {
    id: "1",
    photo: "/placeholder.jpg",
    tag: "MOE-001",
    name: "Moenda 01",
    model: "Redutor Flender H4SH18",
    sector: "Moagem",
    nextIntervention: "2025-02-15",
    status: "operacional",
    criticality: "alta",
  },
  {
    id: "2",
    photo: "/placeholder.jpg",
    tag: "MOT-045",
    name: "Motor Exaustor 3",
    model: "WEG W22 500HP",
    sector: "Ensaque",
    nextIntervention: "2025-01-20",
    status: "manutencao",
    criticality: "media",
  },
  {
    id: "3",
    photo: "/placeholder.jpg",
    tag: "HID-007",
    name: "Unidade Hidráulica Central",
    model: "Bosch Rexroth A10VSO",
    sector: "Utilidades",
    nextIntervention: "2025-03-10",
    status: "operacional",
    criticality: "alta",
  },
  {
    id: "4",
    photo: "/placeholder.jpg",
    tag: "VEN-012",
    name: "Ventilador Industrial",
    model: "TGM FAN-1200",
    sector: "Armazenagem",
    nextIntervention: "2025-01-28",
    status: "parado",
    criticality: "baixa",
  },
];

const statusMap = {
  operacional: { label: "Operacional", variant: "success" as const },
  parado: { label: "Parado", variant: "destructive" as const },
  manutencao: { label: "Em Manutenção", variant: "warning" as const },
};

const criticalityMap = {
  alta: { label: "Alta", variant: "high" as const },
  media: { label: "Média", variant: "medium" as const },
  baixa: { label: "Baixa", variant: "low" as const },
};

export function EquipmentTable() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Foto</TableHead>
            <TableHead>TAG/Nome</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Próxima Intervenção</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criticidade</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                  <span className="text-xs text-slate-400">IMG</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-900">{item.tag}</p>
                  <p className="text-sm text-slate-500">{item.name}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {item.model}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {item.sector}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {new Date(item.nextIntervention).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>
                <Badge variant={statusMap[item.status].variant}>
                  {statusMap[item.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={criticalityMap[item.criticality].variant}>
                  {criticalityMap[item.criticality].label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/equipamentos/${item.id}`}
                    className="hover:text-primary rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button className="hover:text-primary rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
