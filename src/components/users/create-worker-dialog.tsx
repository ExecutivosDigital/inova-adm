"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  rg: z.string().min(1, "RG é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "UF inválido").max(2),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  extension: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

const fields: { name: keyof FormData; label: string; placeholder: string; half?: boolean }[] = [
  { name: "name", label: "Nome Completo", placeholder: "Nome do colaborador" },
  { name: "phone", label: "Telefone", placeholder: "(00) 00000-0000", half: true },
  { name: "cpf", label: "CPF", placeholder: "000.000.000-00", half: true },
  { name: "rg", label: "RG", placeholder: "RG", half: true },
  { name: "address", label: "Endereço", placeholder: "Rua, número" },
  { name: "neighborhood", label: "Bairro", placeholder: "Bairro", half: true },
  { name: "city", label: "Cidade", placeholder: "Cidade", half: true },
  { name: "state", label: "UF", placeholder: "SP", half: true },
  { name: "zipCode", label: "CEP", placeholder: "00000-000", half: true },
  { name: "extension", label: "Ramal (opcional)", placeholder: "Ramal", half: true },
];

export function CreateWorkerDialog({ open, onOpenChange, onSubmit, isSubmitting }: CreateWorkerDialogProps) {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", cpf: "", rg: "", address: "", neighborhood: "", city: "", state: "", zipCode: "", extension: "" },
  });

  async function handle(data: FormData) {
    await onSubmit(data);
    reset();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-slate-900">Novo Colaborador</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(handle)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.name} className={cn(f.half ? "col-span-1" : "col-span-2")}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        onBlur={onBlur}
                        disabled={isSubmitting}
                        className="border-input placeholder:text-muted-foreground focus-visible:ring-primary flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
                      />
                    )}
                  />
                  {errors[f.name] && <p className="mt-0.5 text-xs text-red-500">{errors[f.name]?.message}</p>}
                </div>
              ))}
            </div>

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
