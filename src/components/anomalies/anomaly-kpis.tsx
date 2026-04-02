"use client";

import { cn } from "@/lib/utils";
import type { ServiceRequestStats } from "@/lib/service-request-types";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

interface AnomalyKPIsProps {
  stats: ServiceRequestStats | null;
  loading: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  color: "primary" | "blue" | "green" | "red";
}

function KPICard({ title, value, description, icon: Icon, color }: KPICardProps) {
  const colorMap = {
    primary: "text-primary bg-primary/10 ring-1 ring-primary/20",
    blue: "text-blue-600 bg-blue-50 ring-1 ring-blue-100",
    green: "text-green-600 bg-green-50 ring-1 ring-green-100",
    red: "text-red-600 bg-red-50 ring-1 ring-red-100",
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={cn("rounded-xl p-3", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description && <p className="text-xs text-slate-400">{description}</p>}
    </div>
  );
}

export function AnomalyKPIs({ stats, loading }: AnomalyKPIsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-xl border border-slate-100 bg-slate-50"
          />
        ))}
      </div>
    );
  }

  const topReason =
    stats.topReasons.length > 0 ? stats.topReasons[0].reason : "—";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total do Mês"
        value={String(stats.totalThisMonth)}
        description="Solicitações criadas neste mês"
        icon={AlertTriangle}
        color="primary"
      />
      <KPICard
        title="Pendentes"
        value={String(stats.pending)}
        description="Aguardando ação"
        icon={Clock}
        color="red"
      />
      <KPICard
        title="Concluídas no Mês"
        value={String(stats.completedThisMonth)}
        description="Resolvidas neste mês"
        icon={CheckCircle2}
        color="green"
      />
      <KPICard
        title="Principal Motivo"
        value={topReason}
        description={
          stats.topReasons.length > 0
            ? `${stats.topReasons[0].count} ocorrências`
            : "Sem dados"
        }
        icon={TrendingUp}
        color="blue"
      />
    </div>
  );
}
