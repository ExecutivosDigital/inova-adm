"use client";

import { PlanningRoutesCalendar } from "@/components/planning-routes/PlanningRoutesCalendar";
import { PlanningRoutesContent } from "@/components/planning-routes/PlanningRoutesContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Route as RouteIcon } from "lucide-react";

export default function PlanejamentoPage() {
  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="rotas" className="w-full">
        <div className="mb-4 flex items-center justify-between">
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

        <TabsContent value="rotas">
          <PlanningRoutesContent />
        </TabsContent>
        <TabsContent value="planejamento">
          <PlanningRoutesCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
