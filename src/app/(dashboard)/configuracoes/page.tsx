import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Database,
  Globe,
  Lock,
  Mail,
  Palette,
  Save,
  Shield,
  Users,
} from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configurações
        </h1>
        <p className="text-slate-500">
          Configurações do sistema e preferências
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* General Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* System Info */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Database className="text-primary h-5 w-5" />
              <h3 className="text-lg font-semibold text-slate-900">
                Informações do Sistema
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Versão
                  </label>
                  <p className="mt-1 font-medium text-slate-900">v2.1.0</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Ambiente
                  </label>
                  <Badge variant="success" className="mt-1">
                    Produção
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Última Atualização
                  </label>
                  <p className="mt-1 text-sm text-slate-900">15/01/2025</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Uptime
                  </label>
                  <p className="mt-1 text-sm text-slate-900">99.8%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Settings */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="text-primary h-5 w-5" />
              <h3 className="text-lg font-semibold text-slate-900">
                Dados da Empresa
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome da Empresa
                </label>
                <Input defaultValue="Inova Manutenção Industrial" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    CNPJ
                  </label>
                  <Input defaultValue="12.345.678/0001-90" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Planta Principal
                  </label>
                  <Select defaultValue="matriz">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matriz">Matriz (SP)</SelectItem>
                      <SelectItem value="filial1">Filial - Campinas</SelectItem>
                      <SelectItem value="filial2">Filial - Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="text-primary h-5 w-5" />
              <h3 className="text-lg font-semibold text-slate-900">
                Notificações
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Ordens Atrasadas</p>
                  <p className="text-sm text-slate-500">
                    Alertas de ordens de serviço atrasadas
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="font-medium text-slate-900">Estoque Baixo</p>
                  <p className="text-sm text-slate-500">
                    Alertas de materiais abaixo do mínimo
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="font-medium text-slate-900">
                    Anomalias Críticas
                  </p>
                  <p className="text-sm text-slate-500">
                    Alertas de equipamentos com anomalias críticas
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="text-primary h-5 w-5" />
              <h3 className="text-lg font-semibold text-slate-900">
                Servidor de Email
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Servidor SMTP
                  </label>
                  <Input defaultValue="smtp.inova.com" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Porta
                  </label>
                  <Input defaultValue="587" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email de Envio
                </label>
                <Input defaultValue="noreply@inova.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="text-primary h-5 w-5" />
              <h3 className="text-lg font-semibold text-slate-900">Tema</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cor Primária
                </label>
                <div className="flex items-center gap-2">
                  <div className="bg-primary ring-primary/30 h-10 w-10 rounded-lg ring-2"></div>
                  <Input defaultValue="#ed6842" disabled />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Modo
                </label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="text-primary h-5 w-5" />
              <h3 className="text-lg font-semibold text-slate-900">
                Segurança
              </h3>
            </div>

            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Alterar Senha
                  </span>
                </div>
              </button>

              <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Permissões
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white shadow-sm transition-colors">
            <Save className="h-5 w-5" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
