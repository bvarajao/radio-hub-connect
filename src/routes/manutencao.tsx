import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wrench } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { brlExact, maintenances } from "@/lib/mock-data";

export const Route = createFileRoute("/manutencao")({
  head: () => ({
    meta: [
      { title: "Manutenção | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Rádios em manutenção com tipo de problema, data de entrada, custo, técnico responsável e status.",
      },
      { property: "og:title", content: "Manutenção — Papo de Produtor" },
      {
        property: "og:description",
        content: "Controle de reparos e custos dos rádios comunicadores.",
      },
    ],
  }),
  component: MaintenancePage,
});

const statusInfo = {
  aberta: { label: "Aberta", tone: "danger" as const },
  em_reparo: { label: "Em reparo", tone: "warning" as const },
  concluida: { label: "Concluída", tone: "success" as const },
};

function MaintenancePage() {
  const total = maintenances.reduce((s, m) => s + m.custo, 0);

  return (
    <AppShell title="Manutenção">
      <PageHeader
        title="Manutenção"
        subtitle="Equipamentos fora de operação e histórico de reparos"
        actions={
          <Button variant="hero">
            <Plus className="h-4 w-4" /> Nova ordem
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ordens abertas" value="2" icon={Wrench} tone="warning" />
        <StatCard label="Em reparo externo" value="1" icon={Wrench} tone="info" />
        <StatCard label="Concluídas no mês" value="1" icon={Wrench} tone="success" />
        <StatCard label="Custo total" value={brlExact(total)} icon={Wrench} tone="danger" />
      </section>

      <div className="grid gap-3">
        {maintenances.map((m) => {
          const info = statusInfo[m.status];
          return (
            <article key={m.id} className="surface-panel p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold">{m.radio}</span>
                    <Badge tone={info.tone}>{info.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm">{m.problema}</p>
                </div>
                <span className="shrink-0 font-display text-sm font-bold">{brlExact(m.custo)}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span className="truncate">Entrada: {m.entrada}</span>
                <span className="truncate">Técnico: {m.tecnico}</span>
                <span className="truncate">{m.observacao}</span>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
