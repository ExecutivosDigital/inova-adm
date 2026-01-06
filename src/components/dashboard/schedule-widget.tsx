"use client";

import { cn } from "@/lib/utils";
import { Calendar, Clock, MoreHorizontal, User } from "lucide-react";
import { useState } from "react";

// Mock Data
const tasks = [
  {
    id: 1,
    title: "Troca de Óleo - Redutor A",
    type: "Lubrificação",
    status: "todo",
    assignee: "João",
    time: "08:00",
  },
  {
    id: 2,
    title: "Inspeção de Vibração - Motor 3",
    type: "Preditiva",
    status: "in_progress",
    assignee: "Maria",
    time: "09:30",
  },
  {
    id: 3,
    title: "Troca de Rolamento - Exaustor",
    type: "Mecânica",
    status: "blocked",
    assignee: "Carlos",
    time: "14:00",
  },
  {
    id: 4,
    title: "Limpeza de Filtros - Unid. Hidráulica",
    type: "Limpeza",
    status: "done",
    assignee: "Ana",
    time: "Yesterday",
  },
  {
    id: 5,
    title: "Reaperto de Conexões",
    type: "Mecânica",
    status: "todo",
    assignee: "Pedro",
    time: "10:00",
  },
];

const tabs = ["Hoje", "7 Dias", "15 Dias", "30 Dias"];

export function ScheduleWidget() {
  const [activeTab, setActiveTab] = useState("Hoje");

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div className="flex items-center gap-2">
          <Calendar className="text-primary h-5 w-5" />
          <h3 className="font-semibold text-slate-800">
            Cronograma de Execução
          </h3>
        </div>
        {/* Tabs */}
        <div className="flex rounded-lg bg-slate-50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board (Simplified) */}
      <div className="overflow-x-auto p-6">
        <div className="flex min-w-[800px] gap-4">
          {/* Column: To Do */}
          <KanbanColumn title="A Fazer" count={2} status="todo">
            {tasks
              .filter((t) => t.status === "todo")
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </KanbanColumn>

          {/* Column: In Progress */}
          <KanbanColumn title="Em Andamento" count={1} status="in_progress">
            {tasks
              .filter((t) => t.status === "in_progress")
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </KanbanColumn>

          {/* Column: Blocked */}
          <KanbanColumn title="Bloqueado" count={1} status="blocked">
            {tasks
              .filter((t) => t.status === "blocked")
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </KanbanColumn>

          {/* Column: Done */}
          <KanbanColumn title="Concluído" count={1} status="done">
            {tasks
              .filter((t) => t.status === "done")
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </KanbanColumn>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  status,
  children,
}: {
  title: string;
  count: number;
  status: string;
  children: React.ReactNode;
}) {
  const statusColors: Record<string, string> = {
    todo: "bg-slate-50 border-slate-200",
    in_progress: "bg-primary/5 border-primary/20",
    blocked: "bg-red-50 border-red-100",
    done: "bg-green-50 border-green-100",
  };

  const dotColors: Record<string, string> = {
    todo: "bg-slate-400",
    in_progress: "bg-primary",
    blocked: "bg-red-500",
    done: "bg-green-500",
  };

  return (
    <div className="min-w-[200px] flex-1">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", dotColors[status])} />
          <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        </div>
        <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
          {count}
        </span>
      </div>
      <div
        className={cn(
          "min-h-[150px] space-y-2 rounded-xl border p-2",
          statusColors[status],
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="group cursor-pointer rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-primary text-[10px] font-bold tracking-wider uppercase">
          {task.type}
        </span>
        <button className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <h5 className="mb-3 text-sm leading-tight font-medium text-slate-800">
        {task.title}
      </h5>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{task.time}</span>
        </div>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500"
          title={`Responsável: ${task.assignee}`}
        >
          <User className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
