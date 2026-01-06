"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock data - ordens agendadas
const events = [
  {
    id: "OS-001",
    equipment: "Moenda 01",
    equipmentId: "1",
    service: "Troca de Óleo",
    type: "Preventiva",
    date: "2025-01-18",
    priority: "alta",
  },
  {
    id: "OS-002",
    equipment: "Motor Exaustor 3",
    equipmentId: "2",
    service: "Análise de Vibração",
    type: "Preditiva",
    date: "2025-01-17",
    priority: "media",
  },
  {
    id: "OS-003",
    equipment: "Unidade Hidráulica",
    equipmentId: "3",
    service: "Troca de Filtros",
    type: "Preventiva",
    date: "2025-01-16",
    priority: "baixa",
  },
  {
    id: "OS-004",
    equipment: "Ventilador Industrial",
    equipmentId: "4",
    service: "Lubrificação",
    type: "Preventiva",
    date: "2025-01-17",
    priority: "media",
  },
  {
    id: "OS-005",
    equipment: "Redutor Transportador 2",
    equipmentId: "5",
    service: "Inspeção Visual",
    type: "Inspeção",
    date: "2025-01-19",
    priority: "baixa",
  },
  {
    id: "OS-006",
    equipment: "Bomba Centrífuga 1",
    equipmentId: "6",
    service: "Substituição de Selo",
    type: "Corretiva",
    date: "2025-01-20",
    priority: "alta",
  },
  {
    id: "OS-007",
    equipment: "Compressor de Ar",
    equipmentId: "7",
    service: "Limpeza de Filtros",
    type: "Preventiva",
    date: "2025-01-22",
    priority: "baixa",
  },
];

const priorityColors = {
  alta: "border-l-4 border-l-red-500 bg-red-50",
  media: "border-l-4 border-l-yellow-500 bg-yellow-50",
  baixa: "border-l-4 border-l-green-500 bg-green-50",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function PlanningCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0)); // Janeiro 2025
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((event) => event.date === dateStr);
  };

  // Generate calendar grid
  const calendarDays = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="min-h-[120px]" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const isToday = day === 17 && month === 0 && year === 2025; // Mock today

    calendarDays.push(
      <div
        key={day}
        className={cn(
          "min-h-[120px] border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-50",
          isToday && "ring-primary ring-2 ring-inset",
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium",
              isToday
                ? "bg-primary flex h-6 w-6 items-center justify-center rounded-full text-white"
                : "text-slate-700",
            )}
          >
            {day}
          </span>
          {dayEvents.length > 0 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              {dayEvents.length}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <Link
              key={event.id}
              href={`/equipamentos/${event.equipmentId}`}
              className={cn(
                "block rounded px-2 py-1 text-xs transition-opacity hover:opacity-80",
                priorityColors[event.priority],
              )}
            >
              <p className="truncate font-medium text-slate-900">
                {event.service}
              </p>
              <p className="truncate text-slate-600">{event.equipment}</p>
            </Link>
          ))}
          {dayEvents.length > 2 && (
            <button className="text-primary w-full px-2 text-left text-xs hover:underline">
              +{dayEvents.length - 2} mais
            </button>
          )}
        </div>
      </div>,
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <button
          onClick={previousMonth}
          className="hover:text-primary rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900">
          {monthNames[month]} {year}
        </h2>

        <button
          onClick={nextMonth}
          className="hover:text-primary rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-red-500 bg-red-50" />
          <span className="text-slate-600">Alta Prioridade</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-yellow-500 bg-yellow-50" />
          <span className="text-slate-600">Média Prioridade</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-green-500 bg-green-50" />
          <span className="text-slate-600">Baixa Prioridade</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-primary h-3 w-3 rounded-full" />
          <span className="text-slate-600">Hoje</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-slate-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">{calendarDays}</div>
      </div>
    </div>
  );
}
