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
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type {
  CompanySchedule,
  Route,
  RouteCipServiceItem,
  RouteScheduleItem,
} from "@/lib/route-types";
import { formatExecutionMinutes, totalExecutionMinutes } from "@/lib/route-types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_PX = 32;

/** Fuso do Brasil (UTC-3): offset em ms para somar a "hora local Brasil" e obter UTC */
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Converte um Date (instante UTC) para componentes de data/hora no fuso Brasil (UTC-3). */
function toBrazilLocal(utcDate: Date): {
  y: number;
  m: number;
  d: number;
  dayOfWeek: number;
  hours: number;
  minutes: number;
} {
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

/** Converte data/hora local Brasil (UTC-3) para um Date em UTC. */
function brazilLocalToUtc(
  y: number,
  m: number,
  d: number,
  hours: number,
  minutes: number
): Date {
  const utcMs = Date.UTC(y, m, d, hours, minutes) + BRAZIL_OFFSET_MS;
  return new Date(utcMs);
}

function parseWorkDays(workDays: string | null): number[] {
  if (!workDays?.trim()) return [];
  try {
    const arr = JSON.parse(workDays) as number[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseTimeToMinutes(hhmm: string | null): number {
  if (!hhmm?.trim()) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Retorna segmentos de trabalho no dia (em minutos desde 00:00), excluindo almoço */
function getWorkingRangesForDay(
  company: CompanySchedule | null,
  dayOfWeek: number
): { start: number; end: number }[] {
  if (!company?.businessHoursStart || !company?.businessHoursEnd) return [];
  const workDays = parseWorkDays(company.workDays);
  if (!workDays.includes(dayOfWeek)) return [];
  const dayStart = parseTimeToMinutes(company.businessHoursStart);
  const dayEnd = parseTimeToMinutes(company.businessHoursEnd);
  const lunchStart = parseTimeToMinutes(company.lunchBreakStart);
  const lunchEnd = parseTimeToMinutes(company.lunchBreakEnd);
  const ranges: { start: number; end: number }[] = [];
  if (lunchStart < dayEnd && lunchEnd > dayStart) {
    if (dayStart < lunchStart) ranges.push({ start: dayStart, end: lunchStart });
    if (lunchEnd < dayEnd) ranges.push({ start: lunchEnd, end: dayEnd });
  } else {
    ranges.push({ start: dayStart, end: dayEnd });
  }
  return ranges;
}

/** Segmento de um agendamento em um dia: início e fim em minutos desde 00:00 */
export interface ScheduleSegment {
  dateKey: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
}

/**
 * Dado início (Date em UTC), duração em minutos e horários da empresa, retorna os segmentos
 * (por dia e horário) que o card deve ocupar no fuso Brasil (UTC-3), respeitando horário útil.
 */
function computeScheduleSegments(
  scheduledStartAtUtc: Date,
  durationMinutes: number,
  company: CompanySchedule | null
): ScheduleSegment[] {
  const segments: ScheduleSegment[] = [];
  if (!company || durationMinutes <= 0) return segments;
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

/** Retorna segunda-feira da semana que contém d */
function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Lista de slots de 30min entre startMin e endMin (em minutos desde 00:00) */
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

/** Tipo do payload do draggable (card de agendamento) */
interface ScheduleDragData {
  scheduleId: string;
  routeId: string;
  routeCode: string;
  routeName: string;
}

/** Tipo do payload do droppable (célula de slot) */
interface SlotDropData {
  dateKey: string;
  slotMin: number;
}

/** Célula de slot que aceita drop de cards */
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
      data-datekey={dateKey}
      data-slotmin={slotMin}
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
          title={`Adicionar rota às ${formatSlotLabel(slotMin)}`}
        >
          <Plus className="h-4 w-4 text-primary" />
        </button>
      )}
      {children}
    </div>
  );
}

/** Card de agendamento arrastável */
function DraggableScheduleCard({
  id,
  data,
  isMoving,
  style,
  className,
  onRemove,
  routeCode,
  routeName,
  duration,
}: {
  id: string;
  data: ScheduleDragData;
  isMoving: boolean;
  style: React.CSSProperties;
  className: string;
  onRemove: () => void;
  routeCode: string;
  routeName: string;
  duration: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data,
  });
  const cssTransform = transform ? CSS.Translate.toString(transform) : undefined;
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
        <span className="truncate font-medium text-slate-900">
          {routeCode} – {routeName}
        </span>
        {duration > 0 && (
          <span className="shrink-0 text-slate-500">{formatExecutionMinutes(duration)}</span>
        )}
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

export function PlanningRoutesCalendar() {
  const { GetAPI, PostAPI, DeleteAPI } = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();

  const [companySchedule, setCompanySchedule] = useState<CompanySchedule | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeCipServices, setRouteCipServices] = useState<RouteCipServiceItem[]>([]);
  const [schedules, setSchedules] = useState<RouteScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultDateKey, setAddDefaultDateKey] = useState<string | null>(null);
  /** Horário de início em minutos desde 00:00 (ex.: 480 = 08:00). Usado ao abrir modal a partir de um slot. */
  const [addDefaultSlotMin, setAddDefaultSlotMin] = useState<number | null>(null);
  const [addingRouteId, setAddingRouteId] = useState<string | null>(null);
  const [movingScheduleId, setMovingScheduleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const slotGridRef = useRef<HTMLDivElement>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<ScheduleDragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  const routeUrl = useMemo(() => {
    if (!effectiveCompanyId) return null;
    return isSuperAdmin ? `/route?companyId=${effectiveCompanyId}` : "/route";
  }, [effectiveCompanyId, isSuperAdmin]);

  const fetchData = useCallback(async () => {
    if (!effectiveCompanyId || !routeUrl) return;
    setLoading(true);
    try {
      const [companyRes, routesRes, servicesRes, schedulesRes] = await Promise.all([
        GetAPI(`/company/${effectiveCompanyId}`, true),
        GetAPI(routeUrl, true),
        GetAPI(`/route/company/${effectiveCompanyId}/route-services`, true),
        GetAPI(`/route/company/${effectiveCompanyId}/schedules`, true),
      ]);
      if (companyRes.status === 200 && companyRes.body) {
        setCompanySchedule(companyRes.body as CompanySchedule);
      }
      if (routesRes.status === 200 && routesRes.body?.routes) {
        setRoutes((routesRes.body.routes as Route[]).filter((r) => !r.isTemporary));
      }
      if (servicesRes.status === 200 && servicesRes.body?.routeCipServices) {
        setRouteCipServices(servicesRes.body.routeCipServices as RouteCipServiceItem[]);
      }
      if (schedulesRes.status === 200 && schedulesRes.body?.routeSchedules) {
        setSchedules(schedulesRes.body.routeSchedules as RouteScheduleItem[]);
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, routeUrl, GetAPI]);

  useEffect(() => {
    if (!effectiveCompanyId) {
      setCompanySchedule(null);
      setRoutes([]);
      setRouteCipServices([]);
      setSchedules([]);
      setLoading(false);
      return;
    }
    fetchData();
  }, [effectiveCompanyId, fetchData]);

  const workDaysSet = useMemo(
    () => new Set(parseWorkDays(companySchedule?.workDays ?? null)),
    [companySchedule?.workDays]
  );

  const durationByRouteId = useMemo(() => {
    const map = new Map<string, number>();
    for (const route of routes) {
      const items = routeCipServices.filter((rcs) => rcs.routeId === route.id);
      map.set(route.id, totalExecutionMinutes(items));
    }
    return map;
  }, [routes, routeCipServices]);

  const weekDays = useMemo(() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const slotLabels = useMemo(() => {
    if (!companySchedule?.businessHoursStart || !companySchedule?.businessHoursEnd) {
      return getSlotLabels(8 * 60, 18 * 60);
    }
    const start = parseTimeToMinutes(companySchedule.businessHoursStart);
    const end = parseTimeToMinutes(companySchedule.businessHoursEnd);
    return getSlotLabels(start, end);
  }, [companySchedule]);

  const lunchRange = useMemo(() => {
    if (!companySchedule?.lunchBreakStart || !companySchedule?.lunchBreakEnd) return null;
    return {
      start: parseTimeToMinutes(companySchedule.lunchBreakStart),
      end: parseTimeToMinutes(companySchedule.lunchBreakEnd),
    };
  }, [companySchedule]);

  /** Normaliza ISO da API para interpretação consistente em UTC (evita dia errado por timezone). */
  const parseScheduleDate = useCallback((scheduledStartAt: string): Date => {
    const raw = scheduledStartAt?.trim() ?? "";
    if (!raw) return new Date(NaN);
    if (raw.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(raw)) return new Date(raw);
    return new Date(raw + "Z");
  }, []);

  const scheduleSegmentsMap = useMemo(() => {
    const map = new Map<string, { segment: ScheduleSegment; schedule: RouteScheduleItem; duration: number }[]>();
    for (const sch of schedules) {
      const start = parseScheduleDate(sch.scheduledStartAt);
      if (Number.isNaN(start.getTime())) continue;
      const duration = durationByRouteId.get(sch.routeId) ?? 0;
      const segments = computeScheduleSegments(start, duration, companySchedule);
      for (const seg of segments) {
        if (!map.has(seg.dateKey)) map.set(seg.dateKey, []);
        map.get(seg.dateKey)!.push({ segment: seg, schedule: sch, duration });
      }
    }
    return map;
  }, [schedules, durationByRouteId, companySchedule, parseScheduleDate]);

  const handleAddSchedule = useCallback(
    async (routeId: string, scheduledStartAt: string) => {
      if (!effectiveCompanyId) return;
      setAddingRouteId(routeId);
      const body: { routeId: string; scheduledStartAt: string; companyId?: string } = {
        routeId,
        scheduledStartAt,
      };
      if (isSuperAdmin) body.companyId = effectiveCompanyId;
      const res = await PostAPI("/route/schedule", body, true);
      setAddingRouteId(null);
      setShowAddModal(false);
      setAddDefaultDateKey(null);
      setAddDefaultSlotMin(null);
      if (res.status === 200 || res.status === 201) {
        setToast({ type: "success", text: "Rota agendada." });
        fetchData();
      } else {
        setToast({
          type: "error",
          text: (res.body as { message?: string })?.message ?? "Erro ao agendar.",
        });
      }
    },
    [effectiveCompanyId, isSuperAdmin, PostAPI, fetchData]
  );

  const handleRemoveSchedule = useCallback(
    async (scheduleId: string) => {
      if (!effectiveCompanyId) return;
      const url = isSuperAdmin
        ? `/route/schedule/${scheduleId}?companyId=${effectiveCompanyId}`
        : `/route/schedule/${scheduleId}`;
      const res = await DeleteAPI(url, true);
      if (res.status === 200 || (res as { status?: number }).status === 204) {
        setToast({ type: "success", text: "Agendamento removido." });
        fetchData();
      } else {
        setToast({
          type: "error",
          text: (res.body as { message?: string })?.message ?? "Erro ao remover.",
        });
      }
    },
    [effectiveCompanyId, isSuperAdmin, DeleteAPI, fetchData]
  );

  /** Move agendamento para outro dia/horário (delete + create). */
  const handleMoveSchedule = useCallback(
    async (scheduleId: string, routeId: string, dateKey: string, slotMin: number) => {
      if (!effectiveCompanyId) return;
      setMovingScheduleId(scheduleId);
      const scheduledStartAt = `${dateKey}T${String(Math.floor(slotMin / 60)).padStart(2, "0")}:${String(slotMin % 60).padStart(2, "0")}:00.000-03:00`;
      const deleteUrl = isSuperAdmin
        ? `/route/schedule/${scheduleId}?companyId=${effectiveCompanyId}`
        : `/route/schedule/${scheduleId}`;
      const delRes = await DeleteAPI(deleteUrl, true);
      if (delRes.status !== 200 && (delRes as { status?: number }).status !== 204) {
        setMovingScheduleId(null);
        setToast({
          type: "error",
          text: (delRes.body as { message?: string })?.message ?? "Erro ao mover agendamento.",
        });
        return;
      }
      const body: { routeId: string; scheduledStartAt: string; companyId?: string } = {
        routeId,
        scheduledStartAt,
      };
      if (isSuperAdmin) body.companyId = effectiveCompanyId;
      const createRes = await PostAPI("/route/schedule", body, true);
      setMovingScheduleId(null);
      if (createRes.status === 200 || createRes.status === 201) {
        setToast({ type: "success", text: "Agendamento movido." });
        fetchData();
      } else {
        setToast({
          type: "error",
          text: (createRes.body as { message?: string })?.message ?? "Erro ao mover agendamento.",
        });
      }
    },
    [effectiveCompanyId, isSuperAdmin, DeleteAPI, PostAPI, fetchData]
  );

  /** Abre o modal de agendar. dateKey: "YYYY-MM-DD". slotMin opcional: minutos desde 00:00 do slot clicado (ex.: 480 = 08:00). */
  const openAddModal = useCallback((dateKey: string, slotMin?: number) => {
    setAddDefaultDateKey(dateKey);
    setAddDefaultSlotMin(slotMin ?? null);
    setShowAddModal(true);
  }, []);

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
        cardData?.scheduleId &&
        cardData?.routeId
      ) {
        handleMoveSchedule(cardData.scheduleId, cardData.routeId, slotData.dateKey, slotData.slotMin);
      }
    },
    [handleMoveSchedule]
  );

  if (!effectiveCompanyId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="text-sm">
          Selecione uma empresa no dropdown do header para ver o calendário de planejamento.
        </p>
      </div>
    );
  }

  if (loading && schedules.length === 0 && routes.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weekLabel = `${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} – ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1} ${weekDays[6].getFullYear()}`;
  const scheduleLegend =
    companySchedule?.businessHoursStart && companySchedule?.businessHoursEnd
      ? `Jornada: ${companySchedule.businessHoursStart} – ${companySchedule.businessHoursEnd}${lunchRange ? ` (almoço ${companySchedule.lunchBreakStart}–${companySchedule.lunchBreakEnd})` : ""}`
      : "Cadastre dias e horários da empresa em Configurações.";

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={cn(
            "rounded-lg border p-4 text-sm",
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {toast.text}
          <button type="button" className="ml-2 underline" onClick={() => setToast(null)}>
            Fechar
          </button>
        </div>
      )}

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
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">{scheduleLegend}</p>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              const startMin = companySchedule?.businessHoursStart
                ? parseTimeToMinutes(companySchedule.businessHoursStart)
                : 8 * 60;
              openAddModal(dateToKey(today), startMin);
            }}
            className="rounded border border-primary bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
          >
            Adicionar agendamento
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="relative min-w-[800px] w-full" ref={gridRef}>
            <div
              ref={slotGridRef}
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
                      onAddClick={() => openAddModal(dateKey, slotMin)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Cards de agendamento sobre a grade */}
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
              return items.map(({ segment, schedule }) => {
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
                const startOffset =
                  (segment.startMin - slotLabels[startSlotIdx]) / SLOT_MINUTES;
                const topPx = startOffset * SLOT_HEIGHT_PX;
                const heightPx =
                  (segment.endMin - segment.startMin) / SLOT_MINUTES * SLOT_HEIGHT_PX;
                const route = schedule.route;
                const duration = durationByRouteId.get(schedule.routeId) ?? 0;
                const isMoving = movingScheduleId === schedule.id;
                const dragId = `schedule-${schedule.id}-${segment.dateKey}-${segment.startMin}`;
                const dragData: ScheduleDragData = {
                  scheduleId: schedule.id,
                  routeId: schedule.routeId,
                  routeCode: route?.code ?? "",
                  routeName: route?.name ?? "",
                };
                return (
                  <DraggableScheduleCard
                    key={dragId}
                    id={dragId}
                    data={dragData}
                    isMoving={isMoving}
                    routeCode={route?.code ?? ""}
                    routeName={route?.name ?? ""}
                    duration={duration}
                    onRemove={() => handleRemoveSchedule(schedule.id)}
                    style={{
                      gridColumn: dayCol,
                      gridRow: `${rowStart} / ${rowEnd}`,
                      alignSelf: "start",
                      justifySelf: "stretch",
                      marginTop: topPx,
                      height: Math.max(24, heightPx),
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    }}
                    className="pointer-events-auto flex w-full min-w-0 cursor-grab rounded border border-primary/40 bg-primary/10 px-2 py-1 text-xs overflow-hidden active:cursor-grabbing"
                  />
                );
              });
            })}
          </div>

          <DragOverlay>
            {activeDragId && activeDragData ? (
              <div className="rounded border-2 border-primary bg-primary/20 px-3 py-2 text-sm font-medium text-slate-900 shadow-lg cursor-grabbing">
                {activeDragData.routeCode} – {activeDragData.routeName}
              </div>
            ) : null}
          </DragOverlay>
        </div>
        </DndContext>
      </div>

      {showAddModal && (
        <AddScheduleModal
          routes={routes}
          durationByRouteId={durationByRouteId}
          companySchedule={companySchedule}
          defaultDateKey={addDefaultDateKey}
          defaultSlotMin={addDefaultSlotMin}
          loading={!!addingRouteId}
          onSchedule={handleAddSchedule}
          onClose={() => {
            setShowAddModal(false);
            setAddDefaultDateKey(null);
            setAddDefaultSlotMin(null);
          }}
        />
      )}
    </div>
  );
}

