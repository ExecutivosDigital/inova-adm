"use client";

import type { WorkOrderSummary } from "@/components/planning-advanced/ViewWorkOrdersModal";
import type {
  CompanySchedule,
  PlanningRoute,
  PlanningService,
  ScheduleItem,
} from "@/lib/planning-advanced-types";
import { cn } from "@/lib/utils";
import {
  getSummaryVariantForWorkOrders,
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
import { format, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, CheckCircle2, Eye, Plus, Route as RouteIcon, Trash2, Users, Wrench } from "lucide-react";
import React, { useCallback, useState } from "react";

interface ScheduleDragData {
  scheduleId: string;
  type: "route" | "service";
  /** Lane atual do card (para preservar posição horizontal ao mover) */
  laneIndex?: number;
}

interface AdvancedDayViewProps {
  schedules: ScheduleItem[];
  currentDate: Date;
  companySchedule: CompanySchedule;
  routes: PlanningRoute[];
  services: PlanningService[];
  onAddSchedule: (type: "route" | "service", dateKey: string, slotMin: number) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onMoveSchedule: (scheduleId: string, dateKey: string, slotMin: number, laneIndex?: number) => void;
  onAssignWorkers?: (schedule: ScheduleItem) => void;
  /** Modo somente leitura (programação): sem adicionar/mover/remover; exibe botão Programar */
  readOnly?: boolean;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
  /** Lanes preferidas por scheduleId (preserva coluna ao mover) */
  scheduleLanes?: Record<string, number>;
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
  onAssignWorkers,
  readOnly = false,
  onProgramar,
  workOrdersForSchedule,
  onViewWorkOrders,
  scheduleLanes,
}: AdvancedDayViewProps) {
  const normalizedDate = startOfDay(currentDate);
  const dateKey = dateToKey(normalizedDate);
  const isToday = isSameDay(normalizedDate, startOfDay(new Date()));
  const dayOfWeek = normalizedDate.getDay();
  const isWorkDay = companySchedule.workDays.includes(dayOfWeek);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<ScheduleDragData | null>(null);
  const [movingScheduleId, setMovingScheduleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

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
      const slotData = over.data?.current as
        | { dateKey: string; slotMin: number; isLunch?: boolean }
        | undefined;
      const cardData = active.data?.current as ScheduleDragData | undefined;

      // Não permitir soltar em horário de almoço
      if (slotData?.isLunch) return;

      if (
        slotData?.dateKey != null &&
        slotData?.slotMin != null &&
        cardData?.scheduleId
      ) {
        setMovingScheduleId(cardData.scheduleId);
        onMoveSchedule(
          cardData.scheduleId,
          slotData.dateKey,
          slotData.slotMin,
          cardData.laneIndex
        );
        setTimeout(() => setMovingScheduleId(null), 500);
      }
    },
    [onMoveSchedule]
  );

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

  // Calcular posição e duração em slots (cada slot = 30 min) e atribuir lanes para evitar sobreposição
  const SLOT_MINUTES = 30;
  const ROW_HEIGHT_PX = 48;

  type SchedulePosition = {
    schedule: ScheduleItem;
    startSlotIndex: number;
    durationSlots: number;
    lane: number;
  };

  const schedulePositions: SchedulePosition[] = [];
  const laneEndSlot: number[] = [];

  sortedSchedules.forEach((schedule) => {
    const scheduleDate = new Date(schedule.scheduledStartAt);
    const br = toBrazilLocal(scheduleDate);
    const scheduleStartMinutes = br.hours * 60 + br.minutes;
    const startSlotIndex = Math.max(
      0,
      Math.floor((scheduleStartMinutes - startMin) / SLOT_MINUTES)
    );
    const durationSlots = Math.max(
      1,
      Math.ceil(schedule.duration / SLOT_MINUTES)
    );
    const endSlotIndex = Math.min(
      startSlotIndex + durationSlots,
      slots.length
    );
    const actualDurationSlots = endSlotIndex - startSlotIndex;

    // Atribuir lane: preferir lane salva (scheduleLanes) se estiver livre; senão usar nova lane para não empilhar
    const preferredLane = scheduleLanes?.[schedule.id];
    let lane = -1;
    if (
      preferredLane != null &&
      preferredLane >= 0 &&
      (laneEndSlot[preferredLane] === undefined || laneEndSlot[preferredLane] <= startSlotIndex)
    ) {
      lane = preferredLane;
    }
    if (lane < 0) {
      // Usar nova lane (cada agendamento na sua coluna) para evitar empilhar e dar largura total
      lane = laneEndSlot.length;
      laneEndSlot.push(0);
    } else {
      if (lane >= laneEndSlot.length) {
        while (laneEndSlot.length <= lane) laneEndSlot.push(0);
      }
    }
    laneEndSlot[lane] = endSlotIndex;

    schedulePositions.push({
      schedule,
      startSlotIndex,
      durationSlots: actualDurationSlots,
      lane,
    });
  });

  const numLanes = Math.max(1, laneEndSlot.length);

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
          {!readOnly && (
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
          )}
        </div>
      </div>

      {/* Timeline de agendamentos (grid: cada linha = 30 min, cards ocupam N linhas conforme duração) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {readOnly ? (
          sortedSchedules.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <p className="text-sm text-slate-500">Nenhum agendamento para este dia</p>
            </div>
          ) : (
            <div
              className="grid min-w-0 gap-0"
              style={{
                gridTemplateColumns: `4rem repeat(${numLanes}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${slots.length}, ${ROW_HEIGHT_PX}px)`,
                width: "100%",
              }}
            >
              {/* Coluna de horários */}
              {slots.map((slot, idx) => (
                <div
                  key={slot.time}
                  className={cn(
                    "flex items-start border-b border-slate-100 py-1 pr-2 text-sm font-medium text-slate-600",
                    slot.isLunch && "bg-slate-50"
                  )}
                  style={{ gridRow: idx + 1, gridColumn: 1 }}
                >
                  {formatSlotLabel(slot.time)}
                </div>
              ))}
              {/* Área de conteúdo: cards posicionados (cada um na sua coluna) */}
              {schedulePositions.map(({ schedule, startSlotIndex, durationSlots, lane }) => (
                <div
                  key={schedule.id}
                  className="min-h-0 min-w-0 overflow-hidden p-1"
                  style={{
                    gridRow: `${startSlotIndex + 1} / span ${durationSlots}`,
                    gridColumn: lane + 2,
                    width: "100%",
                  }}
                >
                  <ReadOnlyScheduleCard
                    schedule={schedule}
                    onProgramar={onProgramar}
                    workOrders={workOrdersForSchedule?.(schedule) ?? []}
                    onViewWorkOrders={onViewWorkOrders}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
              <div
                className="grid min-w-0 gap-0"
                style={{
                  gridTemplateColumns: `4rem repeat(${numLanes}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${slots.length}, ${ROW_HEIGHT_PX}px)`,
                  width: "100%",
                }}
              >
                {/* Coluna de horários */}
                {slots.map((slot, idx) => (
                  <div
                    key={`time-${slot.time}`}
                    className={cn(
                      "flex items-start border-b border-slate-100 py-1 pr-2 text-sm font-medium text-slate-600",
                      slot.isLunch && "bg-slate-50"
                    )}
                    style={{ gridRow: idx + 1, gridColumn: 1 }}
                  >
                    {formatSlotLabel(slot.time)}
                  </div>
                ))}
                {/* Linhas droppable (uma por slot) */}
                {slots.map((slot, idx) => (
                  <DroppableSlotRow
                    key={slot.time}
                    slotTime={slot.time}
                    dateKey={dateKey}
                    isLunch={slot.isLunch}
                    style={{
                      gridRow: idx + 1,
                      gridColumn: `2 / ${2 + numLanes}`,
                    }}
                  >
                    {slot.time % 60 === 0 && !slot.isLunch && (
                      <button
                        type="button"
                        onClick={() => onAddSchedule("route", dateKey, slot.time)}
                        className="text-xs text-slate-400 hover:text-primary"
                      >
                        + Adicionar
                      </button>
                    )}
                  </DroppableSlotRow>
                ))}
                {/* Cards de agendamento (ocupam N linhas conforme duração) */}
                {schedulePositions.map(({ schedule, startSlotIndex, durationSlots, lane }) => (
                  <div
                    key={schedule.id}
                    className="min-h-0 min-w-0 overflow-hidden p-1"
                    style={{
                      gridRow: `${startSlotIndex + 1} / span ${durationSlots}`,
                      gridColumn: lane + 2,
                      width: "100%",
                    }}
                  >
                    <DraggableScheduleCard
                      schedule={schedule}
                      laneIndex={lane}
                      movingScheduleId={movingScheduleId}
                      onRemove={() => onRemoveSchedule(schedule.id)}
                      onAssignWorkers={onAssignWorkers ? () => onAssignWorkers(schedule) : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
            <DragOverlay>
              {activeDragId && activeDragData ? (
                <div className="rounded-lg border-2 border-primary bg-primary/20 px-3 py-2 text-sm font-medium text-slate-900 shadow-lg cursor-grabbing">
                  Movendo...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function ReadOnlyScheduleCard({
  schedule,
  onProgramar,
  workOrders = [],
  onViewWorkOrders,
}: {
  schedule: ScheduleItem;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrders?: WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
}) {
  const isRoute = schedule.type === "route";
  const displayName = isRoute
    ? `${schedule.route?.code} – ${schedule.route?.name}`
    : `${schedule.service?.name} (${schedule.service?.equipmentName})`;
  const hasWorkOrders = workOrders.length > 0;
  return (
    <div
      className={cn(
        "group flex h-full w-full min-h-0 min-w-0 flex-col justify-between rounded-lg border p-3 transition-all",
        "border-primary/40 bg-primary/10"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isRoute ? (
          <RouteIcon className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Wrench className="h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-slate-900">{displayName}</p>
            {hasWorkOrders && (() => {
              const variant = getSummaryVariantForWorkOrders(workOrders) ?? "warning";
              const classes = WORK_ORDER_VARIANT_CLASSES[variant];
              return (
                <span
                  className={cn("flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium", classes.bg, classes.text, classes.border)}
                  title="Ordem(ns) de serviço emitida(s)"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Emitida
                </span>
              );
            })()}
          </div>
          <p className="text-xs text-slate-500">Duração: {formatDuration(schedule.duration)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasWorkOrders && onViewWorkOrders && (
          <button
            type="button"
            onClick={() => onViewWorkOrders(workOrders)}
            className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Ver ordem(ns) de serviço"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver ordem{workOrders.length > 1 ? "ns" : ""}
          </button>
        )}
        {onProgramar && workOrders.length === 0 && (
          <button
            type="button"
            onClick={() => onProgramar(schedule)}
            className="flex shrink-0 items-center gap-1.5 rounded border border-primary bg-white px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
          >
            <CalendarPlus className="h-4 w-4" />
            Programar
          </button>
        )}
      </div>
    </div>
  );
}

function DroppableSlotRow({
  slotTime,
  dateKey,
  isLunch,
  children,
  style,
}: {
  slotTime: number;
  dateKey: string;
  isLunch: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slotTime}`,
    data: { dateKey, slotMin: slotTime, isLunch },
  });
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex min-h-0 items-start border-b border-slate-100 p-1 transition-colors",
        isLunch && "bg-slate-50",
        isOver && !isLunch && "ring-2 ring-inset ring-primary/30 bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}

function DraggableScheduleCard({
  schedule,
  laneIndex,
  movingScheduleId,
  onRemove,
  onAssignWorkers,
}: {
  schedule: ScheduleItem;
  laneIndex?: number;
  movingScheduleId: string | null;
  onRemove: () => void;
  onAssignWorkers?: () => void;
}) {
  const isRoute = schedule.type === "route";
  const displayName = isRoute
    ? `${schedule.route?.code} – ${schedule.route?.name}`
    : `${schedule.service?.name} (${schedule.service?.equipmentName})`;
  const dragData: ScheduleDragData = {
    scheduleId: schedule.id,
    type: schedule.type,
    laneIndex,
  };
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `schedule-${schedule.id}`,
    data: dragData,
  });
  const cssTransform = transform ? CSS.Translate.toString(transform) : undefined;
  const isMoving = movingScheduleId === schedule.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: cssTransform }}
      className={cn(
        "group flex h-full w-full min-h-0 min-w-0 flex-col justify-between rounded-lg border p-3 transition-all hover:shadow-md cursor-grab active:cursor-grabbing",
        isRoute
          ? "border-primary/40 bg-primary/10"
          : "border-primary/40 bg-primary/10",
        isDragging && "opacity-50 z-10",
        isMoving && "opacity-60"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isRoute ? (
          <RouteIcon className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Wrench className="h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{displayName}</p>
          <p className="text-xs text-slate-500">
            Duração: {formatDuration(schedule.duration)}
            {(schedule.assignedWorkerIds?.length ?? 0) > 0 && (
              <span className="ml-1 text-primary">· {schedule.assignedWorkerIds!.length} worker(s)</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {onAssignWorkers && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssignWorkers();
            }}
            className="rounded p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-primary group-hover:opacity-100"
            title="Atribuir workers"
          >
            <Users className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
