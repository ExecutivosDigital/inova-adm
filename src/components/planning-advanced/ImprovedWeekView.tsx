"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { CalendarPlus, CheckCircle2, Eye, FileText, Plus, Trash2, Route as RouteIcon, Users, Wrench } from "lucide-react";
import { format, isSameDay, startOfDay, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useCallback, useMemo, useState } from "react";
import type {
  ScheduleItem,
  CompanySchedule,
  PlanningRoute,
  PlanningService,
} from "@/lib/planning-advanced-types";
import type { WorkOrderSummary } from "@/components/planning-advanced/ViewWorkOrdersModal";
import {
  getSummaryVariantForWorkOrders,
  WORK_ORDER_VARIANT_CLASSES,
  allWorkOrdersCompleted,
  hasCompletedWithProblems,
} from "@/lib/work-order-status";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;

interface ImprovedWeekViewProps {
  schedules: ScheduleItem[];
  currentDate: Date;
  companySchedule: CompanySchedule;
  routes: PlanningRoute[];
  services: PlanningService[];
  onAddSchedule: (type: "route" | "service", dateKey: string, slotMin: number) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onMoveSchedule: (scheduleId: string, dateKey: string, slotMin: number) => void;
  onAssignWorkers?: (schedule: ScheduleItem) => void;
  readOnly?: boolean;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
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
}: ImprovedWeekViewProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<ScheduleDragData | null>(null);
  const [movingScheduleId, setMovingScheduleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  const workDaysSet = useMemo(
    () => new Set(companySchedule.workDays),
    [companySchedule.workDays]
  );

  // Calcular dias da semana
  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
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
      const dayData = over.data?.current as { dateKey: string; slotMin: number } | undefined;
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
    [onMoveSchedule]
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
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {dayColumns}
          <DragOverlay>
            {activeDragId && activeDragData ? (
              <div className="rounded border-2 border-primary bg-primary/20 px-3 py-2 text-sm font-medium text-slate-900 shadow-lg cursor-grabbing">
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
}: {
  day: Date;
  schedules: ScheduleItem[];
  isWorkDay: boolean;
  companySchedule: CompanySchedule;
  onAddSchedule: (type: "route" | "service", dateKey: string, slotMin: number) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onMoveSchedule: (scheduleId: string, dateKey: string, slotMin: number) => void;
  onAssignWorkers?: (schedule: ScheduleItem) => void;
  movingScheduleId: string | null;
  readOnly?: boolean;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
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
        "min-w-[280px] flex-shrink-0 flex flex-col rounded-lg border bg-white md:min-w-0",
        isToday && "border-primary bg-primary/5",
        !isToday && isWorkDay && "border-slate-200",
        !isWorkDay && "border-slate-100 bg-slate-50",
        !readOnly && droppable.isOver && isWorkDay && "ring-2 ring-primary/50"
      )}
    >
      {/* Cabeçalho do dia */}
      <div
        className={cn(
          "border-b p-3",
          isToday ? "border-primary/20 bg-primary/5" : "border-slate-200"
        )}
      >
        <div
          className={cn(
            "text-sm font-semibold",
            isToday ? "text-primary" : "text-slate-700"
          )}
        >
          {format(day, "EEE, d", { locale: ptBR })}
        </div>
        {isWorkDay && (
          <div className="mt-1 text-xs text-slate-500">
            {sortedSchedules.length} agendamento(s)
          </div>
        )}
      </div>

      {/* Lista de agendamentos */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 flex flex-col">
        {!isWorkDay ? (
          <p className="text-xs text-slate-400 text-center py-4">
            Não é dia útil
          </p>
        ) : (
          <>
            {sortedSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
                <p className="text-xs text-slate-400 mb-2">
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
                    onAssignWorkers={onAssignWorkers ? () => onAssignWorkers(schedule) : undefined}
                  />
                );
              })
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  const startMin = parseTimeToMinutes(companySchedule.businessHoursStart);
                  onAddSchedule("route", dateKey, startMin);
                }}
                className="mt-2 shrink-0 flex items-center justify-center gap-1 rounded border border-dashed border-slate-300 py-2 px-3 text-xs font-medium text-slate-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
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
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 transition-all",
        "border-primary/40 bg-primary/10"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {isRoute ? (
            <RouteIcon className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
          ) : (
            <Wrench className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-900 truncate">{displayName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{timeStr}</span>
              <span>•</span>
              <span>{formatDuration(schedule.duration)}</span>
              {workOrders.length > 0 && (() => {
                const allCompleted = allWorkOrdersCompleted(workOrders);
                const withProblems = allCompleted && hasCompletedWithProblems(workOrders);
                const variant = allCompleted ? "success" : (getSummaryVariantForWorkOrders(workOrders) ?? "warning");
                const classes = WORK_ORDER_VARIANT_CLASSES[variant];
                const badgeLabel = allCompleted ? (withProblems ? "* Concluída" : "Concluída") : "Emitida";
                const badgeTitle = allCompleted
                  ? (withProblems ? "Concluída com problema(s) relatado(s)" : "Ordem(ns) de serviço concluída(s)")
                  : "Ordem(ns) de serviço";
                return (
                  <span
                    className={cn("inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[10px] font-medium", classes.bg, classes.text, classes.border)}
                    title={badgeTitle}
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {badgeLabel}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onViewWorkOrders && workOrders.length > 0 && (
            <button
              type="button"
              onClick={() => onViewWorkOrders(workOrders)}
              title="Ver ordens de serviço"
              className="rounded border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          )}
          {onProgramar && workOrders.length === 0 && (
            <button
              type="button"
              onClick={() => onProgramar(schedule)}
              title="Programar"
              className="rounded border border-primary bg-white p-1.5 text-primary hover:bg-primary/5"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data,
  });
  const cssTransform = transform ? CSS.Translate.toString(transform) : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: cssTransform }}
      className={cn(
        "group cursor-grab rounded-lg border p-2.5 transition-all hover:shadow-md active:cursor-grabbing",
        isRoute
          ? "border-primary/40 bg-primary/10"
          : "border-primary/40 bg-primary/10",
        isDragging && "opacity-50 z-10",
        isMoving && "opacity-60"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {isRoute ? (
            <RouteIcon className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
          ) : (
            <Wrench className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-900 truncate">
              {displayName}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>{timeStr}</span>
              <span>•</span>
              <span>{formatDuration(schedule.duration)}</span>
              {(schedule.assignedWorkerIds?.length ?? 0) > 0 && (
                <span className="text-primary" title="Colaboradores atribuídos">
                  · {schedule.assignedWorkerIds!.length} colaborador(es)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onAssignWorkers && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAssignWorkers();
              }}
              className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-primary group-hover:opacity-100"
              title="Atribuir colaboradores"
            >
              <Users className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
            title="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
