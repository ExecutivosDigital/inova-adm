"use client";

import type { CipService, Route } from "@/lib/route-types";
import { getRoutePeriodMismatchWarning } from "@/components/planning-routes/periodWarning";
import { useFilterCatalogs } from "@/hooks/useFilterCatalogs";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

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
  const [routePeriodId, setRoutePeriodId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { catalogs } = useFilterCatalogs();

  const isEditMode = !!route;

  const periodWarning = useMemo(() => {
    if (!routePeriodId || !initialSelectedServiceIds?.length || !initialCipServices?.length) {
      return { shouldWarn: false as const };
    }
    return getRoutePeriodMismatchWarning(
      routePeriodId,
      initialCipServices,
      initialSelectedServiceIds
    );
  }, [routePeriodId, initialSelectedServiceIds, initialCipServices]);

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
      setRoutePeriodId(route.routePeriodId ?? "");
    } else {
      setName("");
      setDescription("");
      setRoutePeriodId("");
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
            routePeriodId: routePeriodId || undefined,
          }, true);
          if (res.status === 200) {
            onSuccess();
            onClose();
            toast.success("Rota atualizada com sucesso.");
          } else {
            const msg = (res.body as { message?: string })?.message ?? "Erro ao salvar.";
            setError(msg);
            toast.error(msg);
          }
        } else {
          if (!routePeriodId?.trim()) {
            setError("Selecione o período da rota.");
            setLoading(false);
            return;
          }
          const body: { name: string; description?: string; routePeriodId: string; companyId?: string } = {
            name: name.trim(),
            description: description.trim() || undefined,
            routePeriodId: routePeriodId.trim(),
          };
          if (isSuperAdmin) body.companyId = createRoutePayload.companyId;
          const res = await postApi("/route/single", body, true);
          if (res.status === 200 || res.status === 201) {
            const created = res.body as { route?: { id: string } };
            const routeId = created?.route?.id;
            if (routeId && initialSelectedServiceIds?.length) {
              const addRes = await postApi(`/route/single/${routeId}/services`, {
                cipServiceIds: initialSelectedServiceIds,
              }, true);
              if (addRes.status !== 200 && addRes.status !== 201) {
                toast.error((addRes.body as { message?: string })?.message ?? "Erro ao vincular serviços.");
              }
              await fetchRouteCipServices();
            }
            onSuccess();
            onClose();
            toast.success("Rota criada com sucesso.");
          } else {
            const msg = (res.body as { message?: string })?.message ?? "Erro ao criar rota.";
            setError(msg);
            toast.error(msg);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [
      name,
      description,
      routePeriodId,
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Período da rota {!isEditMode && "*"}
            </label>
            <select
              value={routePeriodId}
              onChange={(e) => setRoutePeriodId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              required={!isEditMode}
            >
              <option value="">Selecione o período</option>
              {catalogs.periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.days != null ? ` (${p.days} dia${p.days !== 1 ? "s" : ""})` : ""}
                </option>
              ))}
            </select>
          </div>

          {!isEditMode && initialSelectedServiceIds?.length && routePeriodId ? (
            <>
              {periodWarning.shouldWarn && periodWarning.message ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {periodWarning.message}
                </div>
              ) : null}
              <p className="text-sm text-slate-500">
                {initialSelectedServiceIds.length} serviço(s) serão vinculados à nova rota.
              </p>
            </>
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
              disabled={loading || !name.trim() || (!isEditMode && !routePeriodId?.trim())}
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
