"use client";

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { Input } from "@/components/ui/input";
import { BookOpen, FileVideo, FileText, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";

interface Tutorial {
  id: string;
  name: string;
  description: string | null;
  type: "video" | "file";
  videoUrl: string | null;
  fileUrl: string | null;
  createdAt: string;
}

export default function TutoriaisPage() {
  const { GetAPI, PostAPI } = useApiContext();
  const { effectiveCompanyId, isSuperAdmin, selectedCompanyId } = useCompany();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"video" | "file">("video");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  const fetchTutorials = useCallback(async () => {
    if (!effectiveCompanyId) {
      setLoading(false);
      setTutorials([]);
      return;
    }
    setLoading(true);
    const url = isSuperAdmin
      ? `/tutorial?companyId=${encodeURIComponent(effectiveCompanyId)}`
      : "/tutorial";
    const res = await GetAPI(url, true);
    if (res.status === 200 && res.body?.tutorials) {
      setTutorials(res.body.tutorials as Tutorial[]);
    } else {
      setTutorials([]);
      const msg =
        typeof res.body?.message === "string"
          ? res.body.message
          : "Falha ao carregar tutoriais.";
      toast.error(msg);
    }
    setLoading(false);
  }, [GetAPI, effectiveCompanyId, isSuperAdmin]);

  useEffect(() => {
    fetchTutorials();
  }, [fetchTutorials]);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormDescription("");
    setFormType("video");
    setFormVideoUrl("");
    setFormFile(null);
  }, []);

  const handleOpenModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    if (!effectiveCompanyId) {
      toast.error("Selecione uma empresa.");
      return;
    }
    if (formType === "video") {
      if (!formVideoUrl.trim()) {
        toast.error("URL do vídeo é obrigatória.");
        return;
      }
    } else {
      if (!formFile) {
        toast.error("Selecione um arquivo.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (formType === "file" && formFile) {
        const formData = new FormData();
        formData.append("file", formFile);
        const uploadRes = await PostAPI("/file", formData, true);
        if (uploadRes.status !== 200 || !uploadRes.body?.fullUrl) {
          toast.error(uploadRes.body?.message ?? "Falha no upload do arquivo.");
          setSubmitting(false);
          return;
        }
        fileUrl = uploadRes.body.fullUrl as string;
      }

      const body: Record<string, unknown> = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        type: formType,
      };
      if (isSuperAdmin) body.companyId = effectiveCompanyId;
      if (formType === "video") body.videoUrl = formVideoUrl.trim();
      else body.fileUrl = fileUrl;

      const res = await PostAPI("/tutorial", body, true);
      if (res.status === 200) {
        toast.success("Tutorial criado com sucesso.");
        setModalOpen(false);
        resetForm();
        fetchTutorials();
      } else {
        const msg =
          typeof res.body?.message === "string"
            ? res.body.message
            : Array.isArray(res.body?.message)
              ? res.body.message[0]
              : "Falha ao criar tutorial.";
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = effectiveCompanyId != null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tutoriais
          </h1>
          <p className="text-slate-500">
            Conteúdos da Universidade Inova (vídeos e arquivos) para os colaboradores
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && !selectedCompanyId && (
            <p className="text-sm text-slate-500">Selecione uma empresa</p>
          )}
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={!canCreate}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Novo tutorial
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : tutorials.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-2 text-slate-600">Nenhum tutorial cadastrado.</p>
          <p className="text-sm text-slate-500">
            Clique em &quot;Novo tutorial&quot; para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Nome</th>
                <th className="px-4 py-3 font-medium text-slate-700">Descrição</th>
                <th className="px-4 py-3 font-medium text-slate-700">Tipo</th>
                <th className="px-4 py-3 font-medium text-slate-700">Data</th>
              </tr>
            </thead>
            <tbody>
              {tutorials.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {t.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {t.type === "video" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        <FileVideo className="h-3.5 w-3.5" /> Vídeo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        <FileText className="h-3.5 w-3.5" /> Arquivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                Novo tutorial
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Instrução do equipamento X"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descrição opcional"
                  rows={2}
                  className="ring-offset-background focus-visible:ring-primary w-full rounded-md border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo *
                </label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      checked={formType === "video"}
                      onChange={() => setFormType("video")}
                      className="text-primary h-4 w-4 border-slate-300 focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700">Vídeo (URL)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      checked={formType === "file"}
                      onChange={() => setFormType("file")}
                      className="text-primary h-4 w-4 border-slate-300 focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700">Arquivo</span>
                  </label>
                </div>
              </div>
              {formType === "video" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    URL do vídeo *
                  </label>
                  <Input
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full"
                  />
                </div>
              )}
              {formType === "file" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Arquivo *
                  </label>
                  <Input
                    type="file"
                    onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                    className="w-full file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary"
                  />
                  {formFile && (
                    <p className="mt-1 text-xs text-slate-500">{formFile.name}</p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Criar tutorial
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
