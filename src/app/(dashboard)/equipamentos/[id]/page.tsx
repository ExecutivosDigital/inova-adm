import { EquipmentHeader } from "@/components/equipment/equipment-header";
import { HistoryTab } from "@/components/equipment/tabs/history-tab";
import { OverviewTab } from "@/components/equipment/tabs/overview-tab";
import { ParametersTab } from "@/components/equipment/tabs/parameters-tab";
import { StructureTab } from "@/components/equipment/tabs/structure-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// This would normally come from an API or database
const equipment = {
  id: "1",
  tag: "MOE-001",
  name: "Moenda 01 - Redutor Principal",
  criticality: "alta" as const,
  availability: 98,
};

export default function EquipmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <EquipmentHeader equipment={equipment} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="structure">Estrutura & Serviços</TabsTrigger>
          <TabsTrigger value="parameters">Parâmetros de Fluidos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="structure">
          <StructureTab />
        </TabsContent>

        <TabsContent value="parameters">
          <ParametersTab />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
