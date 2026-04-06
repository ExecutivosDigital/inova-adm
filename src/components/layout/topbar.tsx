"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/context/CompanyContext";
import { Building2, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

/** Mapa de slugs de rota → label amigável para o breadcrumb */
const ROUTE_LABELS: Record<string, string> = {
  equipamentos: "Equipamentos",
  planejamento: "Planejamento",
  programacao: "Programação",
  configuracoes: "Configurações",
  materiais: "Materiais",
  "ordens-servico": "Ordens de Serviço",
  usuarios: "Usuários",
};

/** Detecta se o segmento é um UUID (v4) */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateBreadcrumbs(pathname: string) {
  const paths = pathname.split("/").filter((x) => x);
  const breadcrumbs = paths.map((path, index) => {
    const href = `/${paths.slice(0, index + 1).join("/")}`;
    let label: string;

    if (ROUTE_LABELS[path]) {
      label = ROUTE_LABELS[path];
    } else if (UUID_RE.test(path)) {
      // UUIDs serão substituídos depois pelo componente (via prop ou contexto)
      label = "Detalhes";
    } else {
      label = path.charAt(0).toUpperCase() + path.slice(1);
    }

    return { href, label };
  });

  return [{ href: "/", label: "Home" }, ...breadcrumbs];
}

export function TopBar() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const {
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    isSuperAdmin,
    loading: companiesLoading,
  } = useCompany();

  return (
    <header className="absolute top-0 left-0 flex h-16 w-full bg-white items-center justify-between border-b border-slate-200 px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="font-semibold text-slate-800">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={crumb.href}
                      className="hover:text-primary text-slate-500"
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Company dropdown (Super Admin only) */}
      {isSuperAdmin && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          {companiesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <Select
              value={selectedCompanyId ?? ""}
              onValueChange={(value) => setSelectedCompanyId(value || null)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.corporateName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </header>
  );
}
