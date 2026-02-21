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
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Route as RouteIcon,
  Wrench,
} from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import type {
  ScheduleItem,
  CompanySchedule,
  PlanningRoute,
  PlanningService,
} from "@/lib/planning-advanced-types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_PX = 32;
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;

interface ScheduleSegment {
  dateKey: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
}

interface AdvancedWeeklyCalendarProps {
  schedules: ScheduleItem[];
  companySchedule: CompanySchedule;
  routes: PlanningRoute[];
  services: PlanningService[];
  onAddSchedule: (type: "route" | "service", dateKey: string, slotMin: number) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onMoveSchedule: (scheduleId: string, dateKey: string, slotMin: number) => void;
}

function toBrazilLocal(utcDate: Date) {
  const t = utcDate.getTime() - BRAZIL_OFFSET_MS;
  const b = new Date(t);
  return {
    y: b.getUTCFullYear(),
    m: b.getUTCMonth(),
    d: b.getUTCDate(),
    dayOfWeek: b.getUTCDay(),
    hours: b.getUTCHours(),
    minutes: b.getUTCMinutes(),
  };
}

function brazilLocalToUtc(y: number, m: number, d: number, hours: number, minutes: number): Date {
  const utcMs = Date.UTC(y, m, d, hours, minutes) + BRAZIL_OFFSET_MS;
  return new Date(utcMs);
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

function getWorkingRangesForDay(company: CompanySchedule, dayOfWeek: number) {
  const workDays = company.workDays;
  if (!workDays.includes(dayOfWeek)) return [];
  
  const dayStart = parseTimeToMinutes(company.businessHoursStart);
  const dayEnd = parseTimeToMinutes(company.businessHoursEnd);
  const lunchStart = company.lunchBreakStart ? parseTimeToMinutes(company.lunchBreakStart) : null;
  const lunchEnd = company.lunchBreakEnd ? parseTimeToMinutes(company.lunchBreakEnd) : null;
  
  const ranges: { start: number; end: number }[] = [];
  if (lunchStart !== null && lunchEnd !== null && lunchStart < dayEnd && lunchEnd > dayStart) {
    if (dayStart < lunchStart) ranges.push({ start: dayStart, end: lunchStart });
    if (lunchEnd < dayEnd) ranges.push({ start: lunchEnd, end: dayEnd });
  } else {
    ranges.push({ start: dayStart, end: dayEnd });
  }
  return ranges;
}

function computeScheduleSegments(
  scheduledStartAtUtc: Date,
  durationMinutes: number,
  company: CompanySchedule
): ScheduleSegment[] {
  const segments: ScheduleSegment[] = [];
  if (durationMinutes <= 0) return segments;
  
  let remaining = durationMinutes;
  let currentUtc = new Date(scheduledStartAtUtc);
  const maxIterations = 365;
  let iterations = 0;
  
  while (remaining > 0 && iterations++ < maxIterations) {
    const br = toBrazilLocal(currentUtc);
    const dayOfWeek = br.dayOfWeek;
    const ranges = getWorkingRangesForDay(company, dayOfWeek);
    const dateKey = `${br.y}-${String(br.m + 1).padStart(2, "0")}-${String(br.d).padStart(2, "0")}`;
    const dayStartMin = br.hours * 60 + br.minutes;
    let found = false;
    
    for (const range of ranges) {
      if (dayStartMin >= range.end) continue;
      const segStart = Math.max(range.start, dayStartMin);
      const segEnd = range.end;
      const segMinutes = Math.min(segEnd - segStart, remaining);
      if (segMinutes <= 0) continue;
      
      found = true;
      const segEndMin = segStart + segMinutes;
      segments.push({
        dateKey,
        dayIndex: dayOfWeek,
        startMin: segStart,
        endMin: segEndMin,
      });
      remaining -= segMinutes;
      currentUtc = brazilLocalToUtc(
        br.y,
        br.m,
        br.d,
        Math.floor(segEndMin / 60),
        segEndMin % 60
      );
      break;
    }
    
    if (!found) {
      currentUtc = brazilLocalToUtc(br.y, br.m, br.d + 1, 0, 0);
    }
  }
  
  return segments;
}

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getSlotLabels(startMin: number, endMin: number): number[] {
  const labels: number[] = [];
  for (let m = startMin; m < endMin; m += SLOT_MINUTES) labels.push(m);
  return labels;
}

function dateToKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

interface ScheduleDragData {
  scheduleId: string;
  type: "route" | "service";
}

interface SlotDropData {
  dateKey: string;
  slotMin: number;
}

function DroppableSlot({
  dateKey,
  slotMin,
  isWorkDay,
  isLunch,
  onAddClick,
  children,
}: {
  dateKey: string;
  slotMin: number;
  isWorkDay: boolean;
  isLunch: boolean;
  onAddClick: () => void;
  children?: React.ReactNode;
}) {
  const id = `slot-${dateKey}-${slotMin}`;
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { dateKey, slotMin } satisfies SlotDropData,
  });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-b border-r border-slate-100 relative min-h-[32px]",
        !isWorkDay && "bg-slate-50",
        isWorkDay && isLunch && "bg-slate-100",
        isWorkDay && !isLunch && "bg-white",
        isOver && isWorkDay && !isLunch && "ring-1 ring-primary/50 bg-primary/5"
      )}
    >
      {isWorkDay && !isLunch && (
        <button
          type="button"
          onClick={onAddClick}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-primary/5 transition-opacity"
          title={`Adicionar às ${formatSlotLabel(slotMin)}`}
        >
          <Plus className="h-4 w-4 text-primary" />
        </button>
      )}
      {children}
    </div>
  );
}

