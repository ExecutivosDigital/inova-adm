"use client";

import type { WorkOrderSummary } from "@/components/planning-advanced/ViewWorkOrdersModal";
import { allWorkOrdersCompleted } from "@/lib/work-order-status";
import type { CompanySchedule, ScheduleItem, WorkloadIndicator } from "@/lib/planning-advanced-types";
import { cn } from "@/lib/utils";
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
import { ChevronLeft, ChevronRight, Route as RouteIcon, Trash2, Users, Wrench } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface AdvancedMonthlyCalendarProps {
  displayDate: Date;
  indicators: WorkloadIndicator[];
  onDateClick?: (date: string) => void;
  onMonthChange?: (date: Date) => void;
  /** Agendamentos do mês (opcional). Quando informado, exibe os cards por dia e permite arrastar se onMoveSchedule for passado. */
  schedules?: ScheduleItem[];
  /** Horário de início para calcular slot ao soltar em um dia (ex.: "08:00"). */
  companySchedule?: CompanySchedule;
  onMoveSchedule?: (scheduleId: string, dateKey: string, slotMin: number) => void;
  onRemoveSchedule?: (scheduleId: string) => void;
  onAssignWorkers?: (schedule: ScheduleItem) => void;
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Cor do card do dia: baseada no status mais crítico dos schedules. */
type DayScheduleStatus = "empty" | "all_completed" | "has_pending" | "has_overdue";

function getDayScheduleStatus(
  daySchedules: ScheduleItem[],
  workOrdersForSchedule?: (schedule: ScheduleItem) => WorkOrderSummary[]
): DayScheduleStatus {
  if (daySchedules.length === 0) return "empty";
  const now = new Date();
  let hasOverdue = false;
  let hasPending = false;
  let allCompleted = true;

  for (const s of daySchedules) {
    const wos = workOrdersForSchedule?.(s) ?? [];
    const completed = wos.length > 0 && allWorkOrdersCompleted(wos);
    if (completed) continue;
    allCompleted = false;
    const scheduledAt = new Date(s.scheduledStartAt);
    if (scheduledAt < now) {
      hasOverdue = true;
    } else {
      hasPending = true;
    }
  }

  if (hasOverdue) return "has_overdue";
  if (hasPending) return "has_pending";
  if (allCompleted) return "all_completed";
  return "empty";
}

function getDayCardColor(status: DayScheduleStatus) {
  switch (status) {
    case "has_overdue":    return "border-red-200 bg-red-50/80";
    case "has_pending":    return "border-amber-200 bg-amber-50/80";
    case "all_completed":  return "border-green-200 bg-green-50/80";
    default:               return "border-blue-200 bg-blue-50/80";
  }
}

/** Cor do indicador (bolinha): baseada em horas agendadas vs disponíveis. */
function getCapacityDot(indicator: WorkloadIndicator | null) {
  if (!indicator || indicator.availableHours === 0) return "bg-blue-500";
  const ratio = indicator.scheduledHours / indicator.availableHours;
  if (ratio >= 0.9) return "bg-red-500";
  if (ratio >= 0.5) return "bg-amber-500";
  return "bg-green-500";
}

function getCapacityDotTitle(indicator: WorkloadIndicator | null) {
  if (!indicator || indicator.availableHours === 0) return "Sem dados de capacidade";
  const ratio = indicator.scheduledHours / indicator.availableHours;
  const pct = (ratio * 100).toFixed(0);
  if (ratio >= 0.9) return `Sobrecarga (${pct}%)`;
  if (ratio >= 0.5) return `Carga moderada (${pct}%)`;
  return `Carga adequada (${pct}%)`;
}

// Mantida para compatibilidade com getStatusColor legado
function getStatusColor(status: WorkloadIndicator["status"] | null) {
  if (!status) return "border-blue-200 bg-blue-50/80";
  switch (status) {
    case "low":
      return "border-green-200 bg-green-50/80";
    case "medium":
      return "border-yellow-200 bg-yellow-50/80";
    case "high":
      return "border-red-200 bg-red-50/80";
    default:
      return "border-blue-200 bg-blue-50/80";
  }
}

function getStatusDot(status: WorkloadIndicator["status"] | null) {
  if (!status) return "bg-blue-500";
  switch (status) {
    case "low": return "bg-green-500";
    case "medium": return "bg-yellow-500";
    case "high": return "bg-red-500";
    default: return "bg-blue-500";
  }
}

function dateToKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
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

function ReadOnlyMonthScheduleCard({
  displayName,
  isRoute,
  timeStr,
}: {
  schedule: ScheduleItem;
  displayName: string;
  isRoute: boolean;
  timeStr: string;
}) {
  return (
    <div
      className={cn(
        "rounded border px-1 py-0.5 text-left flex items-center gap-1 min-w-0",
        "border-primary/40 bg-primary/10"
      )}
      title={displayName}
    >
      {isRoute ? (
        <RouteIcon className="h-2.5 w-2.5 shrink-0 text-primary" />
      ) : (
        <Wrench className="h-2.5 w-2.5 shrink-0 text-primary" />
      )}
      <span className="text-[9px] text-slate-700 truncate min-w-0">{displayName}</span>
      <span className="text-[8px] text-slate-500 shrink-0">{timeStr}</span>
    </div>
  );
}

function DraggableMonthScheduleCard({
  id,
  data,
  schedule,
  displayName,
  isRoute,
  timeStr,
  onRemove,
  onAssignWorkers,
  isDragging,
}: {
  id: string;
  data: ScheduleDragData;
  schedule: ScheduleItem;
  displayName: string;
  isRoute: boolean;
  timeStr: string;
  onRemove?: () => void;
  onAssignWorkers?: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, data });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded border relative px-1 py-0.5 text-left flex items-center gap-1 min-w-0 transition-all group",
        "border-primary/40 bg-primary/10",
        (onRemove || onAssignWorkers) && "cursor-grab active:cursor-grabbing hover:shadow",
        isDragging && "opacity-50"
      )}
      title={displayName}
      {...listeners}
      {...attributes}
    >
      {isRoute ? (
        <RouteIcon className="h-2.5 w-2.5 shrink-0 text-primary" />
      ) : (
        <Wrench className="h-2.5 w-2.5 shrink-0 text-primary" />
      )}
      <span className="text-[9px] text-slate-700 truncate min-w-0 flex-1">{displayName}</span>
      <span className="text-[8px] group-hover:opacity-0 text-slate-500 shrink-0">{timeStr}</span>
      <div className="shrink-0 absolute top-1/2 -translate-y-1/2 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        {onAssignWorkers && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAssignWorkers(); }}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-primary"
            title="Atribuir colaboradores"
          >
            <Users className="h-2.5 w-2.5" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="rounded p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-600"
            title="Remover"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AdvancedMonthlyCalendar({
  displayDate,
  indicators,
  onDateClick,
  onMonthChange,
  schedules = [],
  companySchedule,
  onMoveSchedule,
  onRemoveSchedule,
  onAssignWorkers,
  workOrdersForSchedule,
}: AdvancedMonthlyCalendarProps) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth() + 1;
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<ScheduleDragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  const defaultSlotMin = useMemo(
    () => (companySchedule?.businessHoursStart ? parseTimeToMinutes(companySchedule.businessHoursStart) : 8 * 60),
    [companySchedule?.businessHoursStart]
  );

  const indicatorsMap = useMemo(() => {
    const map = new Map<string, WorkloadIndicator>();
    indicators.forEach((ind) => map.set(ind.date, ind));
    return map;
  }, [indicators]);

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    schedules.forEach((s) => {
      const key = dateToKey(new Date(s.scheduledStartAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    map.forEach((list) => list.sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime()));
    return map;
  }, [schedules]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  /** Células do grid: só o necessário para completar a 1ª semana (mês anterior) e a última semana (mês seguinte). */
  const calendarCells = useMemo(() => {
    const cells: { day: number; year: number; month: number; isCurrentMonth: boolean }[] = [];
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const lastDayPrev = new Date(year, month - 1, 0).getDate();

    // Dias do mês anterior (só os que completam a primeira semana)
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = lastDayPrev - firstDayOfMonth + 1 + i;
      cells.push({ day, year: prevYear, month: prevMonth, isCurrentMonth: false });
    }
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, year, month, isCurrentMonth: true });
    }
    // Dias do mês seguinte: só os necessários para completar a última semana (múltiplo de 7)
    const totalSoFar = firstDayOfMonth + daysInMonth;
    const remainder = totalSoFar % 7;
    const daysFromNextMonth = remainder === 0 ? 0 : 7 - remainder;
    for (let day = 1; day <= daysFromNextMonth; day++) {
      cells.push({ day, year: nextYear, month: nextMonth, isCurrentMonth: false });
    }
    return cells;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  const getIndicatorForDay = useCallback(
    (y: number, m: number, day: number): WorkloadIndicator | null => {
      if (y !== year || m !== month) return null;
      const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return indicatorsMap.get(dateKey) ?? null;
    },
    [year, month, indicatorsMap]
  );

  const getScheduleCountsForDay = useCallback(
    (y: number, m: number, day: number): { routeCount: number; serviceCount: number } => {
      const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const list = schedulesByDate.get(dateKey) ?? [];
      let routeCount = 0;
      let serviceCount = 0;
      list.forEach((s) => (s.type === "route" ? routeCount++ : serviceCount++));
      return { routeCount, serviceCount };
    },
    [schedulesByDate]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setActiveDragData((event.active.data?.current as ScheduleDragData) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      setActiveDragData(null);
      const { active, over } = event;
      if (!over || !onMoveSchedule) return;
      const cardData = active.data?.current as ScheduleDragData | undefined;
      const overId = String(over.id);
      if (!cardData?.scheduleId || !overId.startsWith("month-day-")) return;
      const dateKey = overId.replace("month-day-", "");
      onMoveSchedule(cardData.scheduleId, dateKey, defaultSlotMin);
    },
    [onMoveSchedule, defaultSlotMin]
  );

  const today = new Date();
  const isTodayDate = (y: number, m: number, d: number) =>
    d === today.getDate() && m === today.getMonth() + 1 && y === today.getFullYear();

  const renderDayCell = (cell: { day: number; year: number; month: number; isCurrentMonth: boolean }, index: number) => {
    const { day, year: cellYear, month: cellMonth, isCurrentMonth } = cell;
    const dateKey = `${cellYear}-${String(cellMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const indicator = getIndicatorForDay(cellYear, cellMonth, day);
    const hasNoPlanning = !indicator || (indicator.scheduledHours === 0 && indicator.availableHours === 0);
    const { routeCount, serviceCount } = getScheduleCountsForDay(cellYear, cellMonth, day);
    const daySchedules = schedulesByDate.get(dateKey) ?? [];
    const isTodayDay = isTodayDate(cellYear, cellMonth, day);
    const dayStatus = getDayScheduleStatus(daySchedules, workOrdersForSchedule);
    const dayCardColor = daySchedules.length > 0 ? getDayCardColor(dayStatus) : getDayCardColor("empty");

    // Dia de outro mês: estilo esmaecido e clique navega para esse mês
    if (!isCurrentMonth) {
      return (
        <button
          key={dateKey}
          type="button"
          onClick={() => onMonthChange?.(new Date(cellYear, cellMonth - 1, day))}
          className="flex min-h-[120px] flex-col rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-2 text-left transition-all hover:border-slate-200 hover:bg-slate-100/80"
          title={`Ir para ${day}/${cellMonth}/${cellYear}`}
        >
          <span className="text-sm font-medium text-slate-400">{day}</span>
          {daySchedules.length > 0 ? (
            <div className="mt-1 text-[9px] text-slate-500">{daySchedules.length} agend.</div>
          ) : (
            <div className="mt-1 text-[9px] text-slate-400">—</div>
          )}
        </button>
      );
    }

    const droppableId = `month-day-${dateKey}`;

    const cellContent = (
      <>
        <div className="mb-1 flex items-center justify-between gap-0.5">
          <span className="font-semibold text-slate-900 text-sm">{day}</span>
          {!hasNoPlanning && (
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", getCapacityDot(indicator))}
              title={getCapacityDotTitle(indicator)}
            />
          )}
        </div>
        {indicator ? (
          <div className="text-[9px] flex items-center justify-between w-full text-slate-600 space-y-0.5" title={`Agendado: ${indicator.scheduledHours.toFixed(1)}h | Disponível: ${indicator.availableHours.toFixed(1)}h | Utilização: ${indicator.utilization.toFixed(0)}%`}>
            <div className="font-medium">{indicator.scheduledHours.toFixed(0)}h/{indicator.availableHours.toFixed(0)}h</div>
            <div>{indicator.utilization.toFixed(0)}% · {routeCount}r {serviceCount}s</div>
          </div>
        ) : (
          <div className="text-[9px] text-slate-400">—</div>
        )}
        {schedules.length > 0 && (
          <div className="mt-1.5 space-y-0.5 overflow-y-auto flex-1 min-h-0 max-h-[72px]">
            {daySchedules.map((schedule) => {
              const isRoute = schedule.type === "route";
              const displayName = isRoute
                ? `${schedule.route?.code ?? ""} – ${schedule.route?.name ?? "Rota"}`
                : `${schedule.service?.name ?? "Serviço"} (${schedule.service?.equipmentName ?? ""})`;
              const scheduleDate = new Date(schedule.scheduledStartAt);
              const timeStr = `${String(scheduleDate.getHours()).padStart(2, "0")}:${String(scheduleDate.getMinutes()).padStart(2, "0")}`;

              if (onMoveSchedule) {
                const dragId = `schedule-${schedule.id}`;
                const dragData: ScheduleDragData = { scheduleId: schedule.id, type: schedule.type };
                return (
                  <DraggableMonthScheduleCard
                    key={schedule.id}
                    id={dragId}
                    data={dragData}
                    schedule={schedule}
                    displayName={displayName}
                    isRoute={isRoute}
                    timeStr={timeStr}
                    onRemove={onRemoveSchedule ? () => onRemoveSchedule(schedule.id) : undefined}
                    onAssignWorkers={onAssignWorkers ? () => onAssignWorkers(schedule) : undefined}
                    isDragging={activeDragId === dragId}
                  />
                );
              }
              return (
                <ReadOnlyMonthScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  displayName={displayName}
                  isRoute={isRoute}
                  timeStr={timeStr}
                />
              );
            })}
          </div>
        )}
      </>
    );

    if (onMoveSchedule) {
      return (
        <MonthDayDroppable
          key={dateKey}
          id={droppableId}
          dateKey={dateKey}
          isToday={isTodayDay}
          colorClass={dayCardColor}
          onClick={() => onDateClick?.(dateKey)}
        >
          {cellContent}
        </MonthDayDroppable>
      );
    }

    return (
      <button
        key={dateKey}
        type="button"
        onClick={() => onDateClick?.(dateKey)}
        className={cn(
          "flex min-h-[120px] flex-col rounded-lg border-2 px-2 py-2 text-left transition-all overflow-hidden",
          "hover:shadow-md",
          dayCardColor,
          isTodayDay && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {cellContent}
      </button>
    );
  };

  const content = (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map((day) => (
        <div key={day} className="text-center text-sm font-medium text-slate-700 py-2">
          {day}
        </div>
      ))}
      {calendarCells.map((cell, index) => renderDayCell(cell, index))}
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => onMonthChange?.(new Date(year, month - 2, 1))} className="rounded-md p-2 text-slate-600 hover:bg-slate-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">
            {MONTHS[month - 1]} {year}
          </h2>
          <button type="button" onClick={() => onMonthChange?.(new Date(year, month, 1))} className="rounded-md p-2 text-slate-600 hover:bg-slate-100">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => onMonthChange?.(new Date())} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Hoje
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded border border-blue-200 bg-blue-50" />
            <span className="text-slate-600">Sem agendamento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded border border-amber-200 bg-amber-50" />
            <span className="text-slate-600">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded border border-green-200 bg-green-50" />
            <span className="text-slate-600">Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded border border-red-200 bg-red-50" />
            <span className="text-slate-600">Atrasado</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="text-slate-600">&lt; 50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-600">50–90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            <span className="text-slate-600">&ge; 90%</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 overflow-auto">
        {onMoveSchedule ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {content}
            <DragOverlay>
              {activeDragId && activeDragData ? (
                (() => {
                  const schedule = schedules.find((s) => s.id === activeDragData.scheduleId);
                  if (!schedule) return null;
                  const isRoute = schedule.type === "route";
                  const displayName = isRoute
                    ? `${schedule.route?.code ?? ""} – ${schedule.route?.name ?? "Rota"}`
                    : `${schedule.service?.name ?? "Serviço"} (${schedule.service?.equipmentName ?? ""})`;
                  const scheduleDate = new Date(schedule.scheduledStartAt);
                  const timeStr = `${String(scheduleDate.getHours()).padStart(2, "0")}:${String(scheduleDate.getMinutes()).padStart(2, "0")}`;
                  return (
                    <div className="rounded-lg border border-primary/50 bg-white p-2 shadow-lg opacity-95">
                      <ReadOnlyMonthScheduleCard
                        schedule={schedule}
                        displayName={displayName}
                        isRoute={isRoute}
                        timeStr={timeStr}
                      />
                    </div>
                  );
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          content
        )}
      </div>

      {indicators.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Resumo do Mês</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Total Agendado</div>
              <div className="text-lg font-semibold text-slate-900">
                {indicators.reduce((sum, ind) => sum + ind.scheduledHours, 0).toFixed(1)} horas
              </div>
            </div>
            <div>
              <div className="text-slate-500">Total Disponível</div>
              <div className="text-lg font-semibold text-slate-900">
                {indicators.reduce((sum, ind) => sum + ind.availableHours, 0).toFixed(1)} horas
              </div>
            </div>
            <div>
              <div className="text-slate-500">Utilização Média</div>
              <div className="text-lg font-semibold text-slate-900">
                {indicators.length > 0
                  ? (indicators.reduce((sum, ind) => sum + ind.utilization, 0) / indicators.length).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthDayDroppable({
  id,
  dateKey,
  isToday,
  colorClass,
  onClick,
  children,
}: {
  id: string;
  dateKey: string;
  isToday: boolean;
  colorClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id, data: { dateKey } });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "flex min-h-[120px] flex-col rounded-lg border-2 px-1 py-1 text-left transition-all overflow-hidden",
        "hover:shadow-md cursor-pointer",
        colorClass,
        isToday && "ring-2 ring-primary ring-offset-2",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}