interface AddScheduleModalProps {
  routes: Route[];
  durationByRouteId: Map<string, number>;
  companySchedule: CompanySchedule | null;
  defaultDateKey: string | null;
  /** Minutos desde 00:00 do slot clicado (ex.: 480 = 08:00). Quando definido, pré-preenche o horário de início. */
  defaultSlotMin: number | null;
  loading: boolean;
  onSchedule: (routeId: string, scheduledStartAt: string) => void;
  onClose: () => void;
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function AddScheduleModal({
  routes,
  durationByRouteId,
  companySchedule,
  defaultDateKey,
  defaultSlotMin,
  loading,
  onSchedule,
  onClose,
}: AddScheduleModalProps) {
  const defaultDate = defaultDateKey ?? dateToKey(new Date());
  const defaultTime =
    defaultSlotMin != null
      ? minutesToTimeStr(defaultSlotMin)
      : (companySchedule?.businessHoursStart && companySchedule.businessHoursStart.length === 5
          ? companySchedule.businessHoursStart
          : "08:00");

  const [dateKey, setDateKey] = useState(defaultDate);
  const [timeStr, setTimeStr] = useState(defaultTime);
  const [routeId, setRouteId] = useState("");

  useEffect(() => {
    if (defaultDateKey) setDateKey(defaultDateKey);
  }, [defaultDateKey]);

  useEffect(() => {
    if (defaultSlotMin != null) {
      setTimeStr(minutesToTimeStr(defaultSlotMin));
    } else if (companySchedule?.businessHoursStart && companySchedule.businessHoursStart.length === 5) {
      setTimeStr(companySchedule.businessHoursStart);
    }
  }, [defaultSlotMin, companySchedule?.businessHoursStart]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeId.trim()) return;
    const [y, m, d] = dateKey.split("-").map(Number);
    const h = Number(timeStr.split(":")[0]) || 0;
    const min = Number(timeStr.split(":")[1]) || 0;
    // Tratar sempre como Brasil (UTC-3): envio ISO com offset -03:00 para o backend
    const scheduledStartAt = `${dateKey}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000-03:00`;
    onSchedule(routeId, scheduledStartAt);
  };

  const selectedDuration = routeId ? (durationByRouteId.get(routeId) ?? 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Agendar rota</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Rota</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecione a rota</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} – {r.name}
                  {(durationByRouteId.get(r.id) ?? 0) > 0 && (
                    <> ({formatExecutionMinutes(durationByRouteId.get(r.id) ?? 0)})</>
                  )}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Horário de início</label>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          {selectedDuration > 0 && (
            <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
              O card da rota ocupará o calendário a partir do horário escolhido, dentro do expediente da empresa,
              por aproximadamente {formatExecutionMinutes(selectedDuration)} (tempo de execução dos serviços).
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
