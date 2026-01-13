import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

type Criticality = "alta" | "media" | "baixa";

interface LinkedAsset {
  id: string;
  tag: string;
  name: string;
  sector: string;
  cip: string;
  consumption: string;
  criticality: Criticality;
}

const linkedAssets: LinkedAsset[] = [
  {
    id: "1",
    tag: "MOE-001",
    name: "Moenda 01 - Redutor Principal",
    sector: "Moagem",
    cip: "CIP 03 (Troca de Óleo)",
    consumption: "45L / Semestral",
    criticality: "alta",
  },
  {
    id: "3",
    tag: "HID-007",
    name: "Unidade Hidráulica Central",
    sector: "Utilidades",
    cip: "CIP 07 (Manutenção de Óleo)",
    consumption: "60L / Anual",
    criticality: "alta",
  },
  {
    id: "5",
    tag: "RED-023",
    name: "Redutor Transportador 2",
    sector: "Ensaque",
    cip: "CIP 12 (Troca de Óleo)",
    consumption: "15L / Semestral",
    criticality: "media",
  },
];

const criticalityMap = {
  alta: { label: "Alta", variant: "high" as const },
  media: { label: "Média", variant: "medium" as const },
  baixa: { label: "Baixa", variant: "low" as const },
};

export function TraceabilityTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Ativos Vinculados
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Equipamentos e pontos que utilizam este material
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary text-2xl font-bold">
              {linkedAssets.length}
            </p>
            <p className="text-xs text-slate-500">equipamentos</p>
          </div>
        </div>

        <div className="space-y-3">
          {linkedAssets.map((asset) => (
            <Link
              key={asset.id}
              href={`/equipamentos/${asset.id}`}
              className="hover:border-primary/50 group block rounded-lg border border-slate-200 p-4 transition-all hover:bg-slate-50"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="group-hover:text-primary font-medium text-slate-900 transition-colors">
                      {asset.tag}
                    </h4>
                    <Badge variant={criticalityMap[asset.criticality].variant}>
                      {criticalityMap[asset.criticality].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{asset.name}</p>
                </div>
                <ExternalLink className="group-hover:text-primary h-4 w-4 text-slate-400 transition-colors" />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-sm md:grid-cols-3">
                <div>
                  <span className="text-slate-500">Setor: </span>
                  <span className="text-slate-900">{asset.sector}</span>
                </div>
                <div>
                  <span className="text-slate-500">Aplicação: </span>
                  <span className="text-slate-900">{asset.cip}</span>
                </div>
                <div>
                  <span className="text-slate-500">Consumo: </span>
                  <span className="font-medium text-slate-900">
                    {asset.consumption}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Impact Notice */}
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Atenção:</strong> Se este material for descontinuado,
            será necessário atualizar o plano de lubrificação de{" "}
            <strong>{linkedAssets.length} equipamentos</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
