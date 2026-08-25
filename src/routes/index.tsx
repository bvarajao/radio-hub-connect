import { createFileRoute, Link } from "@tanstack/react-router";
import { RadioTower, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Acesse o sistema Papo de Produtor e controle locações, estoque e financeiro dos seus rádios comunicadores.",
      },
      { property: "og:title", content: "Papo de Produtor | Gestão de Rádios" },
      {
        property: "og:description",
        content: "Sistema de gestão de locação de rádios comunicadores para produção de eventos.",
      },
    ],
  }),
  component: LoginPage,
});

const highlights = [
  { icon: Zap, title: "Locação em 1 clique", text: "Do dashboard direto para a nova locação." },
  { icon: RadioTower, title: "Controle por patrimônio", text: "Cada rádio rastreado como RAD-001." },
  { icon: ShieldCheck, title: "Conferência de devolução", text: "Checklist rápido pelo celular." },
];

function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="gradient-night relative hidden flex-col justify-between p-10 lg:flex">
        <Logo tone="light" />
        <div className="max-w-md space-y-6">
          <h1 className="font-display text-4xl leading-tight font-extrabold text-sidebar-foreground">
            A operação dos seus rádios sob controle total.
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-foreground/65">
            Estoque, locações, devoluções e financeiro em um único painel feito para o ritmo da
            produção de eventos.
          </p>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-accent">
                  <Icon className="h-4.5 w-4.5 text-sidebar-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-sidebar-foreground">
                    {title}
                  </span>
                  <span className="block text-xs text-sidebar-foreground/60">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/40">
          © 2026 Papo de Produtor · Produção & Comunicação
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-2xl font-extrabold">Bem-vindo de volta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre com seu acesso para gerenciar as locações.
          </p>

          <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@papodeprodutor.com"
                defaultValue="operacao@papodeprodutor.com"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                defaultValue="demo1234"
                className="h-11"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox defaultChecked /> Lembrar acesso
              </label>
              <button type="button" className="text-sm font-medium text-primary hover:underline">
                Esqueci a senha
              </button>
            </div>
            <Button asChild variant="hero" size="xl" className="w-full">
              <Link to="/dashboard">Entrar</Link>
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protótipo de demonstração — dados fictícios.
          </p>
        </div>
      </div>
    </div>
  );
}
