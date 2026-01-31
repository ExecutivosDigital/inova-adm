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
import React from "react";
import { usePathname } from "next/navigation";

function generateBreadcrumbs(pathname: string) {
  const paths = pathname.split("/").filter((x) => x);
  const breadcrumbs = paths.map((path, index) => {
    const href = `/${paths.slice(0, index + 1).join("/")}`;
    const label = path.charAt(0).toUpperCase() + path.slice(1);
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
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
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
