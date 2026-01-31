"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  criticalityMap,
  type CriticalityApi,
  type EquipmentFromApi,
} from "@/lib/equipment-types";
import { Eye, Loader2, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface EquipmentTableProps {
  equipments: EquipmentFromApi[];
  loading: boolean;
  error: string | null;
  search: string;
  criticalityFilter: string;
  sectorFilter: string;
}

function getCriticalityVariant(
  c: CriticalityApi | null
): "high" | "medium" | "low" {
  if (!c) return "low";
  return criticalityMap[c]?.variant ?? "low";
}

function getCriticalityLabel(c: CriticalityApi | null): string {
  if (!c) return "—";
  return criticalityMap[c]?.label ?? c;
}

export function EquipmentTable({
  equipments,
  loading,
  error,
  search,
  criticalityFilter,
  sectorFilter,
}: EquipmentTableProps) {
  const filtered = equipments.filter((eq) => {
    const matchSearch =
      !search ||
      eq.tag?.toLowerCase().includes(search.toLowerCase()) ||
      (eq.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (eq.model ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCriticality =
      !criticalityFilter || eq.criticality === criticalityFilter;
    const matchSector =
      !sectorFilter || eq.sector?.name === sectorFilter;
    return matchSearch && matchCriticality && matchSector;
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-slate-100 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-12 text-center">
        <p className="text-slate-500">
          {equipments.length === 0
            ? "Nenhum equipamento cadastrado."
            : "Nenhum equipamento corresponde aos filtros."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="w-20">Foto</TableHead>
            <TableHead>TAG / Nome</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Criticidade</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => {
            const photo = item.photos?.[0];
            return (
              <TableRow
                key={item.id}
                className="border-slate-100 hover:bg-slate-50/50"
              >
                <TableCell>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {photo?.url ? (
                      <Image
                        src={photo.fullUrl || photo.url}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-700">{item.tag}</p>
                    <p className="text-sm text-slate-500">
                      {item.name ?? "—"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {item.model ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {item.sector?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={getCriticalityVariant(item.criticality)}>
                    {getCriticalityLabel(item.criticality)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/equipamentos/${item.id}`}
                      className="group rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="group rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