function DraggableScheduleCard({
  id,
  data,
  isMoving,
  style,
  className,
  onRemove,
  schedule,
}: {
  id: string;
  data: ScheduleDragData;
  isMoving: boolean;
  style: React.CSSProperties;
  className: string;
  onRemove: () => void;
  schedule: ScheduleItem;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data,
  });
  const cssTransform = transform ? CSS.Translate.toString(transform) : undefined;
  
  const isRoute = schedule.type === "route";
  const displayName = isRoute
    ? `${schedule.route?.code} – ${schedule.route?.name}`
    : `${schedule.service?.name} (${schedule.service?.equipmentName})`;
  
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, transform: cssTransform }}
      className={cn(
        className,
        isDragging && "opacity-50 z-10",
        isMoving && "opacity-60"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {isRoute ? (
            <RouteIcon className="h-3 w-3 shrink-0 text-primary" />
          ) : (
            <Wrench className="h-3 w-3 shrink-0 text-green-600" />
          )}
          <span className="truncate font-medium text-slate-900 text-xs">{displayName}</span>
        </div>
        <span className="shrink-0 text-slate-500 text-xs">{formatDuration(schedule.duration)}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-600"
          title="Remover"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function AdvancedWeeklyCalendar({
  schedules,
  companySchedule,
  routes,
  services,
  onAddSchedule,
  onRemoveSchedule,
  onMoveSchedule,
}: AdvancedWeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
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
  
  const weekDays = useMemo(() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekStart]);
  
  const slotLabels = useMemo(() => {
    const start = parseTimeToMinutes(companySchedule.businessHoursStart);
    const end = parseTimeToMinutes(companySchedule.businessHoursEnd);
    return getSlotLabels(start, end);
  }, [companySchedule]);
  
  const lunchRange = useMemo(() => {
    if (!companySchedule.lunchBreakStart || !companySchedule.lunchBreakEnd) return null;
    return {
      start: parseTimeToMinutes(companySchedule.lunchBreakStart),
      end: parseTimeToMinutes(companySchedule.lunchBreakEnd),
    };
  }, [companySchedule]);
  
  const scheduleSegmentsMap = useMemo(() => {
    const map = new Map<string, { segment: ScheduleSegment; schedule: ScheduleItem }[]>();
    
    for (const sch of schedules) {
      const start = new Date(sch.scheduledStartAt);
      if (Number.isNaN(start.getTime())) continue;
      
      const segments = computeScheduleSegments(start, sch.duration, companySchedule);
      for (const seg of segments) {
        if (!map.has(seg.dateKey)) map.set(seg.dateKey, []);
        map.get(seg.dateKey)!.push({ segment: seg, schedule: sch });
      }
    }
    
    return map;
  }, [schedules, companySchedule]);
  
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
      const slotData = over.data?.current as SlotDropData | undefined;
      const cardData = active.data?.current as ScheduleDragData | undefined;
      
      if (
        slotData?.dateKey != null &&
        slotData?.slotMin != null &&
        cardData?.scheduleId
      ) {
        setMovingScheduleId(cardData.scheduleId);
        onMoveSchedule(cardData.scheduleId, slotData.dateKey, slotData.slotMin);
        setTimeout(() => setMovingScheduleId(null), 500);
      }
    },
    [onMoveSchedule]
  );
  
  const weekLabel = `${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} – ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1} ${weekDays[6].getFullYear()}`;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">Semana {weekLabel}</h2>
          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="text-xs text-slate-500">
          Jornada: {companySchedule.businessHoursStart} – {companySchedule.businessHoursEnd}
          {lunchRange && ` (almoço ${companySchedule.lunchBreakStart}–${companySchedule.lunchBreakEnd})`}
        </div>
      </div>
      
      <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="relative min-w-[800px] w-full">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "56px repeat(7, 1fr)",
                gridTemplateRows: `auto repeat(${slotLabels.length}, ${SLOT_HEIGHT_PX}px)`,
              }}
            >
              <div className="border-b border-r border-slate-200 bg-slate-50" />
              {weekDays.map((d) => (
                <div
                  key={d.toISOString()}
                  className={cn(
                    "border-b border-r border-slate-200 py-2 text-center text-sm font-medium",
                    workDaysSet.has(d.getDay()) ? "bg-white text-slate-700" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {WEEKDAYS[d.getDay()]} {d.getDate()}
                </div>
              ))}
              
              {slotLabels.map((slotMin) => (
                <React.Fragment key={slotMin}>
                  <div className="border-b border-r border-slate-100 bg-slate-50 py-0.5 pr-2 text-right text-xs text-slate-500">
                    {formatSlotLabel(slotMin)}
                  </div>
                  {weekDays.map((d) => {
                    const dateKey = dateToKey(d);
                    const isWorkDay = workDaysSet.has(d.getDay());
                    const slotEndMin = slotMin + SLOT_MINUTES;
                    const isLunch =
                      lunchRange &&
                      slotMin < lunchRange.end &&
                      slotEndMin > lunchRange.start;
                    
                    return (
                      <DroppableSlot
                        key={`${dateKey}-${slotMin}`}
                        dateKey={dateKey}
                        slotMin={slotMin}
                        isWorkDay={isWorkDay}
                        isLunch={!!isLunch}
                        onAddClick={() => {
                          // Abre modal de agendamento (o tipo será selecionado no modal)
                          onAddSchedule("route", dateKey, slotMin);
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            
            {/* Cards de agendamento */}
            <div
              className="pointer-events-none absolute inset-0 z-0 grid"
              style={{
                gridTemplateColumns: "56px repeat(7, 1fr)",
                gridTemplateRows: `auto repeat(${slotLabels.length}, ${SLOT_HEIGHT_PX}px)`,
              }}
            >
              {Array.from(scheduleSegmentsMap.entries()).map(([dateKey, items]) => {
                const dayIndex = weekDays.findIndex((d) => dateToKey(d) === dateKey);
                const dayCol = dayIndex === -1 ? 0 : dayIndex + 2;
                if (dayCol === 0) return null;
                
                // Agrupar por horário para empilhar
                const groupedByTime = new Map<string, typeof items>();
                items.forEach((item) => {
                  const timeKey = `${item.segment.startMin}`;
                  if (!groupedByTime.has(timeKey)) groupedByTime.set(timeKey, []);
                  groupedByTime.get(timeKey)!.push(item);
                });
                
                return Array.from(groupedByTime.entries()).map(([timeKey, timeItems]) => {
                  return timeItems.map(({ segment, schedule }, idx) => {
                    const startSlotIdx = slotLabels.findIndex(
                      (m) => m <= segment.startMin && m + SLOT_MINUTES > segment.startMin
                    );
                    let endSlotIdx = slotLabels.findIndex(
                      (m) => m < segment.endMin && m + SLOT_MINUTES >= segment.endMin
                    );
                    if (endSlotIdx === -1) endSlotIdx = slotLabels.length - 1;
                    if (startSlotIdx === -1) return null;
                    
                    const rowStart = startSlotIdx + 2;
                    const rowEnd = endSlotIdx + 3;
                    const startOffset = (segment.startMin - slotLabels[startSlotIdx]) / SLOT_MINUTES;
                    const topPx = startOffset * SLOT_HEIGHT_PX;
                    const heightPx = ((segment.endMin - segment.startMin) / SLOT_MINUTES) * SLOT_HEIGHT_PX;
                    
                    const isMoving = movingScheduleId === schedule.id;
                    const dragId = `schedule-${schedule.id}-${segment.dateKey}-${segment.startMin}`;
                    const dragData: ScheduleDragData = {
                      scheduleId: schedule.id,
                      type: schedule.type,
                    };
                    
                    // Offset horizontal para empilhar múltiplos no mesmo horário
                    const horizontalOffset = idx * 2; // Pequeno offset para visualizar múltiplos
                    
                    return (
                      <DraggableScheduleCard
                        key={dragId}
                        id={dragId}
                        data={dragData}
                        isMoving={isMoving}
                        schedule={schedule}
                        onRemove={() => onRemoveSchedule(schedule.id)}
                        style={{
                          gridColumn: dayCol,
                          gridRow: `${rowStart} / ${rowEnd}`,
                          alignSelf: "start",
                          justifySelf: "stretch",
                          marginTop: topPx,
                          marginLeft: `${horizontalOffset}%`,
                          width: `${100 - horizontalOffset}%`,
                          height: Math.max(24, heightPx),
                          boxSizing: "border-box",
                        }}
                        className={cn(
                          "pointer-events-auto flex w-full min-w-0 cursor-grab rounded border px-2 py-1 text-xs overflow-hidden active:cursor-grabbing",
                          schedule.type === "route"
                            ? "border-primary/40 bg-primary/10"
                            : "border-green-500/40 bg-green-50"
                        )}
                      />
                    );
                  });
                });
              })}
            </div>
            
            <DragOverlay>
              {activeDragId && activeDragData ? (
                <div className="rounded border-2 border-primary bg-primary/20 px-3 py-2 text-sm font-medium text-slate-900 shadow-lg cursor-grabbing">
                  Movendo...
                </div>
              ) : null}
            </DragOverlay>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
