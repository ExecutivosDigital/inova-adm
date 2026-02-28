"use client";

import { ProgramacaoCalendarContainer } from "@/components/planning-advanced/ProgramacaoCalendarContainer";

export default function Programacao2Page() {
  return (
    <div className="flex pb-20 flex-col overflow-hidden -m-6 lg:-m-8">
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Programação
          </h1>
          <p className="text-slate-500">
            Visualize o planejamento e emita ordens de serviço
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ProgramacaoCalendarContainer />
      </div>
    </div>
  );
}
