import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

type HistoryType = "Preventiva" | "Preditiva" | "Corretiva";

interface HistoryItem {
  id: string;
  date: string;
  type: HistoryType;
  description: string;
  technician: string;
  photo: string | null;
  status: string;
}

const history: HistoryItem[] = [
  {
    id: "1",
    date: "2025-01-10",
    type: "Preventiva",
    description: "Troca de óleo do redutor",
    technician: "João Silva",
    photo: null,
    status: "concluido",
  },
  {
    id: "2",
    date: "2024-12-15",
    type: "Preditiva",
    description: "Análise de vibração - Níveis normais",
    technician: "Maria Santos",
    photo: null,
    status: "concluido",
  },
  {
    id: "3",
    date: "2024-11-20",
    type: "Corretiva",
    description: "Substituição de rolamento dianteiro",
    technician: "Carlos Pereira",
    photo: null,
    status: "concluido",
  },
  {
    id: "4",
    date: "2024-10-05",
    type: "Preventiva",
    description: "Reaplicação de graxa nos mancais",
    technician: "Ana Costa",
    photo: null,
    status: "concluido",
  },
];

const typeMap = {
  Preventiva: { variant: "success" as const },
  Preditiva: { variant: "default" as const },
  Corretiva: { variant: "warning" as const },
};

export function HistoryTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-6 text-lg font-semibold text-slate-900">
          Linha do Tempo de Intervenções
        </h3>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute top-0 bottom-0 left-6 w-px bg-slate-200"></div>

          {/* Timeline Items */}
          <div className="space-y-8">
            {history.map((item, index) => (
              <div key={item.id} className="relative flex gap-6">
                {/* Dot */}
                <div className="relative z-10">
                  <div className="bg-primary/10 ring-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white ring-2">
                    <div className="bg-primary h-3 w-3 rounded-full"></div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">
                            {new Date(item.date).toLocaleDateString("pt-BR")}
                          </span>
                          <Badge variant={typeMap[item.type].variant}>
                            {item.type}
                          </Badge>
                        </div>
                        <p className="font-medium text-slate-900">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User className="h-4 w-4" />
                      <span>Executado por: {item.technician}</span>
                    </div>

                    {item.photo && (
                      <div className="mt-3">
                        <div className="h-32 w-32 rounded-lg bg-slate-100"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsible People */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Responsáveis
        </h3>
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 text-primary flex h-12 w-12 items-center justify-center rounded-full font-bold">
            JS
          </div>
          <div>
            <p className="font-medium text-slate-900">João Silva</p>
            <p className="text-sm text-slate-500">
              Técnico de Manutenção - Setor Moagem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
