"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  companyId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Company {
  id: string;
  corporateName: string;
}

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  companies: Company[];
}

export function CreateAdminDialog({ open, onOpenChange, onSubmit, isSubmitting, companies }: CreateAdminDialogProps) {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", companyId: "" },
  });

  async function handle(data: FormData) {
    await onSubmit(data);
    reset();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-slate-900">Novo Administrador</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(handle)} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <input
                    type="text"
                    placeholder="Nome do administrador"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    disabled={isSubmitting}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-primary flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
                  />
                )}
              />
              {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">E-mail</label>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <input
                    type="email"
                    placeholder="email@empresa.com"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    disabled={isSubmitting}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-primary flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
                  />
                )}
              />
              {errors.email && <p className="mt-0.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {companies.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Empresa (opcional)</label>
                <Controller
                  control={control}
                  name="companyId"
                  render={({ field: { value, onChange } }) => (
                    <Select value={value ?? ""} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Super Admin (sem empresa)" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.corporateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
