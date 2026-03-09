"use client";

import { PlanningCalendarContainer } from "@/components/planning-routes/PlanningCalendarContainer";
import { ProgramacaoCalendarContainer } from "@/components/planning-advanced/ProgramacaoCalendarContainer";
import { PlanningRoutesContent } from "@/components/planning-routes/PlanningRoutesContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarClock, Route as RouteIcon } from "lucide-react";
import { useState } from "react";

type CalendarMode = "planning" | "programming";

export default function PlanejamentoPage() {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("planning");

  return (
    <div className="flex pb-20 flex-col overflow-hidden -m-6 lg:-m-8">
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Planejamento
            </h1>
            <p className="text-slate-500">
              Organize rotas e planeje a manutenção
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="rotas" className="flex h-full flex-col">
          <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-3">
            <TabsList>
              <TabsTrigger value="rotas" className="flex items-center gap-2">
                <RouteIcon className="h-4 w-4" />
                Organização de Rotas
              </TabsTrigger>
              <TabsTrigger value="planejamento" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Planejamento
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="rotas" className="flex-1 overflow-auto p-6">
            <PlanningRoutesContent />
          </TabsContent>
          <TabsContent value="planejamento" className="flex-1 overflow-hidden flex flex-col p-0">
            {/* Toggle Modo Planejamento / Modo Programação */}
            <div className="flex-shrink-0 flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-2">
              <span className="text-sm font-medium text-slate-600">Modo:</span>
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setCalendarMode("planning")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    calendarMode === "planning"
                      ? "bg-primary text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Modo Planejamento
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMode("programming")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    calendarMode === "programming"
                      ? "bg-primary text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Modo Programação
                </button>
              </div>
              <p className="text-xs text-slate-500 ml-2">
                {calendarMode === "planning"
                  ? "Edite agendamentos e organize o calendário"
                  : "Visualize e emita ordens de serviço"}
              </p>
            </div>
            <div className="flex-1 min-h-0">
              {calendarMode === "planning" ? (
                <PlanningCalendarContainer />
              ) : (
                <ProgramacaoCalendarContainer />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
