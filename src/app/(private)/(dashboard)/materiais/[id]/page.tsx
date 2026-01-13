import { LogisticsTab } from "@/components/materials/tabs/logistics-tab";
import { TechnicalTab } from "@/components/materials/tabs/technical-tab";
import { TraceabilityTab } from "@/components/materials/tabs/traceability-tab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

// Mock data
const material = {
  id: "2",
  name: "Mobilgear 600 XP 68",
  sku: "OLE-045",
  manufacturer: "Mobil",
  type: "Óleo Sintético",
  current: 180,
  min: 50,
  max: 500,
};

function getStockStatus(current: number, min: number) {
  if (current < min)
    return { label: "Crítico", variant: "destructive" as const };
  if (current < min * 2) return { label: "Baixo", variant: "warning" as const };
  return { label: "Normal", variant: "success" as const };
}

export default function MaterialDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const status = getStockStatus(material.current, material.min);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-8 -mt-6 border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/materiais"
              className="hover:text-primary mt-1 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="bg-primary/10 ring-primary/20 flex h-20 w-20 shrink-0 items-center justify-center rounded-xl ring-1">
              <span className="text-primary text-2xl font-bold">M</span>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {material.name}
                </h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="mb-2 text-slate-600">
                SKU: {material.sku} • {material.manufacturer}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Estoque Atual: </span>
                  <span className="text-primary font-semibold">
                    {material.current}L
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  <span className="text-slate-500">Tipo: </span>
                  <span className="font-medium text-slate-900">
                    {material.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              <Download className="h-4 w-4" />
              Ficha Técnica
            </button>
            <button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="technical">Dados Técnicos</TabsTrigger>
          <TabsTrigger value="logistics">Logística & Estoque</TabsTrigger>
          <TabsTrigger value="traceability">Rastreabilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="technical">
          <TechnicalTab />
        </TabsContent>

        <TabsContent value="logistics">
          <LogisticsTab />
        </TabsContent>

        <TabsContent value="traceability">
          <TraceabilityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
