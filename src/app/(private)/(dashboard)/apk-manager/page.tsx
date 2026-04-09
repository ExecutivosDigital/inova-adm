"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import axios from "axios";
import {
  CheckCircle,
  Loader2,
  ShieldAlert,
  Smartphone,
  Upload,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApkInfo {
  appId: string;
  fileName: string;
  url: string;
  updatedAt: string;
}

const APPS = [
  {
    appId: "inova-app",
    label: "App de Cadastros",
    description:
      "Cadastro de empresas, equipamentos, materiais, colaboradores e configuração de rotas e planejamento.",
    icon: Wrench,
  },
  {
    appId: "inova-worker-app",
    label: "App do Colaborador",
    description:
      "Execução de ordens de serviço, rotas de manutenção e registro de ocorrências em campo.",
    icon: Smartphone,
  },
];

export default function ApkManagerPage() {
  const { isSuperAdmin } = useCompany();
  const { token } = useAuth();
  const { GetAPI } = useApiContext();
  const [apks, setApks] = useState<ApkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchApks = useCallback(async () => {
    const res = await GetAPI("/apk", true);
    if (res.status === 200) {
      setApks(res.body);
    }
    setLoading(false);
  }, [GetAPI]);

  useEffect(() => {
    if (isSuperAdmin) fetchApks();
  }, [isSuperAdmin, fetchApks]);

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <ShieldAlert className="h-12 w-12" />
        <p className="text-lg font-medium">
          Acesso restrito a super administradores.
        </p>
      </div>
    );
  }

  async function handleUpload(appId: string) {
    const fileInput = fileRefs.current[appId];
    const file = fileInput?.files?.[0];
    if (!file) {
      toast.error("Selecione um arquivo .apk");
      return;
    }

    if (!file.name.endsWith(".apk")) {
      toast.error("Apenas arquivos .apk são permitidos.");
      return;
    }

    setUploading(appId);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_URL}/apk/${appId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000,
      });

      toast.success("APK enviado com sucesso!");
      if (fileInput) fileInput.value = "";
      await fetchApks();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Erro ao enviar APK.";
      toast.error(message);
    } finally {
      setUploading(null);
    }
  }

  function getApkInfo(appId: string): ApkInfo | undefined {
    return apks.find((a) => a.appId === appId);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gerenciamento de APKs
        </h1>
        <p className="text-slate-500">
          Faça upload das novas versões dos aplicativos Android.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {APPS.map((app) => {
          const info = getApkInfo(app.appId);
          const Icon = app.icon;
          const isUploading = uploading === app.appId;

          return (
            <div
              key={app.appId}
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Icon className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {app.label}
                  </h3>
                  <p className="text-sm text-slate-500">{app.description}</p>
                </div>
              </div>

              <div className="mb-4 rounded-md border border-slate-100 bg-slate-50 p-3">
                {info ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">
                        {info.fileName}
                      </span>
                      <span className="ml-2 text-slate-400">
                        atualizado em {formatDate(info.updatedAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Nenhum APK enviado ainda.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={(el) => {
                    fileRefs.current[app.appId] = el;
                  }}
                  type="file"
                  accept=".apk"
                  className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  disabled={isUploading}
                />
                <button
                  onClick={() => handleUpload(app.appId)}
                  disabled={isUploading}
                  className="bg-primary hover:bg-primary/90 flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Enviar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
