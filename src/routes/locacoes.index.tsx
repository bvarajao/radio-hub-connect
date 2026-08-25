import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, CalendarClock, Check, Pencil, Plus, RadioTower, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { PaymentBadge, RentalStatusBadge } from "@/components/app/StatusBadge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, brlExact } from "@/lib/mock-data";
import {
  listClients,
  listRadios,
  toPaymentStatus,
  toRentalStatus,
  type DbClient,
} from "@/lib/live-data";
import {
  blockedRadioIdsForPeriod,
  cancelRental,
  listRentalsOperational,
  replaceRentalRadios,
  updateRentalOperational,
  type OperationalRadio,
  type OperationalRental,
} from "@/lib/operations";

export const Route = createFileRoute("/locacoes/")({ component: RentalsPage });

const tabs = [
  ["todas", "Todas"],
  ["active", "Ativas"],
  ["reserved", "Reservadas"],
  ["returned", "Finalizadas"],
  ["late", "Atrasadas"],
  ["cancelled", "Canceladas"],
] as const;

const fmt = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const localInput = (value: string) => {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function RentalsPage() {
  const [items, setItems] = useState<OperationalRental[]>([]);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [radios, setRadios] = useState<OperationalRadio[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("todas");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OperationalRental | null>(null);

  const load = () =>
    Promise.all([listRentalsOperational(), listClients(), listRadios()])
      .then(([r, c, radiosData]) => {
        setItems(r);
        setClients(c);
        setRadios(radiosData as OperationalRadio[]);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar locações"))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const okText =
        !q || `${r.code} ${r.clients?.name ?? ""} ${r.event_name ?? ""}`.toLowerCase().includes(q);
      const okTab = tab === "todas" || r.status === tab;
      return okText && okTab;
    });
  }, [items, query, tab]);

  async function cancel(rental: OperationalRental) {
    try {
      await cancelRental(rental);
      toast.success("Locação cancelada e equipamentos liberados");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cancelar locação");
    }
  }

  return (
    <AppShell title="Locações">
      <PageHeader
        title="Locações"
        subtitle={loading ? "Carregando..." : `${items.length} locações cadastradas`}
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
          {tabs.map(([value, label]) => {
            const count =
              value === "todas" ? items.length : items.filter((r) => r.status === value).length;
            return (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${tab === value ? "border-primary bg-primary/15 text-accent-foreground" : "border-border text-muted-foreground"}`}
              >
                {label} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && list.length === 0 ? (
        <EmptyState
          title="Nenhuma locação encontrada"
          description="Crie a primeira locação ou altere os filtros."
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
              <RentalCard
                key={r.id}
                rental={r}
                onEdit={() => setEditing(r)}
                onCancel={() => cancel(r)}
              />
            ))}
          </div>

          <div className="surface-panel hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <Th>Locação</Th>
                  <Th>Cliente / Evento</Th>
                  <Th>Período</Th>
                  <Th>Rádios</Th>
                  <Th>Valor</Th>
                  <Th>Pagamento</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-display font-bold">{r.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.clients?.name ?? "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.event_name ?? "Sem evento"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p>{fmt(r.pickup_at)}</p>
                      <p>até {fmt(r.due_at)}</p>
                    </td>
                    <td className="px-4 py-3">{r.rental_radios?.length ?? 0}</td>
                    <td className="px-4 py-3 font-semibold">{brl(Number(r.total ?? 0))}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={toPaymentStatus(r.payment_status)} />
                    </td>
                    <td className="px-4 py-3">
                      <RentalStatusBadge status={toRentalStatus(r.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <RentalActions
                        rental={r}
                        onEdit={() => setEditing(r)}
                        onCancel={() => cancel(r)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <EditRentalDialog
        rental={editing}
        setRental={setEditing}
        clients={clients}
        radios={radios}
        onSaved={load}
      />
    </AppShell>
  );
}

function RentalCard({
  rental,
  onEdit,
  onCancel,
}: {
  rental: OperationalRental;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <article className="surface-panel p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{rental.clients?.name ?? "Cliente"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {rental.code} · {rental.event_name ?? "Sem evento"}
          </p>
        </div>
        <RentalStatusBadge status={toRentalStatus(rental.status)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>Retirada: {fmt(rental.pickup_at)}</span>
        <span>Devolução: {fmt(rental.due_at)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          {rental.rental_radios?.length ?? 0} rádios
        </span>
        <span className="flex items-center gap-2">
          <PaymentBadge status={toPaymentStatus(rental.payment_status)} />
          <b>{brl(Number(rental.total ?? 0))}</b>
        </span>
      </div>
      <RentalActions rental={rental} onEdit={onEdit} onCancel={onCancel} mobile />
    </article>
  );
}

function RentalActions({
  rental,
  onEdit,
  onCancel,
  mobile = false,
}: {
  rental: OperationalRental;
  onEdit: () => void;
  onCancel: () => void;
  mobile?: boolean;
}) {
  const editable = !["returned", "cancelled"].includes(rental.status);
  return (
    <div className={`flex flex-wrap gap-1 ${mobile ? "mt-3" : ""}`}>
      {editable && (
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" /> Editar
        </Button>
      )}
      {["active", "late"].includes(rental.status) && (
        <Button asChild variant="soft" size="sm">
          <Link to="/devolucao/$rentalId" params={{ rentalId: rental.code }}>
            <CalendarClock className="h-4 w-4" /> Conferir
          </Link>
        </Button>
      )}
      {editable && (
        <ConfirmAction
          trigger={
            <Button variant="ghost" size="sm">
              <Ban className="h-4 w-4 text-destructive" /> Cancelar
            </Button>
          }
          title="Cancelar locação?"
          description="Os rádios serão liberados e valores ainda pendentes serão cancelados. Pagamentos já recebidos serão preservados no financeiro."
          confirmLabel="Cancelar locação"
          onConfirm={onCancel}
        />
      )}
    </div>
  );
}

function EditRentalDialog({
  rental,
  setRental,
  clients,
  radios,
  onSaved,
}: {
  rental: OperationalRental | null;
  setRental: (r: OperationalRental | null) => void;
  clients: DbClient[];
  radios: OperationalRadio[];
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    client_id: "",
    event_name: "",
    pickup: "",
    due: "",
    subtotal: "0",
    discount: "0",
    surcharge: "0",
    deposit: "0",
    payment_status: "pending",
    payment_method: "pix",
    notes: "",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!rental) return;
    setF({
      client_id: rental.client_id,
      event_name: rental.event_name || "",
      pickup: localInput(rental.pickup_at),
      due: localInput(rental.due_at),
      subtotal: String(rental.subtotal || 0),
      discount: String(rental.discount || 0),
      surcharge: String(rental.surcharge || 0),
      deposit: String(rental.deposit_amount || 0),
      payment_status: rental.payment_status,
      payment_method: rental.payment_method || "pix",
      notes: rental.notes || "",
    });
    setSelected((rental.rental_radios || []).map((r) => r.radio_id));
  }, [rental]);

  useEffect(() => {
    if (!rental || !f.pickup || !f.due || new Date(f.due) <= new Date(f.pickup)) return;
    blockedRadioIdsForPeriod(
      new Date(f.pickup).toISOString(),
      new Date(f.due).toISOString(),
      rental.id,
    )
      .then(setBlocked)
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Erro ao verificar disponibilidade"),
      );
  }, [rental, f.pickup, f.due]);

  if (!rental) return null;

  const available = radios.filter(
    (r) =>
      !["maintenance", "lost", "inactive"].includes(r.status) &&
      (!blocked.has(r.id) || selected.includes(r.id)),
  );
  const subtotal = Number(f.subtotal || 0);
  const discount = Number(f.discount || 0);
  const surcharge = Number(f.surcharge || 0);
  const total = Math.max(0, subtotal - discount + surcharge);

  async function save() {
    if (!rental) return;
    const currentRental = rental;
    if (!f.client_id || !selected.length) {
      toast.error("Selecione o cliente e pelo menos um rádio");
      return;
    }
    if (new Date(f.due) <= new Date(f.pickup)) {
      toast.error("A devolução precisa ser posterior à retirada");
      return;
    }
    if (selected.some((id) => blocked.has(id))) {
      toast.error("Há rádio selecionado com conflito neste período");
      return;
    }
    setBusy(true);
    try {
      const data = {
        client_id: f.client_id,
        event_name: f.event_name.trim() || null,
        pickup_at: new Date(f.pickup).toISOString(),
        due_at: new Date(f.due).toISOString(),
        subtotal,
        discount,
        surcharge,
        total,
        payment_status:
          total > 0 && Number(f.deposit) >= total
            ? "paid"
            : Number(f.deposit) > 0
              ? "partial"
              : f.payment_status,
        payment_method: f.payment_method || null,
        deposit_amount: Math.min(Math.max(Number(f.deposit || 0), 0), total),
        notes: f.notes.trim() || null,
      };
      await updateRentalOperational(currentRental, data);
      await replaceRentalRadios(
        {
          ...currentRental,
          pickup_at: data.pickup_at,
          due_at: data.due_at,
          status:
            new Date(data.pickup_at) > new Date()
              ? "reserved"
              : new Date(data.due_at) < new Date()
                ? "late"
                : "active",
        },
        selected,
      );
      toast.success("Locação atualizada");
      setRental(null);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar locação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={Boolean(rental)} onOpenChange={(open) => !open && setRental(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar {rental.code}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Cliente</Label>
            <Select value={f.client_id} onValueChange={(v) => setF({ ...f, client_id: v })}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field
            label="Evento / referência"
            value={f.event_name}
            set={(v) => setF({ ...f, event_name: v })}
            wide
          />
          <Field
            label="Retirada"
            value={f.pickup}
            set={(v) => setF({ ...f, pickup: v })}
            type="datetime-local"
          />
          <Field
            label="Devolução"
            value={f.due}
            set={(v) => setF({ ...f, due: v })}
            type="datetime-local"
          />
          <div className="space-y-2 sm:col-span-2">
            <Label>Rádios ({selected.length})</Label>
            <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {available.map((r) => {
                const on = selected.includes(r.id);
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() =>
                      setSelected((p) => (on ? p.filter((id) => id !== r.id) : [...p, r.id]))
                    }
                    className={`rounded-xl border p-2.5 text-left text-xs ${on ? "border-primary bg-primary/12" : "border-border"}`}
                  >
                    <span className="flex items-center justify-between">
                      <b>{r.code}</b>
                      {on ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <RadioTower className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {r.band} · {r.radio_models?.model || "Sem modelo"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <Field
            label="Subtotal"
            value={f.subtotal}
            set={(v) => setF({ ...f, subtotal: v })}
            type="number"
          />
          <Field
            label="Desconto"
            value={f.discount}
            set={(v) => setF({ ...f, discount: v })}
            type="number"
          />
          <Field
            label="Acréscimo"
            value={f.surcharge}
            set={(v) => setF({ ...f, surcharge: v })}
            type="number"
          />
          <Field
            label="Entrada recebida"
            value={f.deposit}
            set={(v) => setF({ ...f, deposit: v })}
            type="number"
          />
          <div className="space-y-1.5">
            <Label>Pagamento</Label>
            <Select
              value={f.payment_method}
              onValueChange={(v) => setF({ ...f, payment_method: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="boleto">Boleto / empenho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Situação</Label>
            <Select
              value={f.payment_status}
              onValueChange={(v) => setF({ ...f, payment_status: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">A receber</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 sm:col-span-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total atualizado</span>
              <b className="font-display text-lg">{brlExact(total)}</b>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRental(null)}>
            Cancelar
          </Button>
          <Button variant="hero" onClick={save} disabled={busy}>
            {busy ? "Salvando..." : "Salvar alterações"}
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
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
