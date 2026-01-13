import LoginForm from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Inova ADM",
  description: "Acesse sua conta",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-foreground text-3xl font-bold tracking-tighter">
              Bem-vindo de volta
            </h1>
            <p className="text-muted-foreground">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>
          <LoginForm />
          <div className="text-muted-foreground text-center text-sm">
            <p>
              Esqueceu sua senha?{" "}
              <a
                href="#"
                className="hover:text-primary underline transition-colors"
              >
                Recuperar acesso
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="bg-primary/5 relative hidden flex-col items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="from-primary/20 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
        <div className="relative z-10 max-w-lg space-y-6 text-center">
          {/* Placeholder for Logo or Illustration */}
          <div className="bg-primary mx-auto flex h-24 w-24 rotate-3 transform items-center justify-center rounded-xl shadow-lg">
            <span className="text-3xl font-bold text-white">Inova</span>
          </div>
          <h2 className="text-foreground text-4xl font-bold">
            Gestão Inteligente para sua Indústria
          </h2>
          <p className="text-muted-foreground text-lg">
            Monitore, planeje e execute manutenções com eficiência e precisão.
          </p>
        </div>
      </div>
    </div>
  );
}
