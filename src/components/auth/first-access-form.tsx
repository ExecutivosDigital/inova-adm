"use client";

import { useApiContext } from "@/context/ApiContext";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const schema = z
  .object({
    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .trim()
      .toLowerCase()
      .email({ message: "E-mail inválido" }),
    tempPassword: z.string().min(1, "Senha temporária é obrigatória"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmNewPassword: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  });

type FirstAccessData = z.infer<typeof schema>;

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, disabled, children, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled}
    className={cn(
      "focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 w-full items-center justify-center rounded-md px-8 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
Button.displayName = "Button";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "border-input placeholder:text-muted-foreground focus-visible:ring-primary flex h-11 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export default function FirstAccessForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { PostAPI } = useApiContext();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FirstAccessData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", tempPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  async function onSubmit(data: FirstAccessData) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await PostAPI("/admin/first-access", data, false);

      if (response.status === 200) {
        toast.success("Senha criada com sucesso! Faça login.");
        router.push("/login");
      } else {
        const msg = (response.body as { message?: string })?.message || "Erro ao definir senha.";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="fa-email">E-mail</label>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  id="fa-email"
                  type="email"
                  placeholder="nome@empresa.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  disabled={isLoading}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="fa-temp">Senha Temporária</label>
            <Controller
              control={control}
              name="tempPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  id="fa-temp"
                  type="password"
                  placeholder="Senha recebida do administrador"
                  disabled={isLoading}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.tempPassword && (
              <p className="text-sm text-red-500">{errors.tempPassword.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="fa-new">Nova Senha</label>
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  id="fa-new"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="fa-confirm">Confirmar Nova Senha</label>
            <Controller
              control={control}
              name="confirmNewPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  id="fa-confirm"
                  type="password"
                  placeholder="Repita a nova senha"
                  disabled={isLoading}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.confirmNewPassword && (
              <p className="text-sm text-red-500">{errors.confirmNewPassword.message}</p>
            )}
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button disabled={isLoading || !isValid}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Definir Senha
          </Button>
        </div>
      </form>
    </div>
  );
}
