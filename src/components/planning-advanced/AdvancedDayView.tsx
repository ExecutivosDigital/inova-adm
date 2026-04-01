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
import { format, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarPlus,
  CheckCircle2,
  Eye,
  Plus,
  Route as RouteIcon,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
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
    laneIndex?: number,
  ) => void;
  onAssignWorkers?: (schedule: ScheduleItem) => void;
  /** Modo somente leitura (programação): sem adicionar/mover/remover; exibe botão Programar */
  readOnly?: boolean;
  onProgramar?: (schedule: ScheduleItem) => void;
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[];
  onViewWorkOrders?: (workOrders: WorkOrderSummary[]) => void;
  /** Lanes preferidas por scheduleId (preserva coluna ao mover) */
  scheduleLanes?: Record<string, number>;
  /** IDs de schedules que já possuem WO emitida (usados no modo planejamento para travar drag) */
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
  scheduleIdsWithOS,
  totalAvailableHoursPerDay,
  workerRoleCapacity,
  cipServiceRoleMap,
}: AdvancedDayViewProps) {
  const normalizedDate = startOfDay(currentDate);
  const dateKey = dateToKey(normalizedDate);
  const isToday = isSameDay(normalizedDate, startOfDay(new Date()));
  const dayOfWeek = normalizedDate.getDay();
  const isWorkDay = companySchedule.workDays.includes(dayOfWeek);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<ScheduleDragData | null>(
    null,
  );
  const [movingScheduleId, setMovingScheduleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
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
          cardData.laneIndex,
        );
        setTimeout(() => setMovingScheduleId(null), 500);
      }
    },
    [onMoveSchedule],
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
  const ROW_HEIGHT_PX = 56;

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
      Math.floor((scheduleStartMinutes - startMin) / SLOT_MINUTES),
    );
    // Calcular slots necessários pulando horário de almoço
    let remainingMin = schedule.duration;
    let slotsNeeded = 0;
    for (let i = startSlotIndex; i < slots.length && remainingMin > 0; i++) {
      slotsNeeded++;
      if (!slots[i].isLunch) {
        remainingMin -= SLOT_MINUTES;
      }
    }
    const durationSlots = Math.max(1, slotsNeeded);
    const endSlotIndex = Math.min(startSlotIndex + durationSlots, slots.length);
    const actualDurationSlots = endSlotIndex - startSlotIndex;

    // Atribuir lane: preferir lane salva (scheduleLanes) se estiver livre; senão usar nova lane para não empilhar
    const preferredLane = scheduleLanes?.[schedule.id];
    let lane = -1;
    if (
      preferredLane != null &&
      preferredLane >= 0 &&
      (laneEndSlot[preferredLane] === undefined ||
        laneEndSlot[preferredLane] <= startSlotIndex)
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
          isToday && "bg-primary/5 border-primary/20",
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={cn(
                "text-lg font-semibold",
                isToday ? "text-primary" : "text-slate-900",
              )}
            >
              {format(normalizedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-slate-500">
                {sortedSchedules.length} agendamento(s) •{" "}
                {formatSlotLabel(startMin)} - {formatSlotLabel(endMin)}
                {lunchStart && lunchEnd && (
                  <>
                    {" "}
                    • Almoço: {formatSlotLabel(lunchStart)} -{" "}
                    {formatSlotLabel(lunchEnd)}
                  </>
                )}
              </p>
              {totalAvailableHoursPerDay != null &&
                totalAvailableHoursPerDay > 0 &&
                (() => {
                  const scheduledMin = sortedSchedules.reduce(
                    (sum, s) => sum + (s.duration ?? 0),
                    0,
                  );
                  const scheduledH = scheduledMin / 60;
                  const ratio = scheduledH / totalAvailableHoursPerDay;
                  const pct = Math.round(ratio * 100);
                  const dotColor =
                    ratio >= 0.9
                      ? "bg-red-500"
                      : ratio >= 0.5
                        ? "bg-amber-500"
                        : "bg-green-500";

                  const plannedByRole = new Map<string, number>();
                  if (cipServiceRoleMap) {
                    for (const s of sortedSchedules) {
                      const serviceId =
                        s.type === "service" ? s.serviceId : undefined;
                      if (!serviceId) continue;
                      const roleIds = cipServiceRoleMap.get(serviceId) ?? [];
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              dotColor,
                            )}
                          />
                          <span className="tabular-nums">
                            {scheduledH.toFixed(1)}h /{" "}
                            {totalAvailableHoursPerDay.toFixed(1)}h
                          </span>
                          <span className="text-slate-400">({pct}%)</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-64 p-3 text-xs"
                      >
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
                            {totalAvailableHoursPerDay.toFixed(1)}h
                          </span>
                        </div>
                        <div className="mb-3 h-1.5 w-full rounded-full bg-slate-200">
                          <div
                            className={cn("h-1.5 rounded-full", dotColor)}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        {workerRoleCapacity &&
                          workerRoleCapacity.length > 0 && (
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
                          )}
                      </PopoverContent>
                    </Popover>
                  );
                })()}
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                const defaultSlot = startMin;
                onAddSchedule("route", dateKey, defaultSlot);
              }}
              className="border-primary text-primary hover:bg-primary/5 flex items-center gap-2 rounded border bg-white px-3 py-1.5 text-sm font-medium"
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
              <p className="text-sm text-slate-500">
                Nenhum agendamento para este dia
              </p>
            </div>
          ) : (
            <div
              className="grid min-w-0 gap-0"
              style={{
                gridTemplateColumns: `4.5rem repeat(${numLanes}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${slots.length}, ${ROW_HEIGHT_PX}px)`,
                width: "100%",
              }}
            >
              {/* Coluna de horários */}
              {slots.map((slot, idx) => (
                <div
                  key={slot.time}
                  className={cn(
                    "flex items-start border-b border-slate-100 py-1 pr-2 text-base font-medium text-slate-600",
                    slot.isLunch && "bg-slate-50",
                  )}
                  style={{ gridRow: idx + 1, gridColumn: 1 }}
                >
                  {formatSlotLabel(slot.time)}
                </div>
              ))}
              {/* Área de conteúdo: cards posicionados (cada um na sua coluna) */}
              {schedulePositions.map(
                ({ schedule, startSlotIndex, durationSlots, lane }) => (
                  <div
                    key={schedule.id}
                    className="min-h-0 min-w-0 overflow-hidden px-0.5 py-0"
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
                ),
              )}
            </div>
          )
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {sortedSchedules.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    Nenhum agendamento para este dia
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultSlot = startMin;
                      onAddSchedule("route", dateKey, defaultSlot);
                    }}
                    className="text-primary mt-3 text-sm hover:underline"
                  >
                    Adicionar primeiro agendamento
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="grid min-w-0 gap-0"
                style={{
                  gridTemplateColumns: `4.5rem repeat(${numLanes}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${slots.length}, ${ROW_HEIGHT_PX}px)`,
                  width: "100%",
                }}
              >
                {/* Coluna de horários */}
                {slots.map((slot, idx) => (
                  <div
                    key={`time-${slot.time}`}
                    className={cn(
                      "flex items-start border-b border-slate-100 py-1 pr-2 text-base font-medium text-slate-600",
                      slot.isLunch && "bg-slate-50",
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
                        onClick={() =>
                          onAddSchedule("route", dateKey, slot.time)
                        }
                        className="hover:text-primary text-sm text-slate-400"
                      >
                        + Adicionar
                      </button>
                    )}
                  </DroppableSlotRow>
                ))}
                {/* Cards de agendamento (ocupam N linhas conforme duração) */}
                {schedulePositions.map(
                  ({ schedule, startSlotIndex, durationSlots, lane }) => (
                    <div
                      key={schedule.id}
                      className="min-h-0 min-w-0 overflow-hidden px-0.5 py-0"
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
                        onAssignWorkers={
                          onAssignWorkers
                            ? () => onAssignWorkers(schedule)
                            : undefined
                        }
                        workOrders={workOrdersForSchedule?.(schedule) ?? []}
                      />
                    </div>
                  ),
                )}
              </div>
            )}
            <DragOverlay>
              {activeDragId && activeDragData ? (
                <div className="border-primary bg-primary/20 cursor-grabbing rounded-lg border-2 px-3 py-2 text-sm font-medium text-slate-900 shadow-lg">
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

  if (hasWorkOrders) {
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
          "group relative flex h-full min-h-0 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md border px-1.5 py-1",
          classes.border,
          classes.bg,
        )}
      >
        <div
          className={cn(
            "min-w-0 flex-1 leading-snug",
            onViewWorkOrders ? "pr-24" : "pr-[4.5rem]",
          )}
        >
          <p className="truncate text-sm text-slate-900">
            <span className="font-semibold">
              {woCode ? `OS ${woCode}` : "OS emitida"}
            </span>
            <span className="font-normal text-slate-600"> · {displayName}</span>
            <span className="font-normal text-slate-500">
              {" "}
              · {formatDuration(schedule.duration)}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "absolute top-1 right-1 z-10 max-w-[42%] truncate rounded border px-1.5 py-0.5 text-xs leading-tight font-medium",
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
            className="absolute right-1 bottom-1 z-10 rounded border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-50"
            title="Ver ordem(ns) de serviço"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  const variant = getScheduleCardVariant(schedule, workOrders);
  const cardStyles = SCHEDULE_CARD_STYLES[variant];
  const showOverdueBadge = variant === "overdue";

  return (
    <div
      className={cn(
        "group relative flex h-full min-h-0 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md border px-1.5 py-1",
        cardStyles.border,
        cardStyles.bg,
      )}
    >
      {isRoute ? (
        <RouteIcon className="text-primary h-4 w-4 shrink-0" />
      ) : (
        <Wrench className="text-primary h-4 w-4 shrink-0" />
      )}
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm leading-snug text-slate-900",
          showOverdueBadge && onProgramar && "pr-24",
          showOverdueBadge && !onProgramar && "pr-[4.5rem]",
          !showOverdueBadge && onProgramar && "pr-9",
        )}
      >
        <span className="font-medium">{displayName}</span>
        <span className="font-normal text-slate-500">
          {" "}
          · {formatDuration(schedule.duration)}
        </span>
      </p>
      {showOverdueBadge && (
        <span
          className={cn(
            "absolute top-1 right-1 z-10 rounded border px-1.5 py-0.5 text-xs leading-tight font-medium",
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
          className="border-primary text-primary hover:bg-primary/5 absolute right-1 bottom-1 z-10 shrink-0 rounded border bg-white p-0.5"
          title="Programar"
        >
          <CalendarPlus className="h-3 w-3" />
        </button>
      )}
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
        isOver && !isLunch && "ring-primary/30 bg-primary/5 ring-2 ring-inset",
      )}
    >
      {children}
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
  schedule,
  laneIndex,
  movingScheduleId,
  onRemove,
  onAssignWorkers,
  workOrders = [],
}: {
  schedule: ScheduleItem;
  laneIndex?: number;
  movingScheduleId: string | null;
  onRemove: () => void;
  onAssignWorkers?: () => void;
  workOrders?: WorkOrderSummary[];
}) {
  const isRoute = schedule.type === "route";
  const displayName = isRoute
    ? `${schedule.route?.code} – ${schedule.route?.name}`
    : `${schedule.service?.name} (${schedule.service?.equipmentName})`;
  const hasWO = workOrders.length > 0;
  const variant = getScheduleCardVariant(schedule, workOrders);
  const styles = SCHEDULE_CARD_STYLES[variant];
  const locked = hasWO;
  const dragData: ScheduleDragData = {
    scheduleId: schedule.id,
    type: schedule.type,
    laneIndex,
  };
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `schedule-${schedule.id}`,
      data: dragData,
      disabled: locked,
    });
  const cssTransform = transform
    ? CSS.Translate.toString(transform)
    : undefined;
  const isMoving = movingScheduleId === schedule.id;

  const woCode = workOrders[0]?.code
    ? String(workOrders[0].code).padStart(8, "0")
    : null;
  const showOverdueBadge = variant === "overdue" && !hasWO;
  const rightReserve =
    hasWO || showOverdueBadge ? "pr-[5.5rem]" : !locked ? "pr-16" : "pr-1";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: cssTransform }}
      className={cn(
        "group relative flex h-full min-h-0 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md border px-1.5 py-1 transition-all",
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
      {isRoute ? (
        <RouteIcon className="text-primary h-4 w-4 shrink-0" />
      ) : (
        <Wrench className="text-primary h-4 w-4 shrink-0" />
      )}
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm leading-snug text-slate-900",
          rightReserve,
        )}
      >
        <span className="font-medium">{displayName}</span>
        <span className="font-normal text-slate-500">
          {" "}
          · {formatDuration(schedule.duration)}
          {(schedule.assignedWorkerIds?.length ?? 0) > 0 && (
            <span className="text-primary">
              {" "}
              · {schedule.assignedWorkerIds!.length} col.
            </span>
          )}
        </span>
      </p>
      <div className="pointer-events-none absolute top-1 right-1 z-10 flex max-w-[48%] flex-col items-end gap-0.5">
        {hasWO && (
          <span
            className={cn(
              "pointer-events-none flex max-w-full items-center gap-0.5 truncate rounded border px-1.5 py-0.5 text-xs leading-tight font-medium",
              styles.badgeBorder,
              styles.badgeBg,
              styles.badgeText,
            )}
            title={woCode ? `OS ${woCode}` : "OS emitida"}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {woCode ? `OS ${woCode}` : "OS emitida"}
            </span>
          </span>
        )}
        {showOverdueBadge && (
          <span
            className={cn(
              "pointer-events-none rounded border px-1.5 py-0.5 text-xs leading-tight font-medium",
              styles.badgeBorder,
              styles.badgeBg,
              styles.badgeText,
            )}
          >
            Atrasado
          </span>
        )}
      </div>
      {!locked && (
        <div className="absolute right-1 bottom-1 z-10 flex items-center gap-0">
          {onAssignWorkers && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssignWorkers();
              }}
              className="hover:text-primary pointer-events-auto rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100"
              title="Atribuir colaboradores"
            >
              <Users className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="pointer-events-auto shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
            title="Remover"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
