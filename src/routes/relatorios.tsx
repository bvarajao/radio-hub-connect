import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download, PackageX, PieChart, RadioTower, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brlExact } from "@/lib/mock-data";
import {
  listClients,
  listMaintenance,
  listRadios,
  type DbClient,
  type DbMaintenance,
} from "@/lib/live-data";
import {
  listFinanceOperational,
  listRentalsOperational,
  type OperationalFinance,
  type OperationalRadio,
  type OperationalRental,
} from "@/lib/operations";

export const Route = createFileRoute("/relatorios")({ component: ReportsPage });
type Period = "month" | "30days" | "year" | "all";

function ReportsPage() {
  const [radios, setRadios] = useState<OperationalRadio[]>([]);
  const [rentals, setRentals] = useState<OperationalRental[]>([]);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [finance, setFinance] = useState<OperationalFinance[]>([]);
  const [maintenance, setMaintenance] = useState<DbMaintenance[]>([]);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    Promise.all([
      listRadios(),
      listRentalsOperational(),
      listClients(),
      listFinanceOperational(),
      listMaintenance(),
    ])
      .then(([r, l, c, f, m]) => {
        setRadios(r as OperationalRadio[]);
        setRentals(l);
        setClients(c);
        setFinance(f);
        setMaintenance(m);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar relatórios"));
  }, []);

  const start = useMemo(() => {
    const now = new Date();
    if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "30days") return new Date(now.getTime() - 30 * 86400000);
    if (period === "year") return new Date(now.getFullYear(), 0, 1);
    return null;
  }, [period]);

  const periodRentals = useMemo(
    () => rentals.filter((r) => !start || new Date(r.pickup_at) >= start),
    [rentals, start],
  );
  const periodFinance = useMemo(
    () => finance.filter((f) => !start || new Date(f.created_at) >= start),
    [finance, start],
  );
  const periodMaintenance = useMemo(
    () => maintenance.filter((m) => !start || new Date(m.opened_at) >= start),
    [maintenance, start],
  );

  const data = useMemo(() => {
    const income = periodFinance
      .filter((f) => f.type === "income" && f.status !== "cancelled")
      .reduce((s, f) => s + Number(f.amount), 0);
    const received = periodFinance
      .filter((f) => f.type === "income" && f.status === "paid")
      .reduce((s, f) => s + Number(f.amount), 0);
    const expenses = periodFinance
      .filter((f) => f.type === "expense" && f.status !== "cancelled")
      .reduce((s, f) => s + Number(f.amount), 0);
    const receivable = finance
      .filter((f) => f.type === "income" && ["pending", "overdue"].includes(f.status))
      .reduce((s, f) => s + Number(f.amount), 0);
    const lost = radios.filter((r) => r.status === "lost").length;
    const active = radios.filter((r) => r.status === "rented").length;
    const occupancy = radios.length ? Math.round((active / radios.length) * 100) : 0;
    const ticket = periodRentals.length
      ? periodRentals.reduce((s, r) => s + Number(r.total || 0), 0) / periodRentals.length
      : 0;
    const maintenanceCost = periodMaintenance
      .filter((m) => m.status !== "cancelled")
      .reduce((s, m) => s + Number(m.cost || 0), 0);
    return { income, received, expenses, receivable, lost, occupancy, ticket, maintenanceCost };
  }, [radios, rentals, finance, periodRentals, periodFinance, periodMaintenance]);

  function exportCsv() {
    const rows = [
      ["Tipo", "Código/Descrição", "Cliente", "Data", "Status", "Valor"],
      ...periodRentals.map((r) => [
        "Locação",
        r.code,
        r.clients?.name || "",
        new Date(r.pickup_at).toLocaleDateString("pt-BR"),
        r.status,
        String(r.total || 0),
      ]),
      ...periodFinance.map((f) => [
        f.type === "income" ? "Entrada" : "Saída",
        f.description,
        "",
        new Date(f.created_at).toLocaleDateString("pt-BR"),
        f.status,
        String(f.amount),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `papo-de-produtor-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    {
      icon: BarChart3,
      title: "Faturamento",
      value: brlExact(data.income),
      text: `Recebido: ${brlExact(data.received)} · despesas: ${brlExact(data.expenses)}`,
      tone: "success" as const,
    },
    {
      icon: RadioTower,
      title: "Utilização agora",
      value: `${data.occupancy}%`,
      text: `${radios.filter((r) => r.status === "rented").length} de ${radios.length} rádios locados agora`,
      tone: "brand" as const,
    },
    {
      icon: Users,
      title: "Clientes ativos",
      value: String(clients.length),
      text: `Ticket médio: ${brlExact(data.ticket)}`,
      tone: "info" as const,
    },
    {
      icon: Wrench,
      title: "Manutenção",
      value: brlExact(data.maintenanceCost),
      text: `${maintenance.filter((m) => !["completed", "cancelled"].includes(m.status)).length} ordens em aberto`,
      tone: "warning" as const,
    },
    {
      icon: PackageX,
      title: "Perdas",
      value: String(data.lost),
      text: `A receber hoje: ${brlExact(data.receivable)}`,
      tone: data.lost ? ("danger" as const) : ("success" as const),
    },
    {
      icon: PieChart,
      title: "Locações no período",
      value: String(periodRentals.length),
      text: `${rentals.filter((r) => ["active", "late"].includes(r.status)).length} em andamento agora`,
      tone: "muted" as const,
    },
  ];

  return (
    <AppShell title="Relatórios">
      <PageHeader
        title="Relatórios"
        subtitle="Indicadores consolidados da operação"
        actions={
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ icon: Icon, title, value, text, tone }) => (
          <article key={title} className="surface-panel flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="font-display text-sm font-bold">{title}</h2>
            </div>
            <p className="font-display text-2xl font-extrabold">{value}</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{text}</p>
              <Badge tone={tone}>Atual</Badge>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
