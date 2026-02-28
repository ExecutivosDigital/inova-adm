"use client";

import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type {
  TeamFromApi,
  TeamListResponse,
  WorkerFromApi,
  WorkerListResponse,
} from "@/lib/equipes-types";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function EquipesPage() {
  const { GetAPI, PutAPI } = useApiContext();
  const { isSuperAdmin, selectedCompanyId, effectiveCompanyId } = useCompany();
  const [teams, setTeams] = useState<TeamFromApi[]>([]);
  const [workers, setWorkers] = useState<WorkerFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Por teamId: lista de workerIds selecionados (controlado localmente até salvar) */
  const [teamWorkerIds, setTeamWorkerIds] = useState<Record<string, string[]>>({});
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTeams = useCallback(async () => {
    const res = await GetAPI("/team", true);
    if (res.status === 200 && (res.body as TeamListResponse)?.teams) {
      const data = res.body as TeamListResponse;
      setTeams(data.teams ?? []);
      setTeamWorkerIds((prev) => {
        const next = { ...prev };
        (data.teams ?? []).forEach((t) => {
          next[t.id] = t.workerIds ?? [];
        });
        return next;
      });
    } else {
      setTeams([]);
    }
  }, [GetAPI]);

  const fetchWorkers = useCallback(async () => {
    if (!effectiveCompanyId) {
      setWorkers([]);
      return;
    }
    const url = `/workers?companyId=${encodeURIComponent(effectiveCompanyId)}`;
    const res = await GetAPI(url, true);
    if (res.status === 200 && (res.body as WorkerListResponse)?.workers) {
      const data = res.body as WorkerListResponse;
      setWorkers(data.workers ?? []);
    } else {
      setWorkers([]);
    }
  }, [GetAPI, effectiveCompanyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchTeams(), fetchWorkers()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
      setTeams([]);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [fetchTeams, fetchWorkers]);

  useEffect(() => {
    if (isSuperAdmin && !selectedCompanyId) {
      setLoading(false);
      setTeams([]);
      setWorkers([]);
      setTeamWorkerIds({});
      setError(null);
      return;
    }
    load();
  }, [load, isSuperAdmin, selectedCompanyId]);

  const workerItems = useMemo(
    () => workers.map((w) => ({ id: w.id, name: w.name })),
    [workers]
  );

  const handleToggleWorker = useCallback((teamId: string, workerId: string, checked: boolean) => {
    setTeamWorkerIds((prev) => {
      const current = prev[teamId] ?? [];
      const next = checked
        ? [...current, workerId]
        : current.filter((id) => id !== workerId);
      return { ...prev, [teamId]: next };
    });
  }, []);

  const handleSaveTeamWorkers = useCallback(
    async (teamId: string) => {
      const workerIds = teamWorkerIds[teamId] ?? [];
      setSavingTeamId(teamId);
      setToast(null);
      try {
        const res = await PutAPI(`/team/single/${teamId}/workers`, { workerIds }, true);
        if (res.status === 200) {
          setToast({ type: "success", text: "Vínculos salvos com sucesso." });
          await fetchTeams();
        } else {
          const msg = (res.body as { message?: string })?.message ?? "Erro ao salvar.";
          setToast({ type: "error", text: msg });
        }
      } catch (e) {
        setToast({
          type: "error",
          text: e instanceof Error ? e.message : "Erro ao salvar vínculos.",
        });
      } finally {
        setSavingTeamId(null);
      }
    },
    [PutAPI, teamWorkerIds, fetchTeams]
  );

  const needsCompany = isSuperAdmin && !selectedCompanyId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Equipes
        </h1>
        <p className="text-slate-500">
          Vincule trabalhadores às equipes. No app, trabalhadores com equipe veem apenas as ordens do seu time; sem vínculo veem todas.
        </p>
      </div>

      {needsCompany && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header para gerenciar vínculos de equipes.
          </p>
        </div>
      )}

      {!needsCompany && (
        <>
          {toast && (
            <div
              className={
                toast.type === "success"
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800"
                  : "rounded-lg border border-red-200 bg-red-50 p-3 text-red-800"
              }
            >
              {toast.text}
            </div>
          )}

          {loading && teams.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-slate-100 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {teams.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-600">
                  Nenhuma equipe cadastrada. Crie equipes no app para vinculá-las aos trabalhadores aqui.
                </p>
              ) : (
                <ul className="space-y-4">
                  {teams.map((team) => {
                    const selectedIds = teamWorkerIds[team.id] ?? [];
                    const isSaving = savingTeamId === team.id;
                    return (
                      <li
                        key={team.id}
                        className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:gap-6"
                      >
                        <div className="min-w-0 flex-1">
                          <h2 className="mb-2 font-semibold text-slate-900">
                            {team.name}
                          </h2>
                          <MultiSelectDropdown
                            label="Trabalhadores nesta equipe"
                            items={workerItems}
                            selectedIds={selectedIds}
                            onToggle={(workerId, checked) =>
                              handleToggleWorker(team.id, workerId, checked)
                            }
                            searchPlaceholder="Buscar trabalhador..."
                            contentWidth="20rem"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveTeamWorkers(team.id)}
                          className="h-10 shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Salvando...
                            </span>
                          ) : (
                            "Salvar vínculos"
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {workers.length === 0 && !loading && (
                <p className="text-sm text-slate-500">
                  Nenhum trabalhador encontrado para a empresa selecionada. Cadastre trabalhadores no app.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
