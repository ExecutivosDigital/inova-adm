"use client";

import { PlanningCalendarContainer } from "@/components/planning-routes/PlanningCalendarContainer";
import { PlanningRoutesContent } from "@/components/planning-routes/PlanningRoutesContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Route as RouteIcon } from "lucide-react";

export default function PlanejamentoPage() {
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
          <TabsContent value="planejamento" className="flex-1 overflow-hidden p-0">
            <PlanningCalendarContainer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
