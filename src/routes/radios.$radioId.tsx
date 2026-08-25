import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BatteryFull, MapPin, QrCode, Wrench } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, EmptyState } from "@/components/app/PageHeader";
import { Badge, RadioStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  getRadioByCode,
  listMaintenanceForRadio,
  toRadioStatus,
  type DbMaintenance,
  type DbRadio,
} from "@/lib/live-data";
import { brlExact } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/radios/$radioId")({ component: RadioDetail });

function RadioDetail() {
  const { radioId } = Route.useParams();
  const [radio, setRadio] = useState<DbRadio | null>(null);
  const [maintenance, setMaintenance] = useState<DbMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getRadioByCode(radioId)
      .then(async (r) => {
        setRadio(r);
        if (r) setMaintenance(await listMaintenanceForRadio(r.id));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar rádio"))
      .finally(() => setLoading(false));
  }, [radioId]);
  if (!loading && !radio)
    return (
      <AppShell title="Rádio">
        <EmptyState
          title="Rádio não encontrado"
          description="Este equipamento não existe ou não pertence à sua empresa."
          action={
            <Button asChild>
              <Link to="/radios">Voltar</Link>
            </Button>
          }
        />
      </AppShell>
    );
  if (!radio)
    return (
      <AppShell title="Rádio">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </AppShell>
    );
  const model = radio.radio_models
    ? `${radio.radio_models.manufacturer} ${radio.radio_models.model}`
    : "Sem modelo definido";
  return (
    <AppShell title={radio.code}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/radios">
          <ArrowLeft className="h-4 w-4" /> Voltar para rádios
        </Link>
      </Button>
      <PageHeader
        title={radio.code}
        subtitle={`${model}${radio.serial_number ? ` · Série ${radio.serial_number}` : ""}`}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="surface-panel grid gap-5 p-5 sm:grid-cols-2">
            <Info label="Status">
              <RadioStatusBadge status={toRadioStatus(radio.status)} />
            </Info>
            <Info label="Bateria">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BatteryFull className="h-4 w-4 text-success" />
                {radio.battery_level ?? "—"}%{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({radio.battery_status})
                </span>
              </span>
            </Info>
            <Info label="Localização">
              <span className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {radio.location || "Não informada"}
              </span>
            </Info>
            <Info label="Observações">
              <span className="text-sm text-muted-foreground">
                {radio.notes || "Sem observações."}
              </span>
            </Info>
          </div>
          <div className="surface-panel p-5">
            <h2 className="font-display text-base font-bold">Histórico de manutenção</h2>
            <div className="mt-4 space-y-3">
              {maintenance.map((m) => (
                <div key={m.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{m.issue}</p>
                      <p className="text-xs text-muted-foreground">
                        Entrada {new Date(m.opened_at).toLocaleDateString("pt-BR")} ·{" "}
                        {m.technician || "Sem técnico"}
                      </p>
                    </div>
                    <Badge
                      tone={
                        m.status === "completed"
                          ? "success"
                          : m.status === "cancelled"
                            ? "muted"
                            : "warning"
                      }
                    >
                      {m.status === "completed"
                        ? "Concluída"
                        : m.status === "in_progress"
                          ? "Em reparo"
                          : m.status === "waiting_parts"
                            ? "Aguardando peça"
                            : m.status === "cancelled"
                              ? "Cancelada"
                              : "Aberta"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Custo: {brlExact(Number(m.cost || 0))}
                    {m.notes ? ` · ${m.notes}` : ""}
                  </p>
                </div>
              ))}
              {maintenance.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma manutenção registrada.
                </p>
              )}
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="surface-panel flex flex-col items-center gap-3 p-6 text-center">
            <div className="grid h-32 w-32 place-items-center rounded-xl border-2 border-dashed border-border bg-secondary/50">
              <QrCode className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">Identificação QR</p>
            <p className="break-all text-xs text-muted-foreground">
              {radio.qr_token || "Token gerado automaticamente pelo banco"}
            </p>
          </div>
          <div className="surface-panel p-5">
            <h3 className="font-display text-sm font-bold">Dados do equipamento</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Fabricante" value={radio.radio_models?.manufacturer || "—"} />
              <Row label="Modelo" value={radio.radio_models?.model || "—"} />
              <Row label="Faixa" value={radio.radio_models?.band || "—"} />
              <Row label="Série" value={radio.serial_number || "—"} />
              <Row
                label="Custo de compra"
                value={radio.purchase_cost != null ? brlExact(Number(radio.purchase_cost)) : "—"}
              />
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
