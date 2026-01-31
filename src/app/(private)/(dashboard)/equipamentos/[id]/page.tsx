"use client";

import { EquipmentHeader } from "@/components/equipment/equipment-header";
import { HistoryTab } from "@/components/equipment/tabs/history-tab";
import { OverviewTab } from "@/components/equipment/tabs/overview-tab";
import { ParametersTab } from "@/components/equipment/tabs/parameters-tab";
import { StructureTab } from "@/components/equipment/tabs/structure-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiContext } from "@/context/ApiContext";
import type {
  EquipmentDetailResponse,
  EquipmentFromApi,
} from "@/lib/equipment-types";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function EquipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { GetAPI } = useApiContext();
  const [equipment, setEquipment] = useState<EquipmentFromApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("ID não informado.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await GetAPI(`/equipment/single/${id}`, true);
    if (res.status === 200 && res.body?.equipment) {
      const data = res.body as EquipmentDetailResponse;
      setEquipment(data.equipment);
    } else {
      setEquipment(null);
      const msg =
        typeof res.body?.message === "string"
          ? res.body.message
          : "Equipamento não encontrado.";
      setError(msg);
    }
    setLoading(false);
  }, [id, GetAPI]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <EquipmentHeader equipment={null} loading={false} />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EquipmentHeader equipment={equipment} loading={loading} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="structure">Estrutura & Serviços</TabsTrigger>
          <TabsTrigger value="parameters">Parâmetros de Fluidos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab equipment={equipment} />
        </TabsContent>

        <TabsContent value="structure">
          <StructureTab equipment={equipment} />
        </TabsContent>

        <TabsContent value="parameters">
          <ParametersTab equipment={equipment} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
