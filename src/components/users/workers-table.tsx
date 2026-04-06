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
import { KeyRound, Loader2 } from "lucide-react";

export interface WorkerRow {
  id: string;
  name: string;
  cpf?: string | null;
  phone: string;
  city: string;
  mustChangePassword: boolean;
}

interface WorkersTableProps {
  workers: WorkerRow[];
  loading: boolean;
  error: string | null;
  search: string;
  onReissue: (worker: WorkerRow) => void;
}

export function WorkersTable({ workers, loading, error, search, onReissue }: WorkersTableProps) {
  const filtered = workers.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      (w.cpf ?? "").includes(q) ||
      w.phone.includes(q) ||
      w.city.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {workers.length === 0 ? "Nenhum colaborador cadastrado." : "Nenhum resultado para a busca."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((w) => (
            <TableRow key={w.id}>
              <TableCell className="font-medium">{w.name}</TableCell>
              <TableCell className="font-mono text-xs">{w.cpf ?? "—"}</TableCell>
              <TableCell>{w.phone}</TableCell>
              <TableCell>{w.city}</TableCell>
              <TableCell>
                {w.mustChangePassword ? (
                  <Badge variant="warning">Pendente</Badge>
                ) : (
                  <Badge variant="success">Ativo</Badge>
                )}
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onReissue(w)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="Reemitir senha temporária"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
