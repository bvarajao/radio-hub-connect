import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, Check, CircleAlert, CircleX } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { radios, rentals } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devolucao/$rentalId")({
  head: ({ params }) => ({
    meta: [
      { title: `Conferência ${params.rentalId} | Papo de Produtor` },
      {
        name: "description",
        content: `Conferência de devolução da locação ${params.rentalId}: marque cada rádio como OK, avariado ou faltando.`,
      },
      { property: "og:title", content: `Conferência de devolução ${params.rentalId}` },
      {
        property: "og:description",
        content: "Checklist item por item para fechar a devolução da locação.",
      },
    ],
  }),
  component: ReturnCheck,
});

type Estado = "ok" | "avariado" | "faltando" | null;

function ReturnCheck() {
  const { rentalId } = Route.useParams();
  const rental = rentals.find((r) => r.numero === rentalId) ?? rentals[0]!;
  const itens = radios.slice(0, rental.qtdRadios);

  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const conferidos = Object.values(estados).filter(Boolean).length;

  const set = (codigo: string, e: Estado) => setEstados((p) => ({ ...p, [codigo]: e }));

  return (
    <AppShell title="Conferência">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/devolucao">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <PageHeader
        title={`Devolução ${rental.numero}`}
        subtitle={`${rental.cliente} · ${rental.evento}`}
      />

      <div className="surface-panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {conferidos} de {itens.length} equipamentos conferidos
          </p>
          <p className="text-xs text-muted-foreground">Previsão: {rental.devolucao}</p>
        </div>
        <Button variant="soft" size="sm">
          <Camera className="h-4 w-4" /> Escanear
        </Button>
      </div>

      <div className="surface-panel flex items-center gap-3 border-dashed p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary">
          <Camera className="h-5 w-5 text-muted-foreground" />
        </span>
        <p className="min-w-0 text-xs text-muted-foreground">
          Área reservada para leitura de QR Code pela câmera do celular — em breve a conferência será
          automática.
        </p>
      </div>

      <div className="space-y-2.5">
        {itens.map((r) => {
          const estado = estados[r.codigo] ?? null;
          return (
            <div key={r.id} className="surface-panel p-3.5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold">{r.codigo}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.modelo}</p>
                </div>
                {estado && (
                  <Badge
                    tone={estado === "ok" ? "success" : estado === "avariado" ? "warning" : "danger"}
                  >
                    {estado === "ok" ? "OK" : estado === "avariado" ? "Avariado" : "Faltando"}
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <CheckButton
                  active={estado === "ok"}
                  tone="ok"
                  icon={Check}
                  label="OK"
                  onClick={() => set(r.codigo, "ok")}
                />
                <CheckButton
                  active={estado === "avariado"}
                  tone="warn"
                  icon={CircleAlert}
                  label="Avariado"
                  onClick={() => set(r.codigo, "avariado")}
                />
                <CheckButton
                  active={estado === "faltando"}
                  tone="bad"
                  icon={CircleX}
                  label="Faltando"
                  onClick={() => set(r.codigo, "faltando")}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-panel space-y-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="acessorios">Acessórios faltantes</Label>
          <Textarea id="acessorios" rows={2} placeholder="Ex.: 2 baterias extras e 1 fone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avarias">Avarias e observações</Label>
          <Textarea id="avarias" rows={3} placeholder="Descreva o que foi identificado na conferência" />
        </div>
      </div>

      <div className="sticky bottom-20 z-20 lg:bottom-4">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={() => toast.success("Devolução finalizada (demonstração)")}
        >
          <Check className="h-5 w-5" /> Finalizar devolução
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
    warn: "border-warning/50 text-warning-foreground data-[on=true]:bg-warning data-[on=true]:text-warning-foreground",
    bad: "border-destructive/40 text-destructive data-[on=true]:bg-destructive data-[on=true]:text-destructive-foreground",
  }[tone];

  return (
    <button
      data-on={active}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors",
        styles,
        !active && "bg-card hover:bg-secondary",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
