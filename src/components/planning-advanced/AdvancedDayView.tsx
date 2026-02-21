"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Route as RouteIcon, Wrench } from "lucide-react";
import type {
  ScheduleItem,
  CompanySchedule,
  PlanningRoute,
  PlanningService,
} from "@/lib/planning-advanced-types";

interface AdvancedDayViewProps {
  schedules: ScheduleItem[];
  currentDate: Date;
  companySchedule: CompanySchedule;
  routes: PlanningRoute[];
  services: PlanningService[];
  onAddSchedule: (type: "route" | "service", dateKey: string, slotMin: number) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onMoveSchedule: (scheduleId: string, dateKey: string, slotMin: number) => void;
}

const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;

function toBrazilLocal(utcDate: Date) {
  const t = utcDate.getTime() - BRAZIL_OFFSET_MS;
  const b = new Date(t);
  return {
    y: b.getUTCFullYear(),
    m: b.getUTCMonth(),
    d: b.getUTCDate(),
    hours: b.getUTCHours(),
    minutes: b.getUTCMinutes(),
  };
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

function formatSlotLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function dateToKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AdvancedDayView({
  schedules,
  currentDate,
  companySchedule,
  routes,
  services,
  onAddSchedule,
  onRemoveSchedule,
  onMoveSchedule,
}: AdvancedDayViewProps) {
  const normalizedDate = startOfDay(currentDate);
  const dateKey = dateToKey(normalizedDate);
  const isToday = isSameDay(normalizedDate, startOfDay(new Date()));
  const dayOfWeek = normalizedDate.getDay();
  const isWorkDay = companySchedule.workDays.includes(dayOfWeek);

  // Filtrar agendamentos do dia
  const daySchedules = schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.scheduledStartAt);
    const scheduleDateKey = dateToKey(scheduleDate);
    return scheduleDateKey === dateKey;
  });

  // Ordenar por horário de início
  const sortedSchedules = [...daySchedules].sort((a, b) => {
    const dateA = new Date(a.scheduledStartAt);
    const dateB = new Date(b.scheduledStartAt);
    return dateA.getTime() - dateB.getTime();
  });

  // Calcular slots do dia
  const startMin = parseTimeToMinutes(companySchedule.businessHoursStart);
  const endMin = parseTimeToMinutes(companySchedule.businessHoursEnd);
  const lunchStart = companySchedule.lunchBreakStart
    ? parseTimeToMinutes(companySchedule.lunchBreakStart)
    : null;
  const lunchEnd = companySchedule.lunchBreakEnd
    ? parseTimeToMinutes(companySchedule.lunchBreakEnd)
    : null;

  const slots: { time: number; isLunch: boolean }[] = [];
  for (let m = startMin; m < endMin; m += 30) {
    const slotEnd = m + 30;
    const isLunch =
      lunchStart !== null &&
      lunchEnd !== null &&
      m < lunchEnd &&
      slotEnd > lunchStart;
    slots.push({ time: m, isLunch });
  }

  // Agrupar agendamentos por horário
  const schedulesByTime = new Map<number, ScheduleItem[]>();
  sortedSchedules.forEach((schedule) => {
    const scheduleDate = new Date(schedule.scheduledStartAt);
    const br = toBrazilLocal(scheduleDate);
    const timeMin = br.hours * 60 + br.minutes;
    const slotTime = Math.floor(timeMin / 30) * 30; // Arredondar para slot de 30min

    if (!schedulesByTime.has(slotTime)) {
      schedulesByTime.set(slotTime, []);
    }
    schedulesByTime.get(slotTime)!.push(schedule);
  });

  if (!isWorkDay) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">
            Este não é um dia útil
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Não há agendamentos disponíveis para este dia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Cabeçalho do dia */}
      <div
        className={cn(
          "border-b border-slate-200 bg-slate-50 p-4",
          isToday && "bg-primary/5 border-primary/20"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={cn(
                "text-lg font-semibold",
                isToday ? "text-primary" : "text-slate-900"
              )}
            >
              {format(normalizedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {sortedSchedules.length} agendamento(s) •{" "}
              {formatSlotLabel(startMin)} - {formatSlotLabel(endMin)}
              {lunchStart && lunchEnd && (
                <> • Almoço: {formatSlotLabel(lunchStart)} - {formatSlotLabel(lunchEnd)}</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const defaultSlot = startMin;
              onAddSchedule("route", dateKey, defaultSlot);
            }}
            className="flex items-center gap-2 rounded border border-primary bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de agendamentos */}
      <div className="flex-1 overflow-y-auto">
        {sortedSchedules.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-slate-500">Nenhum agendamento para este dia</p>
              <button
                type="button"
                onClick={() => {
                  const defaultSlot = startMin;
                  onAddSchedule("route", dateKey, defaultSlot);
                }}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Adicionar primeiro agendamento
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {slots.map((slot) => {
              const slotSchedules = schedulesByTime.get(slot.time) || [];
              
              // Se não há agendamentos neste slot, mostrar slot vazio (opcional)
              if (slotSchedules.length === 0 && slot.time % 60 === 0) {
                // Mostrar apenas slots de hora cheia vazios
                return (
                  <div
                    key={slot.time}
                    className={cn(
                      "p-3 transition-colors hover:bg-slate-50",
                      slot.isLunch && "bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 shrink-0 text-sm font-medium text-slate-400">
                        {formatSlotLabel(slot.time)}
                      </div>
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => onAddSchedule("route", dateKey, slot.time)}
                          className="text-xs text-slate-400 hover:text-primary"
                        >
                          + Adicionar agendamento
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (slotSchedules.length === 0) return null;

              return (
                <div
                  key={slot.time}
                  className={cn(
                    "p-3 transition-colors",
                    slot.isLunch && "bg-slate-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 shrink-0 pt-1 text-sm font-medium text-slate-700">
                      {formatSlotLabel(slot.time)}
                    </div>
                    <div className="flex-1 space-y-2">
                      {slotSchedules.map((schedule) => {
                        const isRoute = schedule.type === "route";
                        const displayName = isRoute
                          ? `${schedule.route?.code} – ${schedule.route?.name}`
                          : `${schedule.service?.name} (${schedule.service?.equipmentName})`;

                        return (
                          <div
                            key={schedule.id}
                            className={cn(
                              "group flex items-center justify-between rounded-lg border p-3 transition-all hover:shadow-md",
                              isRoute
                                ? "border-primary/40 bg-primary/10"
                                : "border-green-500/40 bg-green-50"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {isRoute ? (
                                <RouteIcon className="h-4 w-4 shrink-0 text-primary" />
                              ) : (
                                <Wrench className="h-4 w-4 shrink-0 text-green-600" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-900 truncate">
                                  {displayName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Duração: {formatDuration(schedule.duration)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveSchedule(schedule.id)}
                              className="shrink-0 rounded p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
