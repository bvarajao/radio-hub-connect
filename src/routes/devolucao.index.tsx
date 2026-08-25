import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, QrCode } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { RentalStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { rentals } from "@/lib/mock-data";

export const Route = createFileRoute("/devolucao/")({
  head: () => ({
    meta: [
      { title: "Devolução e Conferência | Papo de Produtor" },
      {
        name: "description",
        content:
          "Confira a devolução dos rádios item por item pelo celular: OK, avariado ou faltando, com registro de acessórios.",
      },
      { property: "og:title", content: "Devolução e Conferência — Papo de Produtor" },
      {
        property: "og:description",
        content: "Checklist rápido de devolução de rádios comunicadores em campo.",
      },
    ],
  }),
  component: ReturnList,
});

function ReturnList() {
  const abertas = rentals.filter((r) => r.status === "ativa" || r.status === "atrasada");

  return (
    <AppShell title="Devolução">
      <PageHeader
        title="Devolução e conferência"
        subtitle="Selecione a locação para conferir os equipamentos"
        actions={
          <Button variant="outline">
            <QrCode className="h-4 w-4" /> Escanear QR Code
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {abertas.map((r) => (
          <Link
            key={r.id}
            to="/devolucao/$rentalId"
            params={{ rentalId: r.numero }}
            className="surface-panel block p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.cliente}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.numero} · {r.evento}
                </p>
              </div>
              <RentalStatusBadge status={r.status} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {r.qtdRadios} rádios · devolução prevista {r.devolucao}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Iniciar conferência <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
