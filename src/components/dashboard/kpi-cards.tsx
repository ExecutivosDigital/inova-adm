"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Factory } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: "primary" | "blue" | "green" | "red";
}

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  color,
}: KPICardProps) {
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
      {description && (
        <p className="text-xs text-slate-400">
          {trend && (
            <span
              className={cn(
                "mr-2 font-medium",
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                    ? "text-red-600"
                    : "text-slate-600",
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"} {trendValue}
            </span>
          )}
          {description}
        </p>
      )}
    </div>
  );
}

export function DashboardKPIs() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <KPICard
        title="Status da Planta"
        value="92% Operacional"
        description="4 Equipamentos em parada"
        icon={Factory}
        trend="down"
        trendValue="2%"
        color="primary"
      />
      <KPICard
        title="Aderência ao Plano"
        value="87%"
        description="12 Ordens atrasadas nesta semana"
        icon={CheckCircle2}
        trend="up"
        trendValue="5%"
        color="green"
      />
      <KPICard
        title="Anomalias Críticas"
        value="3"
        description="Ação imediata necessária"
        icon={AlertTriangle}
        color="red"
      />
    </div>
  );
}
