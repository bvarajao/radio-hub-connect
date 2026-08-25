import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Plus,
  RadioTower,
  Wallet,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { listRadios } from "@/lib/live-data";
import {
  listFinanceOperational,
  listRentalsOperational,
  type OperationalFinance,
  type OperationalRadio,
  type OperationalRental,
} from "@/lib/operations";
import { brl } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const [radios, setRadios] = useState<OperationalRadio[]>([]);
  const [rentals, setRentals] = useState<OperationalRental[]>([]);
  const [finance, setFinance] = useState<OperationalFinance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listRadios(), listRentalsOperational(), listFinanceOperational()])
      .then(([a, b, c]) => {
        setRadios(a as OperationalRadio[]);
        setRentals(b);
        setFinance(c);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const m = useMemo(() => {
    const reservedIds = new Set(
      rentals
        .filter((r) => r.status === "reserved")
        .flatMap((r) => (r.rental_radios || []).map((rr) => rr.radio_id)),
    );
    return {
      total: radios.length,
      locados: radios.filter((r) => r.status === "rented").length,
      disponiveis: radios.filter((r) => r.status === "available").length,
      manutencao: radios.filter((r) => r.status === "maintenance").length,
      reservados: reservedIds.size,
      ativas: rentals.filter((r) => ["active", "late"].includes(r.status)).length,
      atrasadas: rentals.filter((r) => r.status === "late").length,
      faturamento: finance
        .filter(
          (f) =>
            f.type === "income" && f.status !== "cancelled" && new Date(f.created_at) >= monthStart,
        )
        .reduce((s, f) => s + Number(f.amount), 0),
      areceber: finance
        .filter((f) => f.type === "income" && ["pending", "overdue"].includes(f.status))
        .reduce((s, f) => s + Number(f.amount), 0),
    };
  }, [radios, rentals, finance, monthStart]);

  return (
    <AppShell title="Dashboard">
      <PageHeader
        title="Visão geral da operação"
        subtitle={
          loading ? "Carregando dados..." : "Situação atual do estoque, locações e financeiro"
        }
        actions={
          <Button asChild variant="hero">
            <Link to="/locacoes/nova">
              <Plus className="h-4 w-4" /> Nova Locação
            </Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Rádios cadastrados" value={String(m.total)} icon={RadioTower} />
        <StatCard
          label="Locados agora"
          value={String(m.locados)}
          icon={CalendarClock}
          tone="brand"
        />
        <StatCard
          label="Disponíveis agora"
          value={String(m.disponiveis)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Em manutenção" value={String(m.manutencao)} icon={Wrench} tone="warning" />
        <StatCard
          label="Faturamento do mês"
          value={brl(m.faturamento)}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard label="A receber" value={brl(m.areceber)} icon={Wallet} tone="danger" />
        <StatCard
          label="Locações em andamento"
          value={String(m.ativas)}
          icon={CalendarClock}
          tone="info"
        />
        <StatCard
          label="Devoluções atrasadas"
          value={String(m.atrasadas)}
          icon={AlertTriangle}
          tone="danger"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold">Locações em andamento</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/locacoes">Ver todas</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {rentals
              .filter((r) => ["active", "late"].includes(r.status))
              .slice(0, 6)
              .map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.clients?.name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.code} · {r.event_name || "Sem evento"}
                      </p>
                    </div>
                    <b>{brl(Number(r.total || 0))}</b>
                  </div>
                  <p
                    className={`mt-2 text-xs ${r.status === "late" ? "font-semibold text-destructive" : "text-muted-foreground"}`}
                  >
                    {r.status === "late" ? "ATRASADA · " : ""}devolução{" "}
                    {new Date(r.due_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            {!loading && !rentals.some((r) => ["active", "late"].includes(r.status)) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma locação em andamento.
              </p>
            )}
          </div>
        </div>

        <div className="surface-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold">Estoque e compromissos</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/radios">Gerenciar</Link>
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Mini label="Disponíveis agora" value={m.disponiveis} />
            <Mini label="Locados agora" value={m.locados} />
            <Mini label="Reservados no futuro" value={m.reservados} />
            <Mini label="Manutenção" value={m.manutencao} />
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
