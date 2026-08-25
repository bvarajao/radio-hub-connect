import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { StatCard } from "@/components/app/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, brlExact, clients, faturamentoMensal, lancamentos } from "@/lib/mock-data";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Faturamento, recebimentos, despesas, resultado e contas a receber das locações de rádios.",
      },
      { property: "og:title", content: "Financeiro — Papo de Produtor" },
      {
        property: "og:description",
        content: "Controle financeiro das locações com gráfico de faturamento mensal.",
      },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  const aReceber = lancamentos.filter((l) => l.situacao === "a_receber");

  return (
    <AppShell title="Financeiro">
      <PageHeader
        title="Financeiro"
        subtitle="Agosto de 2026 · entradas, saídas e resultado"
        actions={
          <div className="flex gap-2">
            <Select defaultValue="mes">
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Este mês</SelectItem>
                <SelectItem value="trimestre">Últimos 3 meses</SelectItem>
                <SelectItem value="ano">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="todos">
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Faturamento" value={brl(34860)} icon={CircleDollarSign} tone="brand" />
        <StatCard label="Recebido" value={brl(26940)} icon={ArrowUpCircle} tone="success" />
        <StatCard label="A receber" value={brl(7920)} icon={Wallet} tone="danger" />
        <StatCard label="Despesas" value={brl(10140)} icon={ArrowDownCircle} tone="warning" />
        <StatCard
          label="Resultado"
          value={brl(24720)}
          icon={TrendingUp}
          tone="info"
          className="col-span-2 lg:col-span-1"
        />
      </section>

      <section className="surface-panel p-4 lg:p-5">
        <h2 className="font-display text-base font-bold">Faturamento mensal</h2>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={faturamentoMensal}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickFormatter={(v: number) => `${v / 1000}k`}
              />
              <Tooltip
                formatter={(v: number) => brlExact(v)}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="valor" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface-panel overflow-hidden">
          <h2 className="border-b border-border p-4 font-display text-base font-bold">
            Entradas e saídas
          </h2>
          <ul className="divide-y divide-border">
            {lancamentos.map((l) => (
              <li key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    l.tipo === "entrada" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
                  }`}
                >
                  {l.tipo === "entrada" ? (
                    <ArrowUpCircle className="h-4.5 w-4.5" />
                  ) : (
                    <ArrowDownCircle className="h-4.5 w-4.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.descricao}</p>
                  <p className="text-xs text-muted-foreground">{l.data}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-sm font-bold">
                    {l.tipo === "entrada" ? "+" : "−"} {brl(l.valor)}
                  </p>
                  <Badge
                    tone={
                      l.situacao === "a_receber"
                        ? "danger"
                        : l.situacao === "recebido"
                          ? "success"
                          : "muted"
                    }
                  >
                    {l.situacao === "a_receber"
                      ? "A receber"
                      : l.situacao === "recebido"
                        ? "Recebido"
                        : "Pago"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-panel p-4 lg:p-5">
          <h2 className="font-display text-base font-bold">Contas a receber</h2>
          <ul className="mt-3 space-y-3">
            {aReceber.map((l) => (
              <li
                key={l.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-secondary/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.descricao}</p>
                  <p className="text-xs text-muted-foreground">Vencimento {l.data}</p>
                </div>
                <span className="font-display text-sm font-bold">{brl(l.valor)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total em aberto</span>
            <span className="font-display text-lg font-extrabold text-destructive">
              {brl(aReceber.reduce((s, l) => s + l.valor, 0))}
            </span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
