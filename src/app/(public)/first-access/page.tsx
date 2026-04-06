import FirstAccessForm from "@/components/auth/first-access-form";

export default function FirstAccessPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-foreground text-3xl font-bold tracking-tighter">
              Primeiro Acesso
            </h1>
            <p className="text-muted-foreground">
              Informe a senha temporária recebida e crie uma nova senha.
            </p>
          </div>
          <FirstAccessForm />
          <div className="text-muted-foreground text-center text-sm">
            <p>
              Já possui senha?{" "}
              <a
                href="/login"
                className="hover:text-primary underline transition-colors"
              >
                Fazer login
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="bg-primary/5 relative hidden flex-col items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="from-primary/20 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
        <div className="relative z-10 max-w-lg space-y-6 text-center">
          <div className="bg-primary mx-auto flex h-24 w-24 rotate-3 transform items-center justify-center rounded-xl shadow-lg">
            <span className="text-xl font-bold text-white">TechLub</span>
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
