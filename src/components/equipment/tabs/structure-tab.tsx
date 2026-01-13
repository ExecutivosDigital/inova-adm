"use client";

import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type CipStatus = "em-dia" | "atrasado" | "proximo";

interface CIP {
  id: string;
  name: string;
  service: string;
  frequency: string;
  status: CipStatus;
  material: string;
  materialId: string;
  volume: string;
}

interface Subset {
  id: string;
  name: string;
  cips: CIP[];
}

interface Structure {
  id: string;
  name: string;
  subsets: Subset[];
}

// Mock hierarchical data
const structure: Structure[] = [
  {
    id: "conjunto-a",
    name: "Conjunto A (Motor)",
    subsets: [
      {
        id: "sub-a1",
        name: "Subconjunto A.1 (Mancal Dianteiro)",
        cips: [
          {
            id: "cip-01",
            name: "CIP 01 (Ponto de Graxa)",
            service: "Reaplicação de Graxa",
            frequency: "Semanal",
            status: "em-dia",
            material: "Graxa Shell Gadus S2 V220",
            materialId: "1",
            volume: "20g",
          },
        ],
      },
      {
        id: "sub-a2",
        name: "Subconjunto A.2 (Mancal Traseiro)",
        cips: [
          {
            id: "cip-02",
            name: "CIP 02 (Ponto de Graxa)",
            service: "Reaplicação de Graxa",
            frequency: "Semanal",
            status: "atrasado",
            material: "Graxa Shell Gadus S2 V220",
            materialId: "1",
            volume: "20g",
          },
        ],
      },
    ],
  },
  {
    id: "conjunto-b",
    name: "Conjunto B (Redutor)",
    subsets: [
      {
        id: "sub-b1",
        name: "Subconjunto B.1 (Cárter)",
        cips: [
          {
            id: "cip-03",
            name: "CIP 03 (Troca de Óleo)",
            service: "Troca de Óleo",
            frequency: "Semestral",
            status: "em-dia",
            material: "Mobilgear 600 XP 68",
            materialId: "2",
            volume: "45L",
          },
        ],
      },
    ],
  },
];

const statusMap = {
  "em-dia": { label: "Em dia", variant: "success" as const },
  atrasado: { label: "Atrasado", variant: "destructive" as const },
  proximo: { label: "Próximo", variant: "warning" as const },
};

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
        <span className="font-medium text-slate-900">{title}</span>
      </button>
      {isOpen && <div className="space-y-3 p-4">{children}</div>}
    </div>
  );
}

export function StructureTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Estrutura Hierárquica & Serviços
        </h3>
        <p className="mb-6 text-sm text-slate-500">
          Conjuntos, subconjuntos e pontos de inspeção e controle (CIPs)
        </p>

        <div className="space-y-3">
          {structure.map((conjunto) => (
            <AccordionItem key={conjunto.id} title={conjunto.name}>
              <div className="space-y-2 pl-4">
                {conjunto.subsets.map((subset) => (
                  <AccordionItem key={subset.id} title={subset.name}>
                    <div className="space-y-3 pl-4">
                      {subset.cips.map((cip) => (
                        <div
                          key={cip.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <h5 className="font-medium text-slate-900">
                              📍 {cip.name}
                            </h5>
                            <Badge variant={statusMap[cip.status].variant}>
                              {statusMap[cip.status].label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <div>
                              <span className="text-slate-500">Serviço: </span>
                              <span className="text-slate-900">
                                {cip.service}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">
                                Frequência:{" "}
                              </span>
                              <span className="text-slate-900">
                                {cip.frequency}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Material: </span>
                              <Link
                                href={`/materiais/${cip.materialId}`}
                                className="text-primary font-medium hover:underline"
                              >
                                {cip.material}
                              </Link>
                            </div>
                            <div>
                              <span className="text-slate-500">Volume: </span>
                              <span className="text-slate-900">
                                {cip.volume}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                ))}
              </div>
            </AccordionItem>
          ))}
        </div>
      </div>
    </div>
  );
}
