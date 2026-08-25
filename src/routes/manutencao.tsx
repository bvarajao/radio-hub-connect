import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
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
import { brlExact } from "@/lib/mock-data";
import { listMaintenance, listRadios, type DbMaintenance, type DbRadio } from "@/lib/live-data";
import {
  createMaintenanceOperational,
  removeMaintenanceRecord,
  updateMaintenanceRecord,
} from "@/lib/operations";

export const Route = createFileRoute("/manutencao")({ component: MaintenancePage });

const statusInfo: Record<string, { label: string; tone: "danger" | "warning" | "success" | "muted" }> = {
  open: { label: "Aberta", tone: "danger" },
  in_progress: { label: "Em reparo", tone: "warning" },
  waiting_parts: { label: "Aguardando peça", tone: "warning" },
  completed: { label: "Concluída", tone: "success" },
  cancelled: { label: "Cancelada", tone: "muted" },
};

function MaintenancePage() {
  const [items, setItems] = useState<DbMaintenance[]>([]);
  const [radios, setRadios] = useState<DbRadio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbMaintenance | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("open");

  const load = () =>
    Promise.all([listMaintenance(), listRadios()])
      .then(([m, r]) => {
        setItems(m);
        setRadios(r);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar manutenção"));

  useEffect(() => {
    void load();
  }, []);

  const current = items.filter((i) => !["completed", "cancelled"].includes(i.status));
  const metrics = useMemo(
    () => ({
      open: current.length,
      repair: current.filter((i) => i.status === "in_progress").length,
      done: items.filter((i) => i.status === "completed").length,
      cost: items.filter((i) => i.status !== "cancelled").reduce((s, i) => s + Number(i.cost || 0), 0),
    }),
    [items, current],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      const text = `${m.radios?.code || ""} ${m.issue} ${m.technician || ""}`.toLowerCase();
      const matchesStatus = filter === "all" || (filter === "open" ? !["completed", "cancelled"].includes(m.status) : m.status === filter);
      return (!q || text.includes(q)) && matchesStatus;
    });
  }, [items, query, filter]);

  async function complete(item: DbMaintenance) {
    try {
      await updateMaintenanceRecord(item.id, { status: "completed" });
      toast.success("Manutenção concluída e rádio liberado");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao concluir ordem");
    }
  }

  async function remove(item: DbMaintenance) {
    try {
      await removeMaintenanceRecord(item);
      toast.success("Ordem removida");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover ordem");
    }
  }

  return (
    <AppShell title="Manutenção">
      <PageHeader
        title="Manutenção"
        subtitle="Ordens de serviço e equipamentos fora de operação"
        actions={
          <MaintenanceDialog
            open={open}
            setOpen={(value) => {
              setOpen(value);
              if (!value) setEditing(null);
            }}
            item={editing}
            radios={radios}
            onSaved={load}
          />
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ordens abertas" value={String(metrics.open)} icon={Wrench} tone="warning" />
        <StatCard label="Em reparo" value={String(metrics.repair)} icon={Wrench} tone="info" />
        <StatCard label="Concluídas" value={String(metrics.done)} icon={Wrench} tone="success" />
        <StatCard label="Custo acumulado" value={brlExact(metrics.cost)} icon={Wrench} tone="danger" />
      </section>

      <div className="surface-panel grid gap-3 p-4 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar rádio, problema ou técnico" className="h-11 pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Em aberto</SelectItem><SelectItem value="all">Todas</SelectItem><SelectItem value="completed">Concluídas</SelectItem><SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma manutenção encontrada" description="Abra uma ordem quando um rádio precisar de reparo." action={<Button variant="hero" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nova ordem</Button>} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => {
            const info = statusInfo[m.status] ?? statusInfo.open!;
            return (
              <article key={m.id} className="surface-panel p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-display text-sm font-bold">{m.radios?.code || "Rádio"}</span><Badge tone={info.tone}>{info.label}</Badge></div>
                    <p className="mt-1 text-sm">{m.issue}</p>
                  </div>
                  <span className="font-display text-sm font-bold">{brlExact(Number(m.cost || 0))}</span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>Entrada: {new Date(m.opened_at).toLocaleDateString("pt-BR")}</span>
                  <span>Técnico: {m.technician || "—"}</span>
                  <span className="truncate">{m.notes || "Sem observações"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1 border-t border-border pt-3">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setOpen(true); }}><Pencil className="h-4 w-4" /> Editar</Button>
                  {! ["completed", "cancelled"].includes(m.status) && (
                    <Button variant="soft" size="sm" onClick={() => void complete(m)}><CheckCircle2 className="h-4 w-4" /> Concluir</Button>
                  )}
                  <ConfirmAction
                    trigger={<Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /> Excluir</Button>}
                    title="Excluir ordem de manutenção?"
                    description="A ordem será removida. Se não houver outra manutenção aberta, o rádio voltará a ficar disponível."
                    confirmLabel="Excluir"
                    onConfirm={() => remove(m)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function MaintenanceDialog({ open, setOpen, item, radios, onSaved }: { open: boolean; setOpen: (v: boolean) => void; item: DbMaintenance | null; radios: DbRadio[]; onSaved: () => void }) {
  const blank = { radio_id: "", issue: "", status: "open", technician: "", cost: "0", notes: "" };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (item) setF({ radio_id: item.radio_id, issue: item.issue, status: item.status, technician: item.technician || "", cost: String(item.cost || 0), notes: item.notes || "" });
    else if (open) setF(blank);
  }, [item, open]);

  async function save() {
    if (!f.radio_id || !f.issue.trim()) return toast.error("Selecione o rádio e informe o problema");
    setBusy(true);
    const payload = { radio_id: f.radio_id, issue: f.issue.trim(), status: f.status, technician: f.technician.trim() || null, cost: Number(f.cost || 0), notes: f.notes.trim() || null };
    try {
      if (item) await updateMaintenanceRecord(item.id, payload);
      else await createMaintenanceOperational(payload);
      toast.success(item ? "Ordem atualizada" : "Ordem de manutenção criada");
      setOpen(false); onSaved();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!item && <DialogTrigger asChild><Button variant="hero"><Plus className="h-4 w-4" /> Nova ordem</Button></DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Editar manutenção" : "Nova ordem de manutenção"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Rádio</Label><Select value={f.radio_id} disabled={Boolean(item)} onValueChange={(v) => setF({ ...f, radio_id: v })}><SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{radios.filter((r) => item ? r.id === item.radio_id : !["rented","reserved","lost","inactive"].includes(r.status)).map((r) => <SelectItem key={r.id} value={r.id}>{r.code}{r.radio_models ? ` · ${r.radio_models.manufacturer} ${r.radio_models.model}` : ""}</SelectItem>)}</SelectContent></Select></div>
          <Field label="Problema" value={f.issue} set={(v) => setF({ ...f, issue: v })} wide />
          <Field label="Técnico / fornecedor" value={f.technician} set={(v) => setF({ ...f, technician: v })} />
          <Field label="Custo" value={f.cost} set={(v) => setF({ ...f, cost: v })} type="number" />
          <div className="space-y-1.5"><Label>Status</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Aberta</SelectItem><SelectItem value="in_progress">Em reparo</SelectItem><SelectItem value="waiting_parts">Aguardando peça</SelectItem><SelectItem value="completed">Concluída</SelectItem><SelectItem value="cancelled">Cancelada</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Observações</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button variant="hero" onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, set, type = "text", wide = false }: { label: string; value: string; set: (v: string) => void; type?: string; wide?: boolean }) {
  return <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label>{label}</Label><Input type={type} value={value} onChange={(e) => set(e.target.value)} className="h-11" /></div>;
}
