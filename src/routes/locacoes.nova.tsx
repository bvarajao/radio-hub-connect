import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RadioTower, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brlExact } from "@/lib/mock-data";
import {
  listAccessories,
  listClients,
  listRadios,
  type DbAccessory,
  type DbClient,
} from "@/lib/live-data";
import {
  blockedRadioIdsForPeriod,
  createRentalOperational,
  type OperationalRadio,
} from "@/lib/operations";

export const Route = createFileRoute("/locacoes/nova")({ component: NewRental });

const steps = ["Cliente e período", "Rádios e acessórios", "Valores e confirmação"];
const localInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function NewRental() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [radios, setRadios] = useState<OperationalRadio[]>([]);
  const [accessories, setAccessories] = useState<DbAccessory[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [clientId, setClientId] = useState("");
  const [eventName, setEventName] = useState("");
  const [pickup, setPickup] = useState(localInput(new Date()));
  const [due, setDue] = useState(localInput(new Date(Date.now() + 86400000)));
  const [selected, setSelected] = useState<string[]>([]);
  const [acc, setAcc] = useState<Record<string, number>>({});
  const [radioValue, setRadioValue] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [surcharge, setSurcharge] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [deposit, setDeposit] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([listClients(), listRadios(), listAccessories()])
      .then(([c, r, a]) => {
        setClients(c);
        setRadios(r as OperationalRadio[]);
        setAccessories(a);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar dados"));
  }, []);

  useEffect(() => {
    if (!pickup || !due || new Date(due) <= new Date(pickup)) return;
    let cancelled = false;
    setLoadingAvailability(true);
    blockedRadioIdsForPeriod(new Date(pickup).toISOString(), new Date(due).toISOString())
      .then((ids) => {
        if (cancelled) return;
        setBlocked(ids);
        setSelected((current) => current.filter((id) => !ids.has(id)));
      })
      .catch((e) => !cancelled && toast.error(e instanceof Error ? e.message : "Erro ao verificar disponibilidade"))
      .finally(() => !cancelled && setLoadingAvailability(false));
    return () => {
      cancelled = true;
    };
  }, [pickup, due]);

  const available = useMemo(
    () =>
      radios.filter(
        (r) =>
          !["maintenance", "lost", "inactive"].includes(r.status) &&
          !blocked.has(r.id),
      ),
    [radios, blocked],
  );

  const accTotal = Object.entries(acc).reduce(
    (sum, [id, q]) => sum + Number(accessories.find((a) => a.id === id)?.unit_cost || 0) * q,
    0,
  );
  const subtotal = Math.max(0, radioValue) + accTotal;
  const total = Math.max(0, subtotal - discount + surcharge);
  const client = clients.find((c) => c.id === clientId);
  const selectedRadios = radios.filter((r) => selected.includes(r.id));

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  function next() {
    if (step === 0) {
      if (!clientId || !pickup || !due) return toast.error("Selecione o cliente e o período");
      if (new Date(due) <= new Date(pickup)) return toast.error("A devolução precisa ser posterior à retirada");
    }
    if (step === 1 && !selected.length) return toast.error("Selecione pelo menos um rádio");
    setStep((s) => Math.min(2, s + 1));
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const normalizedPayment = total > 0 && deposit >= total ? "paid" : deposit > 0 ? "partial" : paymentStatus;
      await createRentalOperational({
        client_id: clientId,
        event_name: eventName.trim() || null,
        pickup_at: new Date(pickup).toISOString(),
        due_at: new Date(due).toISOString(),
        subtotal,
        discount,
        surcharge,
        total,
        payment_status: normalizedPayment,
        payment_method: paymentMethod || null,
        deposit_amount: Math.min(Math.max(deposit, 0), total),
        notes: notes.trim() || null,
        radioIds: selected,
        accessories: Object.entries(acc)
          .filter(([, q]) => q > 0)
          .map(([id, q]) => ({
            id,
            quantity: q,
            unit_rate: Number(accessories.find((a) => a.id === id)?.unit_cost || 0),
          })),
      });
      toast.success("Locação criada com sucesso");
      navigate({ to: "/locacoes" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar locação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Nova Locação">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/locacoes"><ArrowLeft className="h-4 w-4" /> Voltar para locações</Link>
      </Button>
      <PageHeader title="Nova locação" subtitle="Cliente, período, equipamentos e financeiro em um único fluxo" />

      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${i === step ? "border-primary bg-primary/10 font-semibold" : i < step ? "border-success/30 bg-success/10 text-success" : "border-border bg-card text-muted-foreground"}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i <= step ? "gradient-brand text-primary-foreground" : "bg-muted"}`}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className="truncate">{s}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <div className="surface-panel space-y-5 p-4 lg:p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between gap-2"><Label>Cliente</Label><Button asChild variant="ghost" size="sm"><Link to="/clientes"><UserPlus className="h-3.5 w-3.5" /> Novo cliente</Link></Button></div>
                <Select value={clientId} onValueChange={setClientId}><SelectTrigger className="h-11"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger><SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                {!clients.length && <p className="text-xs text-destructive">Cadastre um cliente antes de criar a locação.</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Evento / referência</Label><Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Ex.: Show, congresso, casamento" className="h-11" /></div>
              <div className="space-y-1.5"><Label>Retirada</Label><Input type="datetime-local" value={pickup} onChange={(e) => setPickup(e.target.value)} className="h-11" /></div>
              <div className="space-y-1.5"><Label>Devolução prevista</Label><Input type="datetime-local" value={due} min={pickup} onChange={(e) => setDue(e.target.value)} className="h-11" /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between"><h3 className="font-display text-base font-bold">Rádios disponíveis no período</h3><Badge tone="success">{loadingAvailability ? "Verificando..." : `${available.length} livres`}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">A disponibilidade considera outras locações nas datas escolhidas.</p>
                <div className="mt-3 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
                  {available.map((r) => {
                    const on = selected.includes(r.id);
                    return <button key={r.id} type="button" onClick={() => toggle(r.id)} className={`rounded-xl border p-3 text-left ${on ? "border-primary bg-primary/12" : "border-border bg-card hover:border-primary/40"}`}>
                      <span className="flex items-center justify-between"><span className="font-display text-sm font-bold">{r.code}</span>{on ? <Check className="h-4 w-4 text-primary" /> : <RadioTower className="h-4 w-4 text-muted-foreground" />}</span>
                      <span className="mt-1 block truncate text-[0.7rem] text-muted-foreground">{r.radio_models ? `${r.radio_models.manufacturer} ${r.radio_models.model}` : "Sem modelo"}</span>
                      <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-bold">{r.band}</span>
                    </button>;
                  })}
                </div>
                {!available.length && <p className="mt-4 text-sm text-muted-foreground">Não há rádios livres para este período. Ajuste as datas ou libere equipamentos.</p>}
              </div>

              <div>
                <h3 className="font-display text-base font-bold">Acessórios</h3>
                <div className="mt-3 space-y-2">
                  {accessories.map((a) => {
                    const q = acc[a.id] || 0;
                    return <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                      <div><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.stock_total} em estoque · {brlExact(Number(a.unit_cost || 0))}/un</p></div>
                      <div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" onClick={() => setAcc((p) => ({ ...p, [a.id]: Math.max(0, q - 1) }))}>−</Button><span className="w-8 text-center text-sm font-semibold">{q}</span><Button type="button" variant="outline" size="icon" disabled={q >= a.stock_total} onClick={() => setAcc((p) => ({ ...p, [a.id]: q + 1 }))}>+</Button></div>
                    </div>;
                  })}
                  {!accessories.length && <p className="text-sm text-muted-foreground">Nenhum acessório cadastrado. Você pode cadastrá-los em Configurações.</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Valor dos rádios</Label><Input type="number" min="0" step="0.01" value={radioValue || ""} onChange={(e) => setRadioValue(Number(e.target.value))} className="h-11" /></div>
              <div className="space-y-1.5"><Label>Desconto</Label><Input type="number" min="0" step="0.01" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} className="h-11" /></div>
              <div className="space-y-1.5"><Label>Acréscimo</Label><Input type="number" min="0" step="0.01" value={surcharge || ""} onChange={(e) => setSurcharge(Number(e.target.value))} className="h-11" /></div>
              <div className="space-y-1.5"><Label>Entrada já recebida</Label><Input type="number" min="0" max={total || undefined} step="0.01" value={deposit || ""} onChange={(e) => setDeposit(Number(e.target.value))} className="h-11" /></div>
              <div className="space-y-1.5"><Label>Forma de pagamento</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="transferencia">Transferência</SelectItem><SelectItem value="boleto">Boleto / empenho</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Situação</Label><Select value={paymentStatus} onValueChange={setPaymentStatus}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="paid">Pago</SelectItem><SelectItem value="pending">A receber</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
            </div>
          )}

          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}><ArrowLeft className="h-4 w-4" /> Voltar</Button>
            {step < 2 ? <Button variant="hero" onClick={next}>Continuar <ArrowRight className="h-4 w-4" /></Button> : <Button variant="hero" onClick={save} disabled={busy || !selected.length}>{busy ? "Criando..." : "Confirmar locação"} <Check className="h-4 w-4" /></Button>}
          </div>
        </div>

        <aside className="surface-panel h-fit p-4 lg:sticky lg:top-24">
          <h3 className="font-display text-sm font-bold">Resumo</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Summary label="Cliente" value={client?.name || "Não selecionado"} />
            <Summary label="Período" value={pickup && due ? `${new Date(pickup).toLocaleDateString("pt-BR")} → ${new Date(due).toLocaleDateString("pt-BR")}` : "—"} />
            <Summary label="Rádios" value={String(selected.length)} />
            <Summary label="Faixas" value={[...new Set(selectedRadios.map((r) => r.band))].join(" / ") || "—"} />
            <Summary label="Acessórios" value={String(Object.values(acc).reduce((s, q) => s + q, 0))} />
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <Summary label="Subtotal" value={brlExact(subtotal)} />
            <Summary label="Desconto" value={`− ${brlExact(discount)}`} />
            <Summary label="Acréscimo" value={`+ ${brlExact(surcharge)}`} />
            <div className="flex items-end justify-between gap-3 pt-2"><span className="font-semibold">Total</span><span className="font-display text-xl font-extrabold">{brlExact(total)}</span></div>
            {deposit > 0 && <p className="rounded-lg bg-success/10 p-2 text-xs text-success">Entrada recebida: {brlExact(Math.min(deposit, total))} · saldo: {brlExact(Math.max(total - deposit, 0))}</p>}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="max-w-[60%] text-right font-medium">{value}</span></div>;
}
