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

export interface AdminRow {
  id: string;
  name: string;
  email: string;
  companyId?: string | null;
  company?: { corporateName: string } | null;
  mustChangePassword: boolean;
}

interface AdminsTableProps {
  admins: AdminRow[];
  loading: boolean;
  error: string | null;
  search: string;
  isSuperAdmin: boolean;
  onReissue: (admin: AdminRow) => void;
}

export function AdminsTable({ admins, loading, error, search, isSuperAdmin, onReissue }: AdminsTableProps) {
  const filtered = admins.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.company?.corporateName ?? "").toLowerCase().includes(q)
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
        {admins.length === 0 ? "Nenhum administrador cadastrado." : "Nenhum resultado para a busca."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Status</TableHead>
            {isSuperAdmin && <TableHead className="w-[80px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell>{a.email}</TableCell>
              <TableCell>
                {a.companyId == null ? (
                  <Badge variant="secondary">Super Admin</Badge>
                ) : (
                  a.company?.corporateName ?? "—"
                )}
              </TableCell>
              <TableCell>
                {a.mustChangePassword ? (
                  <Badge variant="warning">Pendente</Badge>
                ) : (
                  <Badge variant="success">Ativo</Badge>
                )}
              </TableCell>
              {isSuperAdmin && (
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onReissue(a)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Reemitir senha temporária"
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
