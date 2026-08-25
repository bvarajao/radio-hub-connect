import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { PaymentBadge, RentalStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl, rentals, rentalStatusLabel, type RentalStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/locacoes/")({
  head: () => ({
    meta: [
      { title: "Locações | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Acompanhe locações ativas, reservadas, finalizadas e atrasadas com cliente, período, valores e pagamento.",
      },
      { property: "og:title", content: "Locações — Papo de Produtor" },
      {
        property: "og:description",
        content: "Painel de locações de rádios comunicadores por status e período.",
      },
    ],
  }),
  component: RentalsPage,
});

const tabs: (RentalStatus | "todas")[] = ["todas", "ativa", "reservada", "finalizada", "atrasada"];

function RentalsPage() {
  const [tab, setTab] = useState<RentalStatus | "todas">("todas");
  const [query, setQuery] = useState("");

  const list = rentals.filter((r) => {
    const q = query.trim().toLowerCase();
    const okQuery =
      !q ||
      r.numero.toLowerCase().includes(q) ||
      r.cliente.toLowerCase().includes(q) ||
      r.evento.toLowerCase().includes(q);
    return okQuery && (tab === "todas" || r.status === tab);
  });

  return (
    <AppShell title="Locações">
      <PageHeader
        title="Locações"
        subtitle="Controle completo dos contratos de locação de rádios"
        actions={
          <Button asChild variant="hero" size="lg">
            <Link to="/locacoes/nova">
              <Plus className="h-4 w-4" /> Nova Locação
            </Link>
          </Button>
        }
      />

      <div className="surface-panel space-y-4 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, cliente ou evento"
            className="h-11 pl-9"
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {tabs.map((t) => {
            const count = t === "todas" ? rentals.length : rentals.filter((r) => r.status === t).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  tab === t
                    ? "border-primary bg-primary/15 text-accent-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {t === "todas" ? "Todas" : rentalStatusLabel[t]} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhuma locação nesta visão"
          description="Altere o filtro ou registre uma nova locação para começar."
          action={
            <Button asChild variant="hero">
              <Link to="/locacoes/nova">
                <Plus className="h-4 w-4" /> Nova Locação
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 lg:hidden">
            {list.map((r) => (
              <div key={r.id} className="surface-panel p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.cliente}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.numero} · {r.evento}
                    </p>
                  </div>
                  <RentalStatusBadge status={r.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="truncate">Retirada: {r.retirada}</span>
                  <span className="truncate">Devolução: {r.devolucao}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">{r.qtdRadios} rádios</span>
                  <span className="flex items-center gap-2">
                    <PaymentBadge status={r.pagamento} />
                    <span className="font-display text-sm font-bold">{brl(r.valor)}</span>
                  </span>
                </div>
                <Button asChild variant="soft" size="sm" className="mt-3 w-full">
                  <Link to="/devolucao/$rentalId" params={{ rentalId: r.numero }}>
                    <CalendarClock className="h-4 w-4" /> Conferir devolução
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="surface-panel hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <Th>Locação</Th>
                  <Th>Cliente / Evento</Th>
                  <Th>Período</Th>
                  <Th>Rádios</Th>
                  <Th>Valor</Th>
                  <Th>Pagamento</Th>
                  <Th>Status</Th>
                  <Th> </Th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-border transition-colors hover:bg-accent/40">
                    <td className="px-4 py-3 font-display font-bold">{r.numero}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.cliente}</p>
                      <p className="text-xs text-muted-foreground">{r.evento}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p>{r.retirada}</p>
                      <p>até {r.devolucao}</p>
                    </td>
                    <td className="px-4 py-3">{r.qtdRadios}</td>
                    <td className="px-4 py-3 font-semibold">{brl(r.valor)}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={r.pagamento} />
                    </td>
                    <td className="px-4 py-3">
                      <RentalStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/devolucao/$rentalId" params={{ rentalId: r.numero }}>
                          Conferir
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left font-semibold">{children}</th>
);
