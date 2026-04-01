"use client";

import type { WorkOrderSummary } from "@/components/planning-advanced/ViewWorkOrdersModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  CompanySchedule,
  PlanningRoute,
  PlanningService,
  ScheduleItem,
} from "@/lib/planning-advanced-types";
import { cn } from "@/lib/utils";
import {
  allWorkOrdersCompleted,
  getSummaryVariantForWorkOrders,
  hasCompletedWithProblems,
  WORK_ORDER_VARIANT_CLASSES,
} from "@/lib/work-order-status";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { eachDayOfInterval, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarPlus,
  CheckCircle2,
  FileText,
  Plus,
  Route as RouteIcon,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;

interface ImprovedWeekViewProps {
  schedules: ScheduleItem[];
  currentDate: Date;
  companySchedule: CompanySchedule;
  routes: PlanningRoute[];
  services: PlanningService[];
  onAddSchedule: (
    type: "route" | "service",
    dateKey: string,
    slotMin: number,
  ) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onMoveSchedule: (
    scheduleId: string,
    dateKey: string,
    slotMin: number,
  ) => void;
  onAssignWorkers?: (schedule: ScheduleItem) => void;
  readOnly?: boolean;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
  scheduleIdsWithOS?: Set<string>;
  totalAvailableHoursPerDay?: number;
  workerRoleCapacity?: Array<{
    id: string;
    name: string;
    workerCount: number;
    hoursPerDay: number;
  }>;
  cipServiceRoleMap?: Map<string, string[]>;
}

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

function dateToKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

interface ScheduleDragData {
  scheduleId: string;
  type: "route" | "service";
}

export function ImprovedWeekView({
  schedules,
  currentDate,
  companySchedule,
  routes,
  services,
  onAddSchedule,
  onRemoveSchedule,
  onMoveSchedule,
  onAssignWorkers,
  readOnly = false,
  onProgramar,
  workOrdersForSchedule,
  onViewWorkOrders,
  scheduleIdsWithOS,
  totalAvailableHoursPerDay,
  workerRoleCapacity,
  cipServiceRoleMap,
}: ImprovedWeekViewProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<ScheduleDragData | null>(
    null,
  );
  const [movingScheduleId, setMovingScheduleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  const workDaysSet = useMemo(
    () => new Set(companySchedule.workDays),
    [companySchedule.workDays],
  );

  // Calcular dias da semana
  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay()); // domingo = 0, volta 0 dias
    date.setHours(0, 0, 0, 0);
    return date;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    });
  }, [weekStart]);

  // Agrupar agendamentos por dia
  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    schedules.forEach((schedule) => {
      const scheduleDate = new Date(schedule.scheduledStartAt);
      const dateKey = dateToKey(scheduleDate);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(schedule);
    });
    return map;
  }, [schedules]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setActiveDragData((event.active.data?.current as ScheduleDragData) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      setActiveDragData(null);

      if (!over) return;
      const dayData = over.data?.current as
        | { dateKey: string; slotMin: number }
        | undefined;
      const cardData = active.data?.current as ScheduleDragData | undefined;

      if (
        dayData?.dateKey != null &&
        dayData?.slotMin != null &&
        cardData?.scheduleId
      ) {
        setMovingScheduleId(cardData.scheduleId);
        onMoveSchedule(cardData.scheduleId, dayData.dateKey, dayData.slotMin);
        setTimeout(() => setMovingScheduleId(null), 500);
      }
    },
    [onMoveSchedule],
  );

  const dayColumns = (
    <div className="overflow-x-auto">
      <div className="flex min-w-full gap-2 md:grid md:grid-cols-7">
        {weekDays.map((day) => (
          <DayColumn
            key={dateToKey(day)}
            day={day}
            schedules={schedulesByDay.get(dateToKey(day)) || []}
            isWorkDay={workDaysSet.has(day.getDay())}
            companySchedule={companySchedule}
            onAddSchedule={onAddSchedule}
            onRemoveSchedule={onRemoveSchedule}
            onMoveSchedule={onMoveSchedule}
            onAssignWorkers={onAssignWorkers}
            movingScheduleId={movingScheduleId}
            readOnly={readOnly}
            onProgramar={onProgramar}
            workOrdersForSchedule={workOrdersForSchedule}
            onViewWorkOrders={onViewWorkOrders}
            totalAvailableHoursPerDay={totalAvailableHoursPerDay}
            workerRoleCapacity={workerRoleCapacity}
            cipServiceRoleMap={cipServiceRoleMap}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {readOnly ? (
        dayColumns
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {dayColumns}
          <DragOverlay>
            {activeDragId && activeDragData ? (
              <div className="border-primary bg-primary/20 cursor-grabbing rounded border-2 px-3 py-2 text-sm font-medium text-slate-900 shadow-lg">
                Movendo...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function DayColumn({
  day,
  schedules,
  isWorkDay,
  companySchedule,
  onAddSchedule,
  onRemoveSchedule,
  onMoveSchedule,
  onAssignWorkers,
  movingScheduleId,
  readOnly = false,
  onProgramar,
  workOrdersForSchedule,
  onViewWorkOrders,
  totalAvailableHoursPerDay,
  workerRoleCapacity,
  cipServiceRoleMap,
}: {
  day: Date;
  schedules: ScheduleItem[];
  isWorkDay: boolean;
  companySchedule: CompanySchedule;
  onAddSchedule: (
    type: "route" | "service",
    dateKey: string,
    slotMin: number,
  ) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onMoveSchedule: (
    scheduleId: string,
    dateKey: string,
    slotMin: number,
  ) => void;
  onAssignWorkers?: (schedule: ScheduleItem) => void;
  movingScheduleId: string | null;
  readOnly?: boolean;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
  totalAvailableHoursPerDay?: number;
  workerRoleCapacity?: Array<{
    id: string;
    name: string;
    workerCount: number;
    hoursPerDay: number;
  }>;
  cipServiceRoleMap?: Map<string, string[]>;
}) {
  const dateKey = dateToKey(day);
  const isToday = isSameDay(day, new Date());

  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = new Date(a.scheduledStartAt);
    const dateB = new Date(b.scheduledStartAt);
    return dateA.getTime() - dateB.getTime();
  });

  const droppable = useDroppable({
    id: `day-${dateKey}`,
    data: {
      dateKey,
      slotMin: parseTimeToMinutes(companySchedule.businessHoursStart),
    },
  });

  return (
    <div
      ref={readOnly ? undefined : droppable.setNodeRef}
      className={cn(
        "flex min-w-[280px] flex-shrink-0 flex-col rounded-lg border bg-white md:min-w-0",
        isToday && "border-primary bg-primary/5",
        !isToday && isWorkDay && "border-slate-200",
        !isWorkDay && "border-slate-100 bg-slate-50",
        !readOnly && droppable.isOver && isWorkDay && "ring-primary/50 ring-2",
      )}
    >
      {/* Cabeçalho do dia */}
      <div
        className={cn(
          "border-b px-2 py-2",
          isToday ? "border-primary/20 bg-primary/5" : "border-slate-200",
        )}
      >
        {(() => {
          const hasCapacity =
            isWorkDay &&
            totalAvailableHoursPerDay != null &&
            totalAvailableHoursPerDay > 0;
          const scheduledMin = hasCapacity
            ? sortedSchedules.reduce((sum, s) => sum + (s.duration ?? 0), 0)
            : 0;
          const scheduledH = scheduledMin / 60;
          const ratio = hasCapacity
            ? scheduledH / totalAvailableHoursPerDay!
            : 0;
          const pct = Math.round(ratio * 100);
          const dotColor = !hasCapacity
            ? "bg-slate-300"
            : ratio >= 0.9
              ? "bg-red-500"
              : ratio >= 0.5
                ? "bg-amber-500"
                : "bg-green-500";

          return (
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "text-sm font-semibold",
                  isToday ? "text-primary" : "text-slate-700",
                )}
              >
                {format(day, "EEE, d", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1.5">
                {isWorkDay && sortedSchedules.length > 0 && (
                  <span className="text-xs text-slate-400">
                    {sortedSchedules.length} agend.
                  </span>
                )}
                {hasCapacity && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            dotColor,
                          )}
                        />
                        <span className="text-xs text-slate-500 tabular-nums">
                          {pct}%
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-56 p-3 text-xs">
                      <p className="mb-2 font-semibold text-slate-900">
                        Capacidade do dia
                      </p>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-slate-600">Planejado</span>
                        <span className="font-medium text-slate-900">
                          {scheduledH.toFixed(1)}h
                        </span>
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-slate-600">Disponível</span>
                        <span className="font-medium text-slate-900">
                          {totalAvailableHoursPerDay!.toFixed(1)}h
                        </span>
                      </div>
                      <div className="mb-3 h-1.5 w-full rounded-full bg-slate-200">
                        <div
                          className={cn("h-1.5 rounded-full", dotColor)}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      {workerRoleCapacity &&
                        workerRoleCapacity.length > 0 &&
                        (() => {
                          // Calcular horas planejadas por role
                          const plannedByRole = new Map<string, number>();
                          if (cipServiceRoleMap) {
                            for (const s of sortedSchedules) {
                              const serviceId =
                                s.type === "service" ? s.serviceId : undefined;
                              if (!serviceId) continue;
                              const roleIds =
                                cipServiceRoleMap.get(serviceId) ?? [];
                              const dur = (s.duration ?? 0) / 60;
                              for (const rid of roleIds) {
                                plannedByRole.set(
                                  rid,
                                  (plannedByRole.get(rid) ?? 0) + dur,
                                );
                              }
                            }
                          }

                          return (
                            <>
                              <p className="mb-1.5 font-semibold text-slate-900">
                                Por função
                              </p>
                              <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-1 text-[11px]">
                                <span className="font-medium text-slate-400">
                                  Função
                                </span>
                                <span className="text-right font-medium text-slate-400">
                                  Disp.
                                </span>
                                <span className="text-right font-medium text-slate-400">
                                  Plan.
                                </span>
                                {workerRoleCapacity.map((role) => {
                                  const planned =
                                    plannedByRole.get(role.id) ?? 0;
                                  return (
                                    <React.Fragment key={role.id}>
                                      <span className="truncate text-slate-600">
                                        {role.name} ({role.workerCount}x)
                                      </span>
                                      <span className="shrink-0 text-right text-slate-900 tabular-nums">
                                        ~{role.hoursPerDay.toFixed(1)}h
                                      </span>
                                      <span
                                        className={cn(
                                          "shrink-0 text-right font-medium tabular-nums",
                                          planned > 0
                                            ? "text-primary"
                                            : "text-slate-400",
                                        )}
                                      >
                                        {planned.toFixed(1)}h
                                      </span>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Lista de agendamentos */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1.5">
        {!isWorkDay ? (
          <p className="py-4 text-center text-xs text-slate-400">
            Não é dia útil
          </p>
        ) : (
          <>
            {sortedSchedules.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                <p className="mb-2 text-xs text-slate-400">
                  Nenhum agendamento
                </p>
              </div>
            ) : readOnly ? (
              sortedSchedules.map((schedule) => {
                const isRoute = schedule.type === "route";
                const displayName = isRoute
                  ? `${schedule.route?.code} – ${schedule.route?.name}`
                  : `${schedule.service?.name} (${schedule.service?.equipmentName})`;
                const scheduleDate = new Date(schedule.scheduledStartAt);
                const br = toBrazilLocal(scheduleDate);
                const timeStr = `${String(br.hours).padStart(2, "0")}:${String(br.minutes).padStart(2, "0")}`;
                return (
                  <ReadOnlyScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    timeStr={timeStr}
                    displayName={displayName}
                    isRoute={isRoute}
                    onProgramar={onProgramar}
                    workOrders={workOrdersForSchedule?.(schedule) ?? []}
                    onViewWorkOrders={onViewWorkOrders}
                  />
                );
              })
            ) : (
              sortedSchedules.map((schedule) => {
                const isRoute = schedule.type === "route";
                const displayName = isRoute
                  ? `${schedule.route?.code} – ${schedule.route?.name}`
                  : `${schedule.service?.name} (${schedule.service?.equipmentName})`;

                const scheduleDate = new Date(schedule.scheduledStartAt);
                const br = toBrazilLocal(scheduleDate);
                const timeStr = `${String(br.hours).padStart(2, "0")}:${String(br.minutes).padStart(2, "0")}`;

                const isMoving = movingScheduleId === schedule.id;
                const dragId = `schedule-${schedule.id}`;
                const dragData: ScheduleDragData = {
                  scheduleId: schedule.id,
                  type: schedule.type,
                };

                return (
                  <DraggableScheduleCard
                    key={schedule.id}
                    id={dragId}
                    data={dragData}
                    isMoving={isMoving}
                    schedule={schedule}
                    timeStr={timeStr}
                    displayName={displayName}
                    isRoute={isRoute}
                    onRemove={() => onRemoveSchedule(schedule.id)}
                    onAssignWorkers={
                      onAssignWorkers
                        ? () => onAssignWorkers(schedule)
                        : undefined
                    }
                    workOrders={workOrdersForSchedule?.(schedule) ?? []}
                  />
                );
              })
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  const startMin = parseTimeToMinutes(
                    companySchedule.businessHoursStart,
                  );
                  onAddSchedule("route", dateKey, startMin);
                }}
                className="hover:border-primary hover:bg-primary/5 hover:text-primary mt-1 flex shrink-0 items-center justify-center gap-1 rounded border border-dashed border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar agendamento
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

function ReadOnlyScheduleCard({
  schedule,
  timeStr,
  displayName,
  isRoute,
  onProgramar,
  workOrders = [],
  onViewWorkOrders,
}: {
  schedule: ScheduleItem;
  timeStr: string;
  displayName: string;
  isRoute: boolean;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrders?: WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
}) {
  const hasWO = workOrders.length > 0;

  if (hasWO) {
    const allCompleted = allWorkOrdersCompleted(workOrders);
    const withProblems = allCompleted && hasCompletedWithProblems(workOrders);
    const variant = allCompleted
      ? "success"
      : (getSummaryVariantForWorkOrders(workOrders) ?? "warning");
    const classes = WORK_ORDER_VARIANT_CLASSES[variant];
    const statusLabel = allCompleted
      ? withProblems
        ? "* Concluída"
        : "Concluída"
      : "Pendente";
    const woCode = workOrders[0]?.code
      ? String(workOrders[0].code).padStart(8, "0")
      : null;

    return (
      <div
        className={cn(
          "rounded-md border px-2 py-1.5",
          classes.border,
          classes.bg,
        )}
      >
        <div className="flex items-center gap-2">
          {isRoute ? (
            <RouteIcon className="text-primary h-4 w-4 shrink-0" />
          ) : (
            <Wrench className="text-primary h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {woCode ? `OS ${woCode}` : "OS emitida"}
              <span className="font-normal text-slate-600">
                {" "}
                · {displayName}
              </span>
            </p>
            <p className="truncate text-xs text-slate-500">
              {timeStr} · {formatDuration(schedule.duration)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end justify-center gap-1">
            <span
              className={cn(
                "max-w-[7rem] truncate rounded border px-1.5 py-0.5 text-center text-xs leading-tight font-medium",
                classes.bg,
                classes.text,
                classes.border,
              )}
              title={statusLabel}
            >
              {statusLabel}
            </span>
            {onViewWorkOrders && (
              <button
                type="button"
                onClick={() => onViewWorkOrders(workOrders)}
                title="Ver ordens de serviço"
                className="rounded border border-slate-300 bg-white p-1 text-slate-600 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const variant = getScheduleCardVariant(schedule, workOrders);
  const cardStyles = SCHEDULE_CARD_STYLES[variant];
  const showOverdueBadge = variant === "overdue";

  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5",
        cardStyles.border,
        cardStyles.bg,
      )}
    >
      <div className="flex items-center gap-2">
        {isRoute ? (
          <RouteIcon className="text-primary h-4 w-4 shrink-0" />
        ) : (
          <Wrench className="text-primary h-4 w-4 shrink-0" />
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <span className="shrink-0 text-xs text-slate-500 tabular-nums">
            {timeStr}
          </span>
          <span className="shrink-0 text-slate-300">·</span>
          <span className="shrink-0 text-xs text-slate-500">
            {formatDuration(schedule.duration)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showOverdueBadge && (
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-xs leading-tight font-medium",
                cardStyles.badgeBorder,
                cardStyles.badgeBg,
                cardStyles.badgeText,
              )}
            >
              Atrasado
            </span>
          )}
          {onProgramar && (
            <button
              type="button"
              onClick={() => onProgramar(schedule)}
              title="Programar"
              className="border-primary text-primary hover:bg-primary/5 shrink-0 rounded border bg-white p-1"
            >
              <CalendarPlus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-0.5 truncate pl-6 text-sm font-medium text-slate-900">
        {displayName}
      </p>
    </div>
  );
}

type ScheduleCardVariant =
  | "overdue"
  | "pending"
  | "wo_pending"
  | "wo_completed";

const SCHEDULE_CARD_STYLES: Record<
  ScheduleCardVariant,
  {
    border: string;
    bg: string;
    badgeBorder: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  overdue: {
    border: "border-red-300",
    bg: "bg-red-50",
    badgeBorder: "border-red-200",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
  },
  pending: {
    border: "border-primary/40",
    bg: "bg-primary/10",
    badgeBorder: "",
    badgeBg: "",
    badgeText: "",
  },
  wo_pending: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    badgeBorder: "border-amber-200",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  wo_completed: {
    border: "border-green-300",
    bg: "bg-green-50",
    badgeBorder: "border-green-200",
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
  },
};

function getScheduleCardVariant(
  schedule: ScheduleItem,
  workOrders: WorkOrderSummary[],
): ScheduleCardVariant {
  const now = new Date();
  const scheduledAt = new Date(schedule.scheduledStartAt);
  const isOverdue = scheduledAt < now;
  const hasWO = workOrders.length > 0;
  const allCompleted = hasWO && allWorkOrdersCompleted(workOrders);

  if (isOverdue && !(hasWO && allCompleted)) return "overdue";
  if (!hasWO) return "pending";
  if (allCompleted) return "wo_completed";
  return "wo_pending";
}

function DraggableScheduleCard({
  id,
  data,
  isMoving,
  schedule,
  timeStr,
  displayName,
  isRoute,
  onRemove,
  onAssignWorkers,
  workOrders = [],
}: {
  id: string;
  data: ScheduleDragData;
  isMoving: boolean;
  schedule: ScheduleItem;
  timeStr: string;
  displayName: string;
  isRoute: boolean;
  onRemove: () => void;
  onAssignWorkers?: () => void;
  workOrders?: WorkOrderSummary[];
}) {
  const hasWO = workOrders.length > 0;
  const variant = getScheduleCardVariant(schedule, workOrders);
  const styles = SCHEDULE_CARD_STYLES[variant];
  const locked = hasWO;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data,
      disabled: locked,
    });
  const cssTransform = transform
    ? CSS.Translate.toString(transform)
    : undefined;

  const woCode = workOrders[0]?.code
    ? String(workOrders[0].code).padStart(8, "0")
    : null;
  const showOverdueBadge = variant === "overdue" && !hasWO;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: cssTransform }}
      className={cn(
        "group rounded-md border px-2 py-1.5 transition-all",
        styles.border,
        styles.bg,
        locked
          ? "cursor-default"
          : "cursor-grab hover:shadow-md active:cursor-grabbing",
        isDragging && "z-10 opacity-50",
        isMoving && "opacity-60",
      )}
      {...(locked ? {} : listeners)}
      {...(locked ? {} : attributes)}
    >
      {/* Row 1: icon + time/duration + badges */}
      <div className="flex items-center gap-2">
        {isRoute ? (
          <RouteIcon className="text-primary h-4 w-4 shrink-0" />
        ) : (
          <Wrench className="text-primary h-4 w-4 shrink-0" />
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <span className="shrink-0 text-xs text-slate-500 tabular-nums">
            {timeStr}
          </span>
          <span className="shrink-0 text-slate-300">·</span>
          <span className="shrink-0 text-xs text-slate-500">
            {formatDuration(schedule.duration)}
          </span>
          {(schedule.assignedWorkerIds?.length ?? 0) > 0 && (
            <>
              <span className="shrink-0 text-slate-300">·</span>
              <span
                className="text-primary shrink-0 text-xs"
                title="Colaboradores atribuídos"
              >
                {schedule.assignedWorkerIds!.length} col.
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasWO && (
            <span
              className={cn(
                "flex items-center gap-0.5 truncate rounded border px-1.5 py-0.5 text-xs leading-tight font-medium",
                styles.badgeBorder,
                styles.badgeBg,
                styles.badgeText,
              )}
              title={woCode ? `OS ${woCode}` : "OS emitida"}
            >
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{woCode ? `OS ${woCode}` : "OS"}</span>
            </span>
          )}
          {showOverdueBadge && (
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-xs leading-tight font-medium",
                styles.badgeBorder,
                styles.badgeBg,
                styles.badgeText,
              )}
            >
              Atrasado
            </span>
          )}
        </div>
      </div>
      {/* Row 2: name + action buttons */}
      <div className="mt-0.5 flex items-center gap-1 pl-6">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
          {displayName}
        </p>
        {!locked && (
          <div className="flex shrink-0 items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
            {onAssignWorkers && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAssignWorkers();
                }}
                className="hover:text-primary rounded p-1 text-slate-400 hover:bg-slate-100"
                title="Atribuir colaboradores"
              >
                <Users className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
