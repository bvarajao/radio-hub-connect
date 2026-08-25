import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { accessories, brlExact, clients, radios } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/locacoes/nova")({
  head: () => ({
    meta: [
      { title: "Nova Locação | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Registre uma nova locação em poucos passos: cliente, período, rádios disponíveis, acessórios e pagamento.",
      },
      { property: "og:title", content: "Nova Locação — Papo de Produtor" },
      {
        property: "og:description",
        content: "Fluxo rápido de criação de locação de rádios comunicadores.",
      },
    ],
  }),
  component: NewRental,
});

const steps = ["Cliente e período", "Rádios e acessórios", "Valores e confirmação"];

function NewRental() {
  const [step, setStep] = useState(0);
  const [cliente, setCliente] = useState("");
  const [evento, setEvento] = useState("");
  const [retirada, setRetirada] = useState("2026-08-26T08:00");
  const [devolucao, setDevolucao] = useState("2026-08-28T18:00");
  const [selected, setSelected] = useState<string[]>([]);
  const [acessorios, setAcessorios] = useState<Record<string, number>>({});
  const [valor, setValor] = useState(0);
  const [ajuste, setAjuste] = useState(0);
  const [formaPagto, setFormaPagto] = useState("pix");
  const [situacao, setSituacao] = useState("a_receber");
  const [obs, setObs] = useState("");

  const disponiveis = useMemo(() => radios.filter((r) => r.status === "disponivel"), []);

  const acessoriosTotal = Object.entries(acessorios).reduce((sum, [id, qtd]) => {
    const acc = accessories.find((a) => a.id === id);
    return sum + (acc ? acc.valor * qtd : 0);
  }, 0);
  const baseRadios = valor || selected.length * 120;
  const total = baseRadios + acessoriosTotal + ajuste;

  const toggle = (codigo: string) =>
    setSelected((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
    );

  return (
    <AppShell title="Nova Locação">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/locacoes">
          <ArrowLeft className="h-4 w-4" /> Voltar para locações
        </Link>
      </Button>

      <PageHeader title="Nova locação" subtitle="Três etapas simples, sem burocracia" />

      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
              i === step
                ? "border-primary bg-primary/10 font-semibold text-accent-foreground"
                : i < step
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-card text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                i <= step ? "gradient-brand text-primary-foreground" : "bg-muted",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="min-w-0 truncate">{s}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <div className="surface-panel space-y-5 p-4 lg:p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Cliente</Label>
                <Select value={cliente} onValueChange={setCliente}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="evento">Evento / referência</Label>
                <Input
                  id="evento"
                  className="h-11"
                  placeholder="Ex.: Festival Verão Beira-Mar"
                  value={evento}
                  onChange={(e) => setEvento(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retirada">Retirada</Label>
                <Input
                  id="retirada"
                  type="datetime-local"
                  className="h-11"
                  value={retirada}
                  onChange={(e) => setRetirada(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="devolucao">Devolução prevista</Label>
                <Input
                  id="devolucao"
                  type="datetime-local"
                  className="h-11"
                  value={devolucao}
                  onChange={(e) => setDevolucao(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <h3 className="min-w-0 truncate font-display text-base font-bold">
                    Rádios disponíveis
                  </h3>
                  <Badge tone="success">{disponiveis.length} livres</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Toque para selecionar. Apenas equipamentos disponíveis aparecem aqui.
                </p>
                <div className="mt-3 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                  {disponiveis.map((r) => {
                    const on = selected.includes(r.codigo);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggle(r.codigo)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          on
                            ? "border-primary bg-primary/12 shadow-[var(--shadow-soft)]"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold">{r.codigo}</span>
                          {on ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <RadioTower className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                        <span className="mt-1 block truncate text-[0.7rem] text-muted-foreground">
                          {r.modelo}
                        </span>
                        <span className="mt-0.5 block text-[0.7rem] text-muted-foreground">
                          Bateria {r.bateria}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-display text-base font-bold">Acessórios</h3>
                <div className="mt-3 space-y-2">
                  {accessories.map((a) => {
                    const qtd = acessorios[a.id] ?? 0;
                    return (
                      <div
                        key={a.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.estoque} em estoque · {brlExact(a.valor)} / un
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setAcessorios((p) => ({ ...p, [a.id]: Math.max(0, qtd - 1) }))
                            }
                          >
                            −
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{qtd}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setAcessorios((p) => ({ ...p, [a.id]: qtd + 1 }))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor da locação (rádios)</Label>
                <Input
                  id="valor"
                  type="number"
                  className="h-11"
                  placeholder={String(selected.length * 120)}
                  value={valor || ""}
                  onChange={(e) => setValor(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ajuste">Desconto (−) / acréscimo (+)</Label>
                <Input
                  id="ajuste"
                  type="number"
                  className="h-11"
                  value={ajuste || ""}
                  onChange={(e) => setAjuste(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={formaPagto} onValueChange={setFormaPagto}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="cartao">Cartão de crédito</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto / empenho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Situação</Label>
                <Select value={situacao} onValueChange={setSituacao}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="a_receber">A receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  rows={3}
                  placeholder="Instruções de retirada, contato no local, etc."
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            {step < 2 ? (
              <Button variant="hero" onClick={() => setStep((s) => s + 1)}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={() => toast.success("Locação criada com sucesso (demonstração)")}
              >
                <Check className="h-4 w-4" /> Confirmar locação
              </Button>
            )}
          </div>
        </div>

        <aside className="surface-panel h-fit space-y-4 p-5 lg:sticky lg:top-20">
          <h3 className="font-display text-base font-bold">Resumo</h3>
          <div className="space-y-2 text-sm">
            <Line label="Cliente" value={cliente || "—"} />
            <Line label="Evento" value={evento || "—"} />
            <Line label="Retirada" value={retirada.replace("T", " ")} />
            <Line label="Devolução" value={devolucao.replace("T", " ")} />
            <Line label="Rádios" value={`${selected.length} selecionados`} />
            <Line
              label="Acessórios"
              value={`${Object.values(acessorios).reduce((a, b) => a + b, 0)} itens`}
            />
          </div>
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <Line label="Locação" value={brlExact(baseRadios)} />
            <Line label="Acessórios" value={brlExact(acessoriosTotal)} />
            <Line label="Ajuste" value={brlExact(ajuste)} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/12 px-3 py-3">
            <span className="text-sm font-semibold text-accent-foreground">Total</span>
            <span className="font-display text-xl font-extrabold text-accent-foreground">
              {brlExact(total)}
            </span>
          </div>
          {selected.length > 0 && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {selected.join(" · ")}
            </p>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="truncate text-right font-medium">{value}</span>
  </div>
);
