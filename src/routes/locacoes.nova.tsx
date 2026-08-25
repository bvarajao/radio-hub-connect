import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RadioTower } from "lucide-react";
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
  createRental,
  listAccessories,
  listClients,
  listRadios,
  type DbAccessory,
  type DbClient,
  type DbRadio,
} from "@/lib/live-data";

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
  const [radios, setRadios] = useState<DbRadio[]>([]);
  const [accessories, setAccessories] = useState<DbAccessory[]>([]);
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
        setRadios(r);
        setAccessories(a);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar dados"));
  }, []);
  const available = useMemo(() => radios.filter((r) => r.status === "available"), [radios]);
  const accTotal = Object.entries(acc).reduce(
    (sum, [id, q]) => sum + Number(accessories.find((a) => a.id === id)?.unit_cost || 0) * q,
    0,
  );
  const subtotal = Math.max(0, radioValue) + accTotal;
  const total = Math.max(0, subtotal - discount + surcharge);
  const client = clients.find((c) => c.id === clientId);
  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  function next() {
    if (step === 0 && (!clientId || !pickup || !due)) {
      toast.error("Selecione o cliente e o período");
      return;
    }
    if (step === 1 && !selected.length) {
      toast.error("Selecione pelo menos um rádio");
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  }
  async function save() {
    setBusy(true);
    try {
      await createRental({
        client_id: clientId,
        event_name: eventName || null,
        pickup_at: new Date(pickup).toISOString(),
        due_at: new Date(due).toISOString(),
        status: new Date(pickup) > new Date() ? "reserved" : "active",
        subtotal,
        discount,
        surcharge,
        total,
        payment_status: paymentStatus,
        payment_method: paymentMethod || null,
        deposit_amount: deposit,
        notes: notes || null,
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
        <Link to="/locacoes">
          <ArrowLeft className="h-4 w-4" /> Voltar para locações
        </Link>
      </Button>
      <PageHeader
        title="Nova locação"
        subtitle="Três etapas simples para colocar os equipamentos em campo"
      />
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${i === step ? "border-primary bg-primary/10 font-semibold" : i < step ? "border-success/30 bg-success/10 text-success" : "border-border bg-card text-muted-foreground"}`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i <= step ? "gradient-brand text-primary-foreground" : "bg-muted"}`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="truncate">{s}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <div className="surface-panel space-y-5 p-4 lg:p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Cliente</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!clients.length && (
                  <p className="text-xs text-destructive">
                    Cadastre um cliente antes de criar a locação.
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Evento / referência</Label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ex.: Show, congresso, casamento"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Retirada</Label>
                <Input
                  type="datetime-local"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Devolução prevista</Label>
                <Input
                  type="datetime-local"
                  value={due}
                  min={pickup}
                  onChange={(e) => setDue(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold">Rádios disponíveis</h3>
                  <Badge tone="success">{available.length} livres</Badge>
                </div>
                <div className="mt-3 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
                  {available.map((r) => {
                    const on = selected.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggle(r.id)}
                        className={`rounded-xl border p-3 text-left ${on ? "border-primary bg-primary/12" : "border-border bg-card hover:border-primary/40"}`}
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold">{r.code}</span>
                          {on ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <RadioTower className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                        <span className="mt-1 block truncate text-[0.7rem] text-muted-foreground">
                          {r.radio_models
                            ? `${r.radio_models.manufacturer} ${r.radio_models.model}`
                            : "Sem modelo"}
                        </span>
                        <span className="block text-[0.7rem] text-muted-foreground">
                          Bateria {r.battery_level ?? "—"}%
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!available.length && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Não há rádios disponíveis no estoque.
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-display text-base font-bold">Acessórios</h3>
                <div className="mt-3 space-y-2">
                  {accessories.map((a) => {
                    const q = acc[a.id] || 0;
                    return (
                      <div
                        key={a.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{a.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.stock_total} em estoque · {brlExact(Number(a.unit_cost || 0))}/un
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setAcc((p) => ({ ...p, [a.id]: Math.max(0, q - 1) }))}
                          >
                            −
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{q}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={q >= a.stock_total}
                            onClick={() => setAcc((p) => ({ ...p, [a.id]: q + 1 }))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {!accessories.length && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum acessório cadastrado ainda.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Valor dos rádios</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={radioValue || ""}
                  onChange={(e) => setRadioValue(Number(e.target.value))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Desconto</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Acréscimo</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={surcharge || ""}
                  onChange={(e) => setSurcharge(Number(e.target.value))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Entrada recebida</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deposit || ""}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="pending">A receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            {step < 2 ? (
              <Button variant="hero" onClick={next}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" disabled={busy} onClick={save}>
                <Check className="h-4 w-4" /> {busy ? "Salvando..." : "Confirmar locação"}
              </Button>
            )}
          </div>
        </div>

        <aside className="surface-panel h-fit space-y-4 p-5 lg:sticky lg:top-20">
          <h3 className="font-display text-base font-bold">Resumo</h3>
          <Line label="Cliente" value={client?.name || "—"} />
          <Line label="Evento" value={eventName || "—"} />
          <Line label="Rádios" value={`${selected.length} selecionados`} />
          <Line
            label="Acessórios"
            value={`${Object.values(acc).reduce((a, b) => a + b, 0)} itens`}
          />
          <div className="border-t border-border pt-3">
            <Line label="Rádios" value={brlExact(radioValue)} />
            <Line label="Acessórios" value={brlExact(accTotal)} />
            <Line label="Desconto" value={`- ${brlExact(discount)}`} />
            <Line label="Acréscimo" value={brlExact(surcharge)} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/12 px-3 py-3">
            <b>Total</b>
            <span className="font-display text-xl font-extrabold">{brlExact(total)}</span>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}
