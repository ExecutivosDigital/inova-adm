"use client";

import { useState, useEffect } from "react";
import { Loader2, Route as RouteIcon, Wrench } from "lucide-react";
import type {
  PlanningRoute,
  PlanningService,
  ScheduleType,
} from "@/lib/planning-advanced-types";

interface AddScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (
    type: ScheduleType,
    routeIdOrServiceId: string,
    scheduledStartAt: string
  ) => void;
  routes: PlanningRoute[];
  services: PlanningService[];
  defaultDateKey?: string;
  defaultSlotMin?: number;
  defaultType?: ScheduleType;
  loading?: boolean;
}

function minutesToTimeStr(minutes: number): string {
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

export function AddScheduleModal({
  open,
  onClose,
  onSchedule,
  routes,
  services,
  defaultDateKey,
  defaultSlotMin,
  defaultType = "route",
  loading = false,
}: AddScheduleModalProps) {
  const [type, setType] = useState<ScheduleType>(defaultType);
  const [routeId, setRouteId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [dateKey, setDateKey] = useState(
    defaultDateKey || new Date().toISOString().split("T")[0]
  );
  const [timeStr, setTimeStr] = useState(
    defaultSlotMin != null ? minutesToTimeStr(defaultSlotMin) : "08:00"
  );
  
  useEffect(() => {
    if (defaultDateKey) setDateKey(defaultDateKey);
  }, [defaultDateKey]);
  
  useEffect(() => {
    if (defaultSlotMin != null) {
      setTimeStr(minutesToTimeStr(defaultSlotMin));
    }
  }, [defaultSlotMin]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = type === "route" ? routeId : serviceId;
    if (!id.trim()) return;
    
    const [y, m, d] = dateKey.split("-").map(Number);
    const [h, min] = timeStr.split(":").map(Number);
    const scheduledStartAt = `${dateKey}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000-03:00`;
    
    onSchedule(type, id, scheduledStartAt);
  };
  
  const selectedRoute = routes.find((r) => r.id === routeId);
  const selectedService = services.find((s) => s.id === serviceId);
  const selectedDuration = type === "route" ? selectedRoute?.duration : selectedService?.duration;
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Agendar no Planejamento
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de agendamento */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="route"
                  checked={type === "route"}
                  onChange={(e) => {
                    setType("route");
                    setRouteId("");
                    setServiceId("");
                  }}
                  className="text-primary"
                />
                <RouteIcon className="h-4 w-4 text-primary" />
                <span className="text-sm">Rota</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="service"
                  checked={type === "service"}
                  onChange={(e) => {
                    setType("service");
                    setRouteId("");
                    setServiceId("");
                  }}
                  className="text-primary"
                />
                <Wrench className="h-4 w-4 text-primary" />
                <span className="text-sm">Serviço Individual</span>
              </label>
            </div>
          </div>
          
          {/* Seleção de rota ou serviço */}
          {type === "route" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Rota
              </label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione a rota</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} – {r.name} ({formatDuration(r.duration)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Serviço
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione o serviço</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} – {s.equipmentName} ({formatDuration(s.duration)})
                    {s.periodDays && ` • A cada ${s.periodDays} dias`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Data */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Data
            </label>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          
          {/* Horário */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Horário de início
            </label>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          
          {/* Informação de duração */}
          {selectedDuration && selectedDuration > 0 && (
            <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                O agendamento ocupará o calendário por aproximadamente{" "}
                <strong>{formatDuration(selectedDuration)}</strong> (tempo de
                execução estimado).
              </p>
            </div>
          )}
          
          {/* Botões */}
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
              disabled={loading || !(type === "route" ? routeId : serviceId)}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agendando...
                </span>
              ) : (
                "Agendar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
