import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { PaymentBadge, RentalStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl } from "@/lib/mock-data";
import { listRentals, toPaymentStatus, toRentalStatus, type DbRental } from "@/lib/live-data";
import { toast } from "sonner";

export const Route = createFileRoute("/locacoes/")({ component: RentalsPage });

const tabs = [
  ["todas", "Todas"],
  ["active", "Ativas"],
  ["reserved", "Reservadas"],
  ["returned", "Finalizadas"],
  ["late", "Atrasadas"],
] as const;

const fmt = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function RentalsPage() {
  const [items, setItems] = useState<DbRental[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRentals()
      .then(setItems)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar locações"))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const okText = !q || `${r.code} ${r.clients?.name ?? ""} ${r.event_name ?? ""}`.toLowerCase().includes(q);
      const okTab = tab === "todas" || r.status === tab;
      return okText && okTab;
    });
  }, [items, query, tab]);

  return (
    <AppShell title="Locações">
      <PageHeader
        title="Locações"
        subtitle={loading ? "Carregando..." : `${items.length} locações cadastradas`}
        actions={
          <Button asChild variant="hero" size="lg">
            <Link to="/locacoes/nova"><Plus className="h-4 w-4" /> Nova Locação</Link>
          </Button>
        }
      />

      <div className="surface-panel space-y-4 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por número, cliente ou evento" className="h-11 pl-9" />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {tabs.map(([value, label]) => {
            const count = value === "todas" ? items.length : items.filter((r) => r.status === value).length;
            return <button key={value} onClick={() => setTab(value)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${tab === value ? "border-primary bg-primary/15 text-accent-foreground" : "border-border text-muted-foreground"}`}>{label} · {count}</button>;
          })}
        </div>
      </div>

      {!loading && list.length === 0 ? (
        <EmptyState title="Nenhuma locação encontrada" description="Crie a primeira locação ou altere os filtros." action={<Button asChild variant="hero"><Link to="/locacoes/nova"><Plus className="h-4 w-4" /> Nova Locação</Link></Button>} />
      ) : (
        <>
          <div className="grid gap-3 lg:hidden">
            {list.map((r) => <article key={r.id} className="surface-panel p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{r.clients?.name ?? "Cliente"}</p><p className="truncate text-xs text-muted-foreground">{r.code} · {r.event_name ?? "Sem evento"}</p></div>
                <RentalStatusBadge status={toRentalStatus(r.status)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Retirada: {fmt(r.pickup_at)}</span><span>Devolução: {fmt(r.due_at)}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3"><span className="text-xs text-muted-foreground">{r.rental_radios?.length ?? 0} rádios</span><span className="flex items-center gap-2"><PaymentBadge status={toPaymentStatus(r.payment_status)} /><b>{brl(Number(r.total ?? 0))}</b></span></div>
              {["active", "late"].includes(r.status) && <Button asChild variant="soft" size="sm" className="mt-3 w-full"><Link to="/devolucao/$rentalId" params={{ rentalId: r.code }}><CalendarClock className="h-4 w-4" /> Conferir devolução</Link></Button>}
            </article>)}
          </div>

          <div className="surface-panel hidden overflow-hidden lg:block">
            <table className="w-full text-sm"><thead className="bg-secondary/60 text-xs uppercase text-muted-foreground"><tr><Th>Locação</Th><Th>Cliente / Evento</Th><Th>Período</Th><Th>Rádios</Th><Th>Valor</Th><Th>Pagamento</Th><Th>Status</Th><Th /></tr></thead>
              <tbody>{list.map((r) => <tr key={r.id} className="border-t border-border"><td className="px-4 py-3 font-display font-bold">{r.code}</td><td className="px-4 py-3"><p className="font-medium">{r.clients?.name ?? "Cliente"}</p><p className="text-xs text-muted-foreground">{r.event_name ?? "Sem evento"}</p></td><td className="px-4 py-3 text-xs text-muted-foreground"><p>{fmt(r.pickup_at)}</p><p>até {fmt(r.due_at)}</p></td><td className="px-4 py-3">{r.rental_radios?.length ?? 0}</td><td className="px-4 py-3 font-semibold">{brl(Number(r.total ?? 0))}</td><td className="px-4 py-3"><PaymentBadge status={toPaymentStatus(r.payment_status)} /></td><td className="px-4 py-3"><RentalStatusBadge status={toRentalStatus(r.status)} /></td><td className="px-4 py-3 text-right">{["active", "late"].includes(r.status) && <Button asChild variant="ghost" size="sm"><Link to="/devolucao/$rentalId" params={{ rentalId: r.code }}>Conferir</Link></Button>}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-4 py-3 text-left font-semibold">{children}</th>; }
