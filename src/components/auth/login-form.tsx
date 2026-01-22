"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

interface LoginDataProps {
  email: string;
  password: string;
}

const schema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .trim()
    .toLowerCase()
    .email({ message: "E-mail inválido" }),
  password: z
    .string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type SignInSuccess = { accessToken: string };

// Simple Button Component since we don't have the full UI library yet
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, disabled, children, ...props }, ref) => {
  return (
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
  );
});
Button.displayName = "Button";

// Simple Input Component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:ring-primary flex h-11 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export default function LoginForm() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const { signIn } = useAuth();
  const { PostAPI } = useApiContext();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginDataProps>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginDataProps) {
    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        email: data.email,
        password: data.password,
      };

      const response = await PostAPI("/admin/signin", payload, false);

      if (response.status === 200) {
        const body: SignInSuccess = response.body;
        const accessToken = body?.accessToken;

        if (!accessToken) {
          setError("Resposta inválida do servidor");
          return;
        }

        await signIn(accessToken);
        reset();
        router.push("/");
      } else {
        setError(
          response.body?.message || "Erro ao fazer login. Verifique suas credenciais.",
        );
      }
    } catch (error) {
      console.error("🔴 Erro inesperado:", error);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="email"
            >
              Email
            </label>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  id="email"
                  placeholder="nome@empresa.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
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
            <label
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="password"
            >
              Senha
            </label>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  disabled={isLoading}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <Button disabled={isLoading || !isValid}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </div>
      </form>
    </div>
  );
}
