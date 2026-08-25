import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Check, CircleAlert, CircleX, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getRentalOperational,
  saveReturnOperational,
  type OperationalRental,
} from "@/lib/operations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devolucao/$rentalId")({ component: ReturnCheck });
type Estado = "ok" | "damaged" | "missing";

function ReturnCheck() {
  const { rentalId } = Route.useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState<OperationalRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, Estado>>({});
  const [accessoryReturns, setAccessoryReturns] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRentalOperational(rentalId)
      .then((value) => {
        setRental(value);
        if (value) {
          setAccessoryReturns(
            Object.fromEntries(
              (value.rental_accessories || []).map((a) => [a.accessory_id, a.quantity]),
            ),
          );
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar locação"))
      .finally(() => setLoading(false));
  }, [rentalId]);

  const radios = useMemo(() => rental?.rental_radios || [], [rental]);
  const accessories = useMemo(() => rental?.rental_accessories || [], [rental]);
  const checked = Object.keys(states).length;
  const accessoryMissing = accessories.reduce(
    (sum, a) => sum + Math.max(0, a.quantity - (accessoryReturns[a.accessory_id] ?? a.quantity)),
    0,
  );

  if (!loading && !rental)
    return (
      <AppShell title="Conferência">
        <EmptyState
          title="Locação não encontrada"
          description="Não foi possível localizar esta locação."
          action={
            <Button asChild>
              <Link to="/devolucao">Voltar</Link>
            </Button>
          }
        />
      </AppShell>
    );
  if (!rental)
    return (
      <AppShell title="Conferência">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </AppShell>
    );

  if (["returned", "cancelled"].includes(rental.status))
    return (
      <AppShell title="Conferência">
        <EmptyState
          title="Locação já encerrada"
          description={
            rental.status === "returned"
              ? "A devolução desta locação já foi finalizada."
              : "Esta locação foi cancelada."
          }
          action={
            <Button asChild>
              <Link to="/locacoes">Voltar às locações</Link>
            </Button>
          }
        />
      </AppShell>
    );

  async function finish() {
    if (busy) return;
    if (checked !== radios.length) return toast.error("Confira todos os rádios antes de finalizar");
    for (const accessory of accessories) {
      const returned = accessoryReturns[accessory.accessory_id];
      if (returned == null || returned < 0 || returned > accessory.quantity) {
        return toast.error(`Confira a quantidade de ${accessory.accessories?.name || "acessório"}`);
      }
    }
    setBusy(true);
    try {
      await saveReturnOperational(rental, states, accessoryReturns, notes.trim());
      toast.success(
        accessoryMissing
          ? `Devolução finalizada com ${accessoryMissing} acessório(s) faltando`
          : "Devolução finalizada com sucesso",
      );
      navigate({ to: "/devolucao" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao finalizar devolução");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Conferência">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/devolucao">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>
      <PageHeader
        title={`Devolução ${rental.code}`}
        subtitle={`${rental.clients?.name || "Cliente"} · ${rental.event_name || "Sem evento"}`}
      />

      <div className="surface-panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">
            {checked} de {radios.length} rádios conferidos
          </p>
          <p className="text-xs text-muted-foreground">
            Previsto: {new Date(rental.due_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <Button variant="soft" size="sm" disabled>
          <Camera className="h-4 w-4" /> QR em breve
        </Button>
      </div>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Rádios</h2>
          <span className="text-xs text-muted-foreground">Marque a condição de cada unidade</span>
        </div>
        {radios.map((rr) => {
          const current = states[rr.radio_id];
          return (
            <div key={rr.radio_id} className="surface-panel p-3.5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <div>
                  <p className="font-display text-sm font-bold">{rr.radios?.code || "Rádio"}</p>
                  <p className="text-xs text-muted-foreground">Selecione a condição de retorno</p>
                </div>
                {current && (
                  <Badge
                    tone={
                      current === "ok" ? "success" : current === "damaged" ? "warning" : "danger"
                    }
                  >
                    {current === "ok" ? "OK" : current === "damaged" ? "Avariado" : "Faltando"}
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <CheckButton
                  active={current === "ok"}
                  tone="ok"
                  icon={Check}
                  label="OK"
                  onClick={() => setStates((p) => ({ ...p, [rr.radio_id]: "ok" }))}
                />
                <CheckButton
                  active={current === "damaged"}
                  tone="warn"
                  icon={CircleAlert}
                  label="Avariado"
                  onClick={() => setStates((p) => ({ ...p, [rr.radio_id]: "damaged" }))}
                />
                <CheckButton
                  active={current === "missing"}
                  tone="bad"
                  icon={CircleX}
                  label="Faltando"
                  onClick={() => setStates((p) => ({ ...p, [rr.radio_id]: "missing" }))}
                />
              </div>
            </div>
          );
        })}
        {radios.length === 0 && (
          <p className="surface-panel p-8 text-center text-sm text-muted-foreground">
            Esta locação não possui rádios vinculados.
          </p>
        )}
      </section>

      {accessories.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Acessórios</h2>
            {accessoryMissing > 0 ? (
              <Badge tone="danger">{accessoryMissing} faltando</Badge>
            ) : (
              <Badge tone="success">Conferidos</Badge>
            )}
          </div>
          <div className="surface-panel divide-y divide-border overflow-hidden">
            {accessories.map((a) => {
              const returned = accessoryReturns[a.accessory_id] ?? a.quantity;
              return (
                <div
                  key={a.accessory_id}
                  className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <PackageCheck className="h-4 w-4" /> {a.accessories?.name || "Acessório"}
                    </p>
                    <p className="text-xs text-muted-foreground">Enviados: {a.quantity}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Devolvidos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={a.quantity}
                      value={returned}
                      onChange={(e) =>
                        setAccessoryReturns((p) => ({
                          ...p,
                          [a.accessory_id]: Math.min(
                            a.quantity,
                            Math.max(0, Number(e.target.value || 0)),
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="surface-panel p-4">
        <Label>Observações da devolução</Label>
        <Textarea
          className="mt-2"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Avarias, itens faltantes ou observações gerais"
        />
      </div>

      <div className="sticky bottom-20 z-20 lg:bottom-4">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          disabled={busy || !radios.length}
          onClick={finish}
        >
          <Check className="h-5 w-5" /> {busy ? "Finalizando..." : "Finalizar devolução"}
        </Button>
      </div>
    </AppShell>
  );
}

function CheckButton({
  active,
  tone,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  tone: "ok" | "warn" | "bad";
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  const styles = {
    ok: "border-success/40 text-success data-[on=true]:bg-success data-[on=true]:text-success-foreground",
    warn: "border-warning/50 text-warning-foreground data-[on=true]:bg-warning",
    bad: "border-destructive/40 text-destructive data-[on=true]:bg-destructive data-[on=true]:text-destructive-foreground",
  }[tone];
  return (
    <button
      type="button"
      data-on={active}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold",
        styles,
        !active && "bg-card hover:bg-secondary",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
