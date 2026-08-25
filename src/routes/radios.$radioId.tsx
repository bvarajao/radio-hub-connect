import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BatteryFull, MapPin, QrCode, Wrench } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge, RadioStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { radioHistory, radios } from "@/lib/mock-data";

export const Route = createFileRoute("/radios/$radioId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.radioId} | Rádios — Papo de Produtor` },
      {
        name: "description",
        content: `Detalhes do equipamento ${params.radioId}: status, bateria, localização e histórico de locações e manutenções.`,
      },
      { property: "og:title", content: `Equipamento ${params.radioId}` },
      {
        property: "og:description",
        content: "Ficha completa do rádio comunicador com histórico de uso.",
      },
    ],
  }),
  component: RadioDetail,
});

function RadioDetail() {
  const { radioId } = Route.useParams();
  const radio = radios.find((r) => r.codigo === radioId) ?? radios[0]!;

  return (
    <AppShell title={radio.codigo}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/radios">
          <ArrowLeft className="h-4 w-4" /> Voltar para rádios
        </Link>
      </Button>

      <PageHeader
        title={radio.codigo}
        subtitle={`${radio.modelo} · Nº de série ${radio.serie}`}
        actions={
          <>
            <Button variant="outline">
              <Wrench className="h-4 w-4" /> Enviar p/ manutenção
            </Button>
            <Button variant="hero">Editar equipamento</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
            <Info label="Status">
              <RadioStatusBadge status={radio.status} />
            </Info>
            <Info label="Bateria">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BatteryFull className="h-4 w-4 text-success" /> {radio.bateria}%
              </span>
            </Info>
            <Info label="Localização">
              <span className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" /> {radio.local}
              </span>
            </Info>
            <Info label="Observação">
              <span className="text-sm text-muted-foreground">
                {radio.observacao ?? "Sem observações registradas."}
              </span>
            </Info>
          </div>

          <div className="surface-panel p-5">
            <h2 className="font-display text-base font-bold">Histórico do equipamento</h2>
            <ul className="mt-4 space-y-4">
              {radioHistory.map((h, i) => (
                <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 border-b border-border pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{h.tipo}</span>
                      <Badge tone={h.tipo === "Manutenção" ? "warning" : "muted"}>{h.data}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{h.detalhe}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-panel flex flex-col items-center gap-3 p-6 text-center">
            <div className="grid h-32 w-32 place-items-center rounded-xl border-2 border-dashed border-border bg-secondary/50">
              <QrCode className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">QR Code individual</p>
            <p className="text-xs text-muted-foreground">
              Espaço reservado para a etiqueta de identificação e conferência por câmera.
            </p>
            <Button variant="soft" className="w-full" disabled>
              Gerar etiqueta (em breve)
            </Button>
          </div>

          <div className="surface-panel space-y-3 p-5">
            <h3 className="font-display text-sm font-bold">Utilização</h3>
            <Row label="Locações realizadas" value="27" />
            <Row label="Dias em campo (ano)" value="94" />
            <Row label="Manutenções" value="3" />
            <Row label="Receita gerada" value="R$ 8.640" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const Info = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
    <div className="mt-1.5">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
