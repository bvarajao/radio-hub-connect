import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, brlExact } from "@/lib/mock-data";
import { createFinance, listClients, type DbClient } from "@/lib/live-data";
import {
  listFinanceOperational,
  markFinancePaid,
  removeFinanceSafely,
  updateFinanceRecord,
  type OperationalFinance,
} from "@/lib/operations";

export const Route = createFileRoute("/financeiro")({ component: FinancePage });

function FinancePage() {
  const [items, setItems] = useState<OperationalFinance[]>([]);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OperationalFinance | null>(null);

  const load = () =>
    Promise.all([listFinanceOperational(), listClients()])
      .then(([f, c]) => {
        setItems(f);
        setClients(c);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar financeiro"));

  useEffect(() => {
    void load();
  }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const current = items.filter((i) => new Date(i.created_at) >= monthStart);
  const metrics = useMemo(() => {
    const income = current
      .filter((x) => x.type === "income")
      .reduce((s, x) => s + Number(x.amount), 0);
    const received = current
      .filter((x) => x.type === "income" && x.status === "paid")
      .reduce((s, x) => s + Number(x.amount), 0);
    const receivable = items
      .filter((x) => x.type === "income" && ["pending", "overdue"].includes(x.status))
      .reduce((s, x) => s + Number(x.amount), 0);
    const expenses = current
      .filter((x) => x.type === "expense" && x.status !== "cancelled")
      .reduce((s, x) => s + Number(x.amount), 0);
    return { income, received, receivable, expenses, result: received - expenses };
  }, [items, current]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!q || `${i.description} ${i.category}`.toLowerCase().includes(q)) &&
        (type === "all" || i.type === type) &&
        (status === "all" || i.status === status),
    );
  }, [items, query, type, status]);

  async function markPaid(item: OperationalFinance) {
    try {
      await markFinancePaid(item.id);
      toast.success("Lançamento marcado como pago");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar lançamento");
    }
  }

  async function remove(item: OperationalFinance) {
    try {
      const result = await removeFinanceSafely(item);
      toast.success(result.archived ? "Lançamento vinculado cancelado" : "Lançamento excluído");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover lançamento");
    }
  }

  return (
    <AppShell title="Financeiro">
      <PageHeader
        title="Financeiro"
        subtitle="Entradas, saídas e contas a receber"
        actions={
          <FinanceDialog
            open={open}
            setOpen={(value) => {
              setOpen(value);
              if (!value) setEditing(null);
            }}
            item={editing}
            clients={clients}
            onSaved={load}
          />
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Faturamento"
          value={brl(metrics.income)}
          icon={CircleDollarSign}
          tone="brand"
        />
        <StatCard
          label="Recebido"
          value={brl(metrics.received)}
          icon={ArrowUpCircle}
          tone="success"
        />
        <StatCard label="A receber" value={brl(metrics.receivable)} icon={Wallet} tone="danger" />
        <StatCard
          label="Despesas"
          value={brl(metrics.expenses)}
          icon={ArrowDownCircle}
          tone="warning"
        />
        <StatCard
          label="Resultado recebido"
          value={brl(metrics.result)}
          icon={TrendingUp}
          tone="info"
          className="col-span-2 lg:col-span-1"
        />
      </section>

      <div className="surface-panel grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lançamento"
            className="h-11 pl-9"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Entradas e saídas</SelectItem>
            <SelectItem value="income">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface-panel overflow-hidden">
          <h2 className="border-b border-border p-4 font-display text-base font-bold">
            Lançamentos
          </h2>
          <ul className="divide-y divide-border">
            {filtered.map((i) => (
              <li
                key={i.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-lg ${i.type === "income" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"}`}
                >
                  {i.type === "income" ? (
                    <ArrowUpCircle className="h-4.5 w-4.5" />
                  ) : (
                    <ArrowDownCircle className="h-4.5 w-4.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(i.created_at).toLocaleDateString("pt-BR")} · {i.category}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(i);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                    {i.status !== "paid" && i.status !== "cancelled" && (
                      <Button variant="ghost" size="sm" onClick={() => void markPaid(i)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pago
                      </Button>
                    )}
                    <ConfirmAction
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" /> Remover
                        </Button>
                      }
                      title="Remover lançamento?"
                      description="Lançamentos vinculados a locações ou manutenções serão cancelados para preservar o histórico."
                      confirmLabel="Remover"
                      onConfirm={() => remove(i)}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold">
                    {i.type === "income" ? "+" : "−"} {brlExact(Number(i.amount))}
                  </p>
                  <FinanceBadge status={i.status} />
                </div>
              </li>
            ))}
            {!filtered.length && (
              <li className="p-10 text-center text-sm text-muted-foreground">
                Nenhum lançamento encontrado.
              </li>
            )}
          </ul>
        </div>

        <div className="surface-panel p-4">
          <h2 className="font-display text-base font-bold">Contas a receber</h2>
          <ul className="mt-3 space-y-3">
            {items
              .filter((i) => i.type === "income" && ["pending", "overdue"].includes(i.status))
              .map((i) => (
                <li key={i.id} className="rounded-xl bg-secondary/50 p-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.due_date
                          ? `Vence ${new Date(`${i.due_date}T12:00:00`).toLocaleDateString("pt-BR")}`
                          : "Sem vencimento"}
                      </p>
                    </div>
                    <b className="shrink-0">{brlExact(Number(i.amount))}</b>
                  </div>
                  <Button
                    variant="soft"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => void markPaid(i)}
                  >
                    Receber agora
                  </Button>
                </li>
              ))}
            {!items.some(
              (i) => i.type === "income" && ["pending", "overdue"].includes(i.status),
            ) && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma conta em aberto.
              </li>
            )}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}

function FinanceBadge({ status }: { status: string }) {
  return (
    <Badge
      tone={
        status === "paid"
          ? "success"
          : status === "overdue"
            ? "danger"
            : status === "cancelled"
              ? "muted"
              : "warning"
      }
    >
      {status === "paid"
        ? "Pago"
        : status === "overdue"
          ? "Atrasado"
          : status === "cancelled"
            ? "Cancelado"
            : "Pendente"}
    </Badge>
  );
}

function FinanceDialog({
  open,
  setOpen,
  item,
  clients,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  item: OperationalFinance | null;
  clients: DbClient[];
  onSaved: () => void;
}) {
  const blank = {
    type: "income",
    category: "other",
    description: "",
    amount: "",
    status: "pending",
    due_date: "",
    payment_method: "pix",
    client_id: "",
    notes: "",
  };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (item)
      setF({
        type: item.type,
        category: item.category,
        description: item.description,
        amount: String(item.amount),
        status: item.status,
        due_date: item.due_date || "",
        payment_method: item.payment_method || "pix",
        client_id: item.client_id || "",
        notes: item.notes || "",
      });
    else if (open) setF(blank);
  }, [item, open]);

  async function save() {
    if (!f.description.trim() || Number(f.amount) <= 0)
      return toast.error("Informe descrição e valor maior que zero");
    setBusy(true);
    const payload = {
      type: f.type,
      category: f.category.trim() || "other",
      description: f.description.trim(),
      amount: Number(f.amount),
      status: f.status,
      due_date: f.due_date || null,
      payment_method: f.payment_method || null,
      client_id: f.client_id || null,
      notes: f.notes.trim() || null,
    };
    try {
      if (item) await updateFinanceRecord(item.id, payload);
      else
        await createFinance({
          ...payload,
          paid_at: f.status === "paid" ? new Date().toISOString() : null,
        });
      toast.success(item ? "Lançamento atualizado" : "Lançamento criado");
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!item && (
        <DialogTrigger asChild>
          <Button variant="hero">
            <Plus className="h-4 w-4" /> Novo lançamento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Tipo"
            value={f.type}
            set={(v) => setF({ ...f, type: v })}
            options={[
              ["income", "Entrada"],
              ["expense", "Saída"],
            ]}
          />
          <Field label="Categoria" value={f.category} set={(v) => setF({ ...f, category: v })} />
          <Field
            label="Descrição"
            value={f.description}
            set={(v) => setF({ ...f, description: v })}
            wide
          />
          <Field
            label="Valor"
            value={f.amount}
            set={(v) => setF({ ...f, amount: v })}
            type="number"
          />
          <SelectField
            label="Situação"
            value={f.status}
            set={(v) => setF({ ...f, status: v })}
            options={[
              ["pending", "Pendente"],
              ["paid", "Pago"],
              ["overdue", "Atrasado"],
              ["cancelled", "Cancelado"],
            ]}
          />
          <Field
            label="Vencimento"
            value={f.due_date}
            set={(v) => setF({ ...f, due_date: v })}
            type="date"
          />
          <SelectField
            label="Cliente"
            value={f.client_id || "none"}
            set={(v) => setF({ ...f, client_id: v === "none" ? "" : v })}
            options={[["none", "Sem cliente"], ...clients.map((c) => [c.id, c.name])]}
          />
          <SelectField
            label="Pagamento"
            value={f.payment_method || "none"}
            set={(v) => setF({ ...f, payment_method: v === "none" ? "" : v })}
            options={[
              ["none", "Não informado"],
              ["pix", "Pix"],
              ["cartao", "Cartão"],
              ["dinheiro", "Dinheiro"],
              ["transferencia", "Transferência"],
              ["boleto", "Boleto / empenho"],
            ]}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="hero" onClick={save} disabled={busy}>
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  set,
  type = "text",
  wide = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => set(e.target.value)} className="h-11" />
    </div>
  );
}
function SelectField({
  label,
  value,
  set,
  options,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  options: string[][];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={set}>
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v!} value={v!}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
