import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Download,
  PackageX,
  PieChart,
  RadioTower,
  Users,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Relatórios de faturamento, utilização de rádios, clientes, manutenção e perdas do estoque.",
      },
      { property: "og:title", content: "Relatórios — Papo de Produtor" },
      {
        property: "og:description",
        content: "Análises operacionais e financeiras da locação de rádios.",
      },
    ],
  }),
  component: ReportsPage,
});

const reports = [
  {
    icon: BarChart3,
    title: "Faturamento",
    text: "Receita por período, cliente e tipo de evento.",
    ready: true,
  },
  {
    icon: RadioTower,
    title: "Utilização dos rádios",
    text: "Dias em campo, ociosidade e rentabilidade por patrimônio.",
    ready: true,
  },
  { icon: Users, title: "Clientes", text: "Ranking, recorrência e ticket médio.", ready: false },
  {
    icon: Wrench,
    title: "Manutenção",
    text: "Custos por equipamento e recorrência de falhas.",
    ready: false,
  },
  {
    icon: PackageX,
    title: "Perdas e avarias",
    text: "Equipamentos não devolvidos e prejuízo acumulado.",
    ready: false,
  },
  {
    icon: PieChart,
    title: "Ocupação do estoque",
    text: "Ocupação média e picos de demanda do calendário.",
    ready: false,
  },
];

function ReportsPage() {
  return (
    <AppShell title="Relatórios">
      <PageHeader
        title="Relatórios"
        subtitle="Análises da operação — em construção nesta versão de protótipo"
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Exportar tudo
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map(({ icon: Icon, title, text, ready }) => (
          <article
            key={title}
            className="surface-panel flex flex-col gap-3 p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="min-w-0 truncate font-display text-sm font-bold">{title}</h2>
            </div>
            <p className="flex-1 text-xs text-muted-foreground">{text}</p>
            <div className="flex items-center justify-between">
              <Badge tone={ready ? "success" : "muted"}>{ready ? "Disponível" : "Em breve"}</Badge>
              <Button variant="ghost" size="sm" disabled={!ready}>
                Abrir
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
