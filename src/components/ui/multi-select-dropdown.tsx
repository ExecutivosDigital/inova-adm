"use client";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import * as React from "react";

export interface MultiSelectDropdownItem {
  id: string;
  name: string;
}

interface MultiSelectDropdownProps {
  /** Rótulo exibido no trigger (ex.: "Período") */
  label: string;
  /** Lista de opções */
  items: MultiSelectDropdownItem[];
  /** IDs atualmente selecionados */
  selectedIds: string[];
  /** Callback ao marcar/desmarcar: (id, checked) */
  onToggle: (id: string, checked: boolean) => void;
  /** Placeholder do input de busca */
  searchPlaceholder?: string;
  /** Classe no trigger/container */
  className?: string;
  /** Largura do conteúdo (ex.: "var(--radix-popover-trigger-width)" ou "16rem") */
  contentWidth?: string;
  /** Altura máxima da lista (ex.: "12rem") */
  listMaxHeight?: string;
}

export function MultiSelectDropdown({
  label,
  items,
  selectedIds,
  onToggle,
  searchPlaceholder = "Buscar...",
  className,
  contentWidth,
  listMaxHeight = "12rem",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const selectedCount = selectedIds.length;
  const triggerLabel =
    selectedCount > 0 ? `${label} (${selectedCount})` : `${label} — Todos`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "ring-offset-background focus:ring-primary flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-offset-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            className,
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={4}
        style={contentWidth ? { width: contentWidth } : undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3"
              autoComplete="off"
            />
          </div>
        </div>
        <div
          className="border-t border-slate-100"
          style={{ height: listMaxHeight, minHeight: "8rem" }}
        >
          <ScrollArea className="h-full">
            <div className="p-2">
            {filteredItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                Nenhum resultado
              </p>
            ) : (
              <ul
                role="listbox"
                className="space-y-0.5"
                aria-multiselectable="true"
              >
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <li key={item.id} role="option" aria-selected={isSelected}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50",
                          isSelected && "bg-primary/5 text-primary",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onToggle(item.id, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="truncate text-slate-700">
                          {item.name}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
