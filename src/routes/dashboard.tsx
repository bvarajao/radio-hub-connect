import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Plus,
  RadioTower,
  Wallet,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { PaymentBadge, RentalStatusBadge, Badge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { brl, dashboardMetrics as m, rentals } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Indicadores de estoque, locações ativas, devoluções próximas e resumo financeiro das locações de rádios.",
      },
      { property: "og:title", content: "Dashboard — Papo de Produtor" },
      {
        property: "og:description",
        content: "Visão geral do estoque de rádios, locações e faturamento do mês.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const ocupacao = Math.round(((m.locados + m.reservados) / m.total) * 100);
  const ativas = rentals.filter((r) => r.status === "ativa" || r.status === "atrasada");
  const proximas = [...rentals]
    .filter((r) => r.status !== "finalizada")
    .sort((a, b) => a.devolucao.localeCompare(b.devolucao))
    .slice(0, 4);

  return (
    <AppShell title="Dashboard">
      <PageHeader
        title="Bom evento, Bruno 👋"
        subtitle="Terça, 25 de agosto de 2026 · visão geral da operação"
        actions={
          <Button asChild variant="hero" size="lg">
            <Link to="/locacoes/nova">
              <Plus className="h-4 w-4" /> Nova Locação
            </Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Rádios cadastrados"
          value={String(m.total)}
          icon={RadioTower}
          tone="neutral"
          hint="Patrimônio ativo"
        />
        <StatCard
          label="Locados"
          value={String(m.locados)}
          icon={CalendarClock}
          tone="brand"
          hint={`${ocupacao}% do estoque em uso`}
        />
        <StatCard
          label="Disponíveis"
          value={String(m.disponiveis)}
          icon={CheckCircle2}
          tone="success"
          hint="Prontos para locação"
        />
        <StatCard
          label="Em manutenção"
          value={String(m.manutencao)}
          icon={Wrench}
          tone="warning"
          hint="Fora de operação"
        />
        <StatCard
          label="Faturamento do mês"
          value={brl(m.faturamentoMes)}
          icon={CircleDollarSign}
          tone="success"
          hint="+11,7% vs julho"
        />
        <StatCard
          label="Valores a receber"
          value={brl(m.aReceber)}
          icon={Wallet}
          tone="danger"
          hint="3 títulos em aberto"
        />
        <StatCard
          label="Locações ativas"
          value={String(m.locacoesAtivas)}
          icon={CalendarClock}
          tone="info"
          hint="Em campo agora"
        />
        <StatCard
          label="Devolução atrasada"
          value={String(m.atrasadas)}
          icon={AlertTriangle}
          tone="danger"
          hint="Exige contato imediato"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="surface-panel p-4 lg:p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="min-w-0 truncate font-display text-base font-bold">
              Locações em andamento
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/locacoes">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {ativas.map((r) => (
              <li key={r.id}>
                <Link
                  to="/locacoes"
                  className="grid gap-3 rounded-xl border border-border bg-secondary/40 p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{r.cliente}</span>
                      <RentalStatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {r.numero} · {r.evento} · {r.qtdRadios} rádios
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Devolver em {r.devolucao}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <span className="font-display text-sm font-bold">{brl(r.valor)}</span>
                    <PaymentBadge status={r.pagamento} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="surface-panel p-4 lg:p-5">
            <h2 className="font-display text-base font-bold">Ocupação do estoque</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {m.locados + m.reservados} de {m.total} rádios comprometidos
            </p>
            <div className="mt-4 space-y-3">
              <Progress value={ocupacao} className="h-2.5" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Detail label="Locados" value={m.locados} tone="brand" />
                <Detail label="Reservados" value={m.reservados} tone="info" />
                <Detail label="Disponíveis" value={m.disponiveis} tone="success" />
                <Detail label="Manutenção" value={m.manutencao} tone="warning" />
              </div>
            </div>
          </div>

          <div className="surface-panel p-4 lg:p-5">
            <h2 className="font-display text-base font-bold">Próximas devoluções</h2>
            <ul className="mt-3 space-y-2.5">
              {proximas.map((r) => (
                <li
                  key={r.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.cliente}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.devolucao}</p>
                  </div>
                  <Badge tone={r.status === "atrasada" ? "danger" : "muted"}>
                    {r.status === "atrasada" ? "Atrasada" : `${r.qtdRadios} rádios`}
                  </Badge>
                </li>
              ))}
            </ul>
            <Button asChild variant="soft" className="mt-4 w-full">
              <Link to="/devolucao">
                <BatteryCharging className="h-4 w-4" /> Conferir devolução
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="surface-panel p-4 lg:p-5">
        <h2 className="font-display text-base font-bold">Resumo financeiro do mês</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat label="Faturado" value={brl(34860)} tone="text-foreground" />
          <MiniStat label="Recebido" value={brl(26940)} tone="text-success" />
          <MiniStat label="A receber" value={brl(7920)} tone="text-destructive" />
          <MiniStat label="Resultado" value={brl(24720)} tone="text-accent-foreground" />
        </div>
      </section>
    </AppShell>
  );
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "info" | "success" | "warning";
}) {
  const dot = {
    brand: "bg-primary",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
  }[tone];
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-lg font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}
