"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", href: "/" },
  { icon: Wrench, label: "Equipamentos", href: "/equipamentos" },
  { icon: Package, label: "Materiais", href: "/materiais" },
  { icon: CalendarDays, label: "Planejamento", href: "/planejamento" },
  { icon: Users, label: "Pessoas", href: "/pessoas" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative z-20 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Header / Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        {!isCollapsed && (
          <span className="text-primary text-xl font-bold tracking-tight">
            Inova<span className="font-medium text-slate-700">ADM</span>
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-primary/10 hover:text-primary rounded-md p-2 text-slate-500 transition-colors"
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        <TooltipProvider>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.href}>
                {isCollapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center justify-center rounded-xl p-3 transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <item.icon className="h-6 w-6" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="border-0 bg-slate-900 text-white"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-md"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive
                          ? "text-primary-foreground"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer / User Profile (Minimized) */}
      <div className="border-t border-slate-100 p-4">
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <div className="bg-primary/20 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold">
            JD
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-900">
                João da Silva
              </p>
              <p className="truncate text-xs text-slate-500">
                Gerente de Manutenção
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
