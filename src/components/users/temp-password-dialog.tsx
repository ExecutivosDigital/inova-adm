"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface TempPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  tempPassword: string;
}

export function TempPasswordDialog({
  open,
  onOpenChange,
  userName,
  tempPassword,
}: TempPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            Senha Temporária
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500">
            Anote a senha abaixo. Ela não será exibida novamente.
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div className="text-sm text-slate-600">
              <span className="font-medium">Usuário:</span> {userName}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <code className="flex-1 text-lg font-mono font-semibold text-slate-900 tracking-wider">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                title="Copiar"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Entendi
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
