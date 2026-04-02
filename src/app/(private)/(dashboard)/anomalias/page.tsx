"use client";

import { AnomalyKPIs } from "@/components/anomalies/anomaly-kpis";
import { ServiceRequestDetailDialog } from "@/components/anomalies/service-request-detail-dialog";
import { ServiceRequestFilters } from "@/components/anomalies/service-request-filters";
import { ServiceRequestTable } from "@/components/anomalies/service-request-table";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type {
  ServiceRequestFromApi,
  ServiceRequestStats,
  ServiceRequestStatus,
} from "@/lib/service-request-types";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AnomaliasPage() {
  const { GetAPI, PutAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();

  const [serviceRequests, setServiceRequests] = useState<
    ServiceRequestFromApi[]
  >([]);
  const [stats, setStats] = useState<ServiceRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedItem, setSelectedItem] =
    useState<ServiceRequestFromApi | null>(null);

  const fetchData = useCallback(async () => {
    if (!effectiveCompanyId) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("companyId", effectiveCompanyId);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
    if (dateTo) params.set("to", new Date(dateTo + "T23:59:59").toISOString());

    const res = await GetAPI(`/service-request?${params.toString()}`, true);

    if (res.status === 200 && res.body?.serviceRequests) {
      setServiceRequests(res.body.serviceRequests);
    } else {
      const msg = res.body?.message ?? "Erro ao carregar solicitações";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  }, [GetAPI, effectiveCompanyId, statusFilter, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    if (!effectiveCompanyId) return;

    setStatsLoading(true);
    const res = await GetAPI(
      `/service-request/stats?companyId=${effectiveCompanyId}`,
      true,
    );
    if (res.status === 200) {
      setStats(res.body);
    }
    setStatsLoading(false);
  }, [GetAPI, effectiveCompanyId]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  const handleUpdateStatus = async (
    id: string,
    status: ServiceRequestStatus,
    resolution?: string,
  ) => {
    const res = await PutAPI(
      `/service-request/${id}`,
      { status, resolution: resolution ?? undefined },
      true,
    );

    if (res.status === 200) {
      toast.success("Solicitação atualizada");
      setSelectedItem(null);
      fetchData();
      fetchStats();
    } else {
      toast.error(res.body?.message ?? "Erro ao atualizar");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Solicitações de Serviço
              </h1>
              <p className="text-sm text-slate-500">
                Anomalias reportadas pelos técnicos e suas solicitações de
                serviço
              </p>
            </div>
          </div>
        </div>
        {!loading && (
          <span className="text-sm text-slate-500">
            {serviceRequests.length}{" "}
            {serviceRequests.length === 1
              ? "solicitação"
              : "solicitações"}
          </span>
        )}
      </div>

      {/* KPIs */}
      <AnomalyKPIs stats={stats} loading={statsLoading} />

      {/* Filters */}
      <ServiceRequestFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      {/* Table */}
      <ServiceRequestTable
        items={serviceRequests}
        loading={loading}
        error={error}
        search={search}
        onViewDetail={setSelectedItem}
      />

      {/* Detail panel */}
      <ServiceRequestDetailDialog
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
