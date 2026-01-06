"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

// Helper to generate breadcrumbs from path
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

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center">
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

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="group relative hidden md:block">
          <Search className="group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por TAG ou SKU..."
            className="focus:border-primary/50 focus:ring-primary/10 w-64 rounded-full border border-transparent bg-slate-50 py-2 pr-4 pl-10 text-sm transition-all outline-none focus:bg-white focus:ring-4"
          />
        </div>

        {/* Notifications */}
        <button className="hover:text-primary relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
        </button>
      </div>
    </header>
  );
}
