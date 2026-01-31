"use client";

import type { CipService, Route } from "@/lib/route-types";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface RouteFormModalProps {
  open: boolean;
  onClose: () => void;
  route: Route | null;
  effectiveCompanyId: string;
  isSuperAdmin: boolean;
  onSuccess: () => void;
  initialSelectedServiceIds?: string[];
  initialCipServices?: CipService[];
  fetchRouteCipServices: () => Promise<void>;
  createRoutePayload: { companyId: string };
  postApi: (url: string, data: unknown, auth: boolean) => Promise<{ status: number; body: unknown }>;
  putApi: (url: string, data: unknown, auth: boolean) => Promise<{ status: number; body: unknown }>;
}

export function RouteFormModal({
  open,
  onClose,
  route,
  effectiveCompanyId,
  isSuperAdmin,
  onSuccess,
  initialSelectedServiceIds,
  initialCipServices,
  fetchRouteCipServices,
  createRoutePayload,
  postApi,
  putApi,
}: RouteFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [finishedAt, setFinishedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!route;

  useEffect(() => {
    if (open && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (route) {
      setName(route.name);
      setDescription(route.description ?? "");
      setStatus(route.status);
      setFinishedAt(route.finishedAt ?? "");
    } else {
      setName("");
      setDescription("");
      setStatus("pending");
      setFinishedAt("");
    }
  }, [open, route]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
        setError("Nome é obrigatório.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (isEditMode && route) {
          const res = await putApi(`/route/single/${route.id}`, {
            name: name.trim(),
            description: description.trim() || undefined,
            status,
            finishedAt: finishedAt || undefined,
          }, true);
          if (res.status === 200) {
            onSuccess();
            onClose();
          } else {
            setError((res.body as { message?: string })?.message ?? "Erro ao salvar.");
          }
        } else {
          const body: { name: string; description?: string; status: string; companyId?: string } = {
            name: name.trim(),
            description: description.trim() || undefined,
            status: "pending",
          };
          if (isSuperAdmin) body.companyId = createRoutePayload.companyId;
          const res = await postApi("/route/single", body, true);
          if (res.status === 200 || res.status === 201) {
            const created = res.body as { route?: { id: string } };
            const routeId = created?.route?.id;
            if (routeId && initialSelectedServiceIds?.length) {
              await postApi(`/route/single/${routeId}/services`, {
                cipServiceIds: initialSelectedServiceIds,
              }, true);
              await fetchRouteCipServices();
            }
            onSuccess();
            onClose();
          } else {
            setError((res.body as { message?: string })?.message ?? "Erro ao criar rota.");
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [
      name,
      description,
      status,
      finishedAt,
      isEditMode,
      route,
      isSuperAdmin,
      createRoutePayload.companyId,
      initialSelectedServiceIds,
      onSuccess,
      onClose,
      putApi,
      postApi,
      fetchRouteCipServices,
    ]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditMode ? "Editar rota" : "Nova rota"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="Ex.: Rota Preventiva Mensal"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="Opcional"
            />
          </div>

          {isEditMode && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em andamento</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
                <option value="archived">Arquivada</option>
              </select>
            </div>
          )}

          {isEditMode && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data de finalização</label>
              <input
                type="datetime-local"
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          )}

          {!isEditMode && initialSelectedServiceIds?.length ? (
            <p className="text-sm text-slate-500">
              {initialSelectedServiceIds.length} serviço(s) serão vinculados à nova rota.
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditMode ? "Salvar" : "Criar rota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
