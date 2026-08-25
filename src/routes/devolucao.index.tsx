import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, QrCode } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, EmptyState } from "@/components/app/PageHeader";
import { RentalStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { toRentalStatus } from "@/lib/live-data";
import { listRentalsOperational, type OperationalRental } from "@/lib/operations";

export const Route = createFileRoute("/devolucao/")({ component: ReturnList });

function ReturnList() {
  const [items, setItems] = useState<OperationalRental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRentalsOperational()
      .then((r) => setItems(r.filter((x) => ["active", "late"].includes(x.status))))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar devoluções"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Devolução">
      <PageHeader
        title="Devolução e conferência"
        subtitle="Confira rádios e acessórios antes de encerrar a locação"
        actions={<Button variant="outline" disabled><QrCode className="h-4 w-4" /> Leitura QR em breve</Button>}
      />
      {!loading && items.length === 0 ? (
        <EmptyState title="Nada para devolver" description="Não há locações ativas ou atrasadas neste momento." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((r) => (
            <Link key={r.id} to="/devolucao/$rentalId" params={{ rentalId: r.code }} className="surface-panel block p-4 transition-shadow hover:shadow-[var(--shadow-card)]">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{r.clients?.name || "Cliente"}</p><p className="truncate text-xs text-muted-foreground">{r.code} · {r.event_name || "Sem evento"}</p></div>
                <RentalStatusBadge status={toRentalStatus(r.status)} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{r.rental_radios?.length || 0} rádios · {r.rental_accessories?.reduce((sum, a) => sum + a.quantity, 0) || 0} acessórios · prevista para {new Date(r.due_at).toLocaleString("pt-BR")}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Iniciar conferência <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
