"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Calendar, Clock, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock data - Ordens de Serviço
const tasks = [
  {
    id: "1",
    equipment: "Moenda 01",
    equipmentId: "1",
    tag: "MOE-001",
    service: "Troca de Óleo",
    type: "Preventiva",
    status: "todo",
    technician: { name: "João Silva", avatar: "JS" },
    scheduledDate: "2025-01-18",
    estimatedTime: "2h",
    priority: "alta",
  },
  {
    id: "2",
    equipment: "Motor Exaustor 3",
    equipmentId: "2",
    tag: "MOT-045",
    service: "Análise de Vibração",
    type: "Preditiva",
    status: "in_progress",
    technician: { name: "Maria Santos", avatar: "MS" },
    scheduledDate: "2025-01-17",
    estimatedTime: "1h",
    priority: "media",
  },
  {
    id: "3",
    equipment: "Unidade Hidráulica",
    equipmentId: "3",
    tag: "HID-007",
    service: "Troca de Filtros",
    type: "Preventiva",
    status: "done",
    technician: { name: "Carlos Pereira", avatar: "CP" },
    scheduledDate: "2025-01-16",
    estimatedTime: "1.5h",
    priority: "baixa",
  },
  {
    id: "4",
    equipment: "Ventilador Industrial",
    equipmentId: "4",
    tag: "VEN-012",
    service: "Lubrificação de Mancais",
    type: "Preventiva",
    status: "blocked",
    technician: { name: "Ana Costa", avatar: "AC" },
    scheduledDate: "2025-01-17",
    estimatedTime: "0.5h",
    priority: "media",
  },
  {
    id: "5",
    equipment: "Redutor Transportador 2",
    equipmentId: "5",
    tag: "RED-023",
    service: "Inspeção Visual",
    type: "Inspeção",
    status: "todo",
    technician: { name: "Pedro Oliveira", avatar: "PO" },
    scheduledDate: "2025-01-19",
    estimatedTime: "1h",
    priority: "baixa",
  },
];

const statusMap = {
  todo: {
    label: "A Fazer",
    color: "bg-slate-50 border-slate-200",
    dotColor: "bg-slate-400",
  },
  in_progress: {
    label: "Em Andamento",
    color: "bg-primary/5 border-primary/20",
    dotColor: "bg-primary",
  },
  blocked: {
    label: "Bloqueado",
    color: "bg-red-50 border-red-100",
    dotColor: "bg-red-500",
  },
  done: {
    label: "Concluído",
    color: "bg-green-50 border-green-100",
    dotColor: "bg-green-500",
  },
};

const priorityMap = {
  alta: { label: "Alta", variant: "high" as const },
  media: { label: "Média", variant: "medium" as const },
  baixa: { label: "Baixa", variant: "low" as const },
};

interface KanbanColumnProps {
  title: string;
  status: keyof typeof statusMap;
  tasks: typeof tasks;
}

function KanbanColumn({ title, status, tasks: allTasks }: KanbanColumnProps) {
  const filteredTasks = allTasks.filter((t) => t.status === status);
  const config = statusMap[status];

  return (
    <div className="min-w-[280px] flex-1">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", config.dotColor)} />
          <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        </div>
        <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
          {filteredTasks.length}
        </span>
      </div>

      <div
        className={cn(
          "min-h-[500px] space-y-2 rounded-xl border p-2",
          config.color,
        )}
      >
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: (typeof tasks)[0] }) {
  return (
    <div className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <Badge variant="default" className="text-[10px] font-bold uppercase">
          {task.type}
        </Badge>
        <div className="flex items-center gap-1">
          <Badge
            variant={priorityMap[task.priority].variant}
            className="text-[10px]"
          >
            {priorityMap[task.priority].label}
          </Badge>
          <button className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link
        href={`/equipamentos/${task.equipmentId}`}
        className="hover:text-primary block transition-colors"
      >
        <h5 className="mb-1 text-sm font-semibold text-slate-900">
          {task.equipment}
        </h5>
        <p className="mb-2 text-xs text-slate-500">TAG: {task.tag}</p>
      </Link>

      <p className="mb-3 text-sm text-slate-700">{task.service}</p>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{task.estimatedTime}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-500">
            {new Date(task.scheduledDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })}
          </span>
        </div>

        <div
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600"
          title={`Responsável: ${task.technician.name}`}
        >
          {task.technician.avatar}
        </div>
      </div>
    </div>
  );
}

export function PlanningKanban() {
  const [activeFilter, setActiveFilter] = useState("7-dias");

  const filters = [
    { id: "hoje", label: "Hoje" },
    { id: "7-dias", label: "7 Dias" },
    { id: "15-dias", label: "15 Dias" },
    { id: "30-dias", label: "30 Dias" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <AlertCircle className="h-4 w-4" />
          <span>
            <strong className="text-slate-900">{tasks.length}</strong> ordens
            ativas
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn title="A Fazer" status="todo" tasks={tasks} />
        <KanbanColumn title="Em Andamento" status="in_progress" tasks={tasks} />
        <KanbanColumn title="Bloqueado" status="blocked" tasks={tasks} />
        <KanbanColumn title="Concluído" status="done" tasks={tasks} />
      </div>
    </div>
  );
}
