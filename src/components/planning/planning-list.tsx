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
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

// Mock data - mesmas ordens do Kanban
const orders = [
  {
    id: "OS-001",
    equipment: "Moenda 01",
    equipmentId: "1",
    tag: "MOE-001",
    service: "Troca de Óleo",
    type: "Preventiva",
    status: "todo",
    technician: "João Silva",
    scheduledDate: "2025-01-18",
    estimatedTime: "2h",
    priority: "alta",
  },
  {
    id: "OS-002",
    equipment: "Motor Exaustor 3",
    equipmentId: "2",
    tag: "MOT-045",
    service: "Análise de Vibração",
    type: "Preditiva",
    status: "in_progress",
    technician: "Maria Santos",
    scheduledDate: "2025-01-17",
    estimatedTime: "1h",
    priority: "media",
  },
  {
    id: "OS-003",
    equipment: "Unidade Hidráulica",
    equipmentId: "3",
    tag: "HID-007",
    service: "Troca de Filtros",
    type: "Preventiva",
    status: "done",
    technician: "Carlos Pereira",
    scheduledDate: "2025-01-16",
    estimatedTime: "1.5h",
    priority: "baixa",
  },
  {
    id: "OS-004",
    equipment: "Ventilador Industrial",
    equipmentId: "4",
    tag: "VEN-012",
    service: "Lubrificação de Mancais",
    type: "Preventiva",
    status: "blocked",
    technician: "Ana Costa",
    scheduledDate: "2025-01-17",
    estimatedTime: "0.5h",
    priority: "media",
  },
  {
    id: "OS-005",
    equipment: "Redutor Transportador 2",
    equipmentId: "5",
    tag: "RED-023",
    service: "Inspeção Visual",
    type: "Inspeção",
    status: "todo",
    technician: "Pedro Oliveira",
    scheduledDate: "2025-01-19",
    estimatedTime: "1h",
    priority: "baixa",
  },
];

const statusMap = {
  todo: { label: "A Fazer", variant: "secondary" as const },
  in_progress: { label: "Em Andamento", variant: "default" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
  done: { label: "Concluído", variant: "success" as const },
};

const priorityMap = {
  alta: { label: "Alta", variant: "high" as const },
  media: { label: "Média", variant: "medium" as const },
  baixa: { label: "Baixa", variant: "low" as const },
};

const typeMap = {
  Preventiva: { variant: "success" as const },
  Preditiva: { variant: "default" as const },
  Corretiva: { variant: "warning" as const },
  Inspeção: { variant: "secondary" as const },
};

export function PlanningList() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>OS</TableHead>
            <TableHead>Equipamento</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Programada</TableHead>
            <TableHead>Tempo Est.</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium text-slate-900">
                {order.id}
              </TableCell>
              <TableCell>
                <Link
                  href={`/equipamentos/${order.equipmentId}`}
                  className="group"
                >
                  <p className="group-hover:text-primary font-medium text-slate-900 transition-colors">
                    {order.equipment}
                  </p>
                  <p className="text-sm text-slate-500">TAG: {order.tag}</p>
                </Link>
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {order.service}
              </TableCell>
              <TableCell>
                <Badge variant={typeMap[order.type]?.variant || "default"}>
                  {order.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {new Date(order.scheduledDate).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {order.estimatedTime}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {order.technician}
              </TableCell>
              <TableCell>
                <Badge variant={priorityMap[order.priority].variant}>
                  {priorityMap[order.priority].label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusMap[order.status].variant}>
                  {statusMap[order.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button className="hover:text-primary rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="hover:text-primary rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
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
