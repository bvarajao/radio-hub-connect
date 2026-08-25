import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Pencil, Phone, Plus, RotateCcw, Search, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
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
import { createClient } from "@/lib/live-data";
import {
  listAllClients,
  reactivateClient,
  removeClientSafely,
  updateClientRecord,
  type OperationalClient,
} from "@/lib/operations";

export const Route = createFileRoute("/clientes")({ component: ClientsPage });

type ClientFilter = "active" | "inactive" | "all";

function ClientsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("active");
  const [items, setItems] = useState<OperationalClient[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OperationalClient | null>(null);

  const load = () =>
    listAllClients()
      .then(setItems)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar clientes"));

  useEffect(() => {
    void load();
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      const text =
        `${c.name} ${c.document || ""} ${c.contact_name || ""} ${c.phone || ""} ${c.email || ""}`.toLowerCase();
      const matchesText = !q || text.includes(q);
      const matchesStatus = filter === "all" || (filter === "active" ? c.is_active : !c.is_active);
      return matchesText && matchesStatus;
    });
  }, [items, query, filter]);

  async function remove(c: OperationalClient) {
    try {
      const result = await removeClientSafely(c.id);
      toast.success(
        result.archived ? "Cliente inativado; histórico preservado" : "Cliente excluído",
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível remover o cliente");
    }
  }

  async function reactivate(c: OperationalClient) {
    try {
      await reactivateClient(c.id);
      toast.success("Cliente reativado");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reativar cliente");
    }
  }

  return (
    <AppShell title="Clientes">
      <PageHeader
        title="Clientes"
        subtitle={`${items.filter((c) => c.is_active).length} ativos · ${items.length} cadastrados`}
        actions={
          <ClientDialog
            open={open}
            setOpen={(value) => {
              setOpen(value);
              if (!value) setEditing(null);
            }}
            client={editing}
            onSaved={load}
          />
        }
      />

      <div className="surface-panel space-y-3 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nome, documento, telefone ou e-mail"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            ["active", "Ativos"],
            ["inactive", "Inativos"],
            ["all", "Todos"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value as ClientFilter)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === value ? "border-primary bg-primary/15" : "border-border"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum cliente encontrado"
          description="Cadastre um cliente ou ajuste os filtros."
          action={
            <Button variant="hero" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Novo Cliente
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((c) => (
            <article key={c.id} className="surface-panel p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-bold">{c.name}</h2>
                    {!c.is_active && <Badge tone="muted">Inativo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.document || "Sem documento"}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Editar cliente"
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {c.is_active ? (
                    <ConfirmAction
                      trigger={
                        <Button variant="ghost" size="icon" title="Excluir ou inativar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title="Remover cliente?"
                      description="Se este cliente já possuir histórico, ele será apenas inativado para preservar locações e financeiro."
                      confirmLabel="Remover"
                      onConfirm={() => remove(c)}
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Reativar"
                      onClick={() => void reactivate(c)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <span className="flex gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  {c.phone || "—"}
                </span>
                <span className="flex gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  {c.email || "—"}
                </span>
                <span>Tipo: {c.type === "person" ? "Pessoa física" : "Empresa"}</span>
                <span>Responsável: {c.contact_name || "—"}</span>
              </div>
              {c.address && <p className="mt-2 text-xs text-muted-foreground">{c.address}</p>}
              {c.notes && (
                <p className="mt-3 rounded-lg bg-secondary/50 p-2.5 text-xs text-muted-foreground">
                  {c.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ClientDialog({
  open,
  setOpen,
  client,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  client: OperationalClient | null;
  onSaved: () => void;
}) {
  const blank = {
    type: "company" as "person" | "company",
    name: "",
    document: "",
    phone: "",
    email: "",
    contact_name: "",
    address: "",
    notes: "",
  };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (client) {
      setF({
        type: client.type === "person" ? "person" : "company",
        name: client.name || "",
        document: client.document || "",
        phone: client.phone || "",
        email: client.email || "",
        contact_name: client.contact_name || "",
        address: client.address || "",
        notes: client.notes || "",
      });
    } else if (open) {
      setF(blank);
    }
  }, [client, open]);

  async function save() {
    if (!f.name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (f.email && !f.email.includes("@")) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setBusy(true);
    const payload = {
      type: f.type,
      name: f.name.trim(),
      document: f.document.trim() || null,
      phone: f.phone.trim() || null,
      email: f.email.trim() || null,
      contact_name: f.contact_name.trim() || null,
      address: f.address.trim() || null,
      notes: f.notes.trim() || null,
      is_active: true,
    };

    try {
      if (client) await updateClientRecord(client.id, payload);
      else await createClient(payload as never);
      toast.success(client ? "Cliente atualizado" : "Cliente cadastrado");
      setOpen(false);
      setF(blank);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar cliente");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!client && (
        <DialogTrigger asChild>
          <Button variant="hero">
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={f.type}
              onValueChange={(v) => setF({ ...f, type: v as "person" | "company" })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="person">Pessoa física</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field
            label={f.type === "person" ? "CPF" : "CNPJ"}
            value={f.document}
            set={(v) => setF({ ...f, document: v })}
          />
          <Field
            label="Nome / Razão social"
            value={f.name}
            set={(v) => setF({ ...f, name: v })}
            wide
          />
          <Field label="Telefone" value={f.phone} set={(v) => setF({ ...f, phone: v })} />
          <Field label="E-mail" value={f.email} set={(v) => setF({ ...f, email: v })} />
          <Field
            label="Responsável"
            value={f.contact_name}
            set={(v) => setF({ ...f, contact_name: v })}
            wide
          />
          <Field label="Endereço" value={f.address} set={(v) => setF({ ...f, address: v })} wide />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="hero" onClick={save} disabled={busy}>
            {busy ? "Salvando..." : client ? "Salvar alterações" : "Salvar cliente"}
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
  wide,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => set(e.target.value)} className="h-11" />
    </div>
  );
}
