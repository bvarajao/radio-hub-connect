import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { PageHeader } from "@/components/app/PageHeader";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAccessory,
  getOrganization,
  updateOrganization,
  type DbAccessory,
  type DbOrganization,
} from "@/lib/live-data";
import { listAllAccessories, removeAccessorySafely, updateAccessoryRecord } from "@/lib/operations";
import { getCurrentUser } from "@/lib/supabase-rest";
import { brlExact } from "@/lib/mock-data";

export const Route = createFileRoute("/configuracoes")({ component: SettingsPage });

function SettingsPage() {
  const [org, setOrg] = useState<DbOrganization | null>(null);
  const [accessories, setAccessories] = useState<DbAccessory[]>([]);
  const [form, setForm] = useState<any>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbAccessory | null>(null);

  const load = () =>
    Promise.all([getOrganization(), listAllAccessories()])
      .then(([o, a]) => {
        setOrg(o);
        setAccessories(a);
        if (o) setForm(o);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar configurações"));

  useEffect(() => {
    void load();
  }, []);

  async function saveOrg() {
    if (!form.name?.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    try {
      const rows = await updateOrganization({
        name: form.name.trim(),
        legal_name: form.legal_name?.trim() || null,
        cnpj: form.cnpj?.trim() || null,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
      });
      if (rows[0]) {
        setOrg(rows[0]);
        setForm(rows[0]);
      }
      toast.success("Dados da empresa salvos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  async function removeAccessory(item: DbAccessory) {
    try {
      const result = await removeAccessorySafely(item.id);
      toast.success(
        result.archived ? "Acessório inativado; histórico preservado" : "Acessório excluído",
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover acessório");
    }
  }

  async function reactivateAccessory(item: DbAccessory) {
    try {
      await updateAccessoryRecord(item.id, { is_active: true });
      toast.success("Acessório reativado");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reativar acessório");
    }
  }

  const user = getCurrentUser();
  return (
    <AppShell title="Configurações">
      <PageHeader title="Configurações" subtitle="Dados da empresa, equipe e acessórios" />
      <Tabs defaultValue="empresa">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
            <Field
              label="Nome comercial"
              value={form.name || ""}
              set={(v) => setForm({ ...form, name: v })}
            />
            <Field
              label="Razão social"
              value={form.legal_name || ""}
              set={(v) => setForm({ ...form, legal_name: v })}
            />
            <Field
              label="CNPJ"
              value={form.cnpj || ""}
              set={(v) => setForm({ ...form, cnpj: v })}
            />
            <Field
              label="Telefone"
              value={form.phone || ""}
              set={(v) => setForm({ ...form, phone: v })}
            />
            <Field
              label="E-mail"
              value={form.email || ""}
              set={(v) => setForm({ ...form, email: v })}
              wide
            />
            <Field
              label="Endereço"
              value={form.address || ""}
              set={(v) => setForm({ ...form, address: v })}
              wide
            />
            <div className="sm:col-span-2">
              <Button variant="hero" onClick={saveOrg}>
                Salvar dados da empresa
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <div className="surface-panel p-5">
            <h2 className="font-display text-base font-bold">Acesso atual</h2>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.email || "Usuário autenticado"}
                </p>
                <p className="text-xs text-muted-foreground">Administrador da organização</p>
              </div>
              <Badge tone="brand">Owner</Badge>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              O banco já está preparado para perfis de operação e financeiro. Convites de equipe
              serão habilitados quando definirmos o fluxo de acesso dos colaboradores.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="acessorios" className="mt-4">
          <div className="surface-panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <h2 className="font-display text-base font-bold">Acessórios</h2>
                <p className="text-xs text-muted-foreground">
                  Controle carregadores, fones, baterias e outros itens enviados nas locações.
                </p>
              </div>
              <AccessoryDialog
                open={open}
                setOpen={(value) => {
                  setOpen(value);
                  if (!value) setEditing(null);
                }}
                item={editing}
                onSaved={load}
              />
            </div>
            <ul className="divide-y divide-border">
              {accessories.map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      {!a.is_active && <Badge tone="muted">Inativo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.stock_total} em estoque · {a.category}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="mr-2 text-right text-xs">
                      <b className="block">
                        Locação{" "}
                        {brlExact(
                          Number(
                            (a as DbAccessory & { rental_rate?: number | null }).rental_rate || 0,
                          ),
                        )}
                      </b>
                      <span className="text-muted-foreground">
                        Custo {brlExact(Number(a.unit_cost || 0))}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      onClick={() => {
                        setEditing(a);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {a.is_active ? (
                      <ConfirmAction
                        trigger={
                          <Button variant="ghost" size="icon" title="Excluir ou inativar">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                        title="Remover acessório?"
                        description="Se já tiver sido usado em locações, ele será inativado para preservar o histórico."
                        confirmLabel="Remover"
                        onConfirm={() => removeAccessory(a)}
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reativar"
                        onClick={() => void reactivateAccessory(a)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
              {!accessories.length && (
                <li className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum acessório cadastrado.
                </li>
              )}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function AccessoryDialog({
  open,
  setOpen,
  item,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  item: DbAccessory | null;
  onSaved: () => void;
}) {
  const blank = {
    name: "",
    category: "other",
    stock_total: "0",
    unit_cost: "0",
    rental_rate: "0",
    notes: "",
  };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (item)
      setF({
        name: item.name,
        category: item.category,
        stock_total: String(item.stock_total),
        unit_cost: String(item.unit_cost || 0),
        rental_rate: String(
          Number((item as DbAccessory & { rental_rate?: number | null }).rental_rate || 0),
        ),
        notes: item.notes || "",
      });
    else if (open) setF(blank);
  }, [item, open]);

  async function save() {
    if (!f.name.trim()) {
      toast.error("Informe o nome do acessório");
      return;
    }
    if (Number(f.stock_total) < 0 || Number(f.unit_cost) < 0 || Number(f.rental_rate) < 0) {
      toast.error("Quantidade e valores não podem ser negativos");
      return;
    }
    setBusy(true);
    const payload = {
      name: f.name.trim(),
      category: f.category.trim() || "other",
      stock_total: Number(f.stock_total || 0),
      unit_cost: Number(f.unit_cost || 0),
      rental_rate: Number(f.rental_rate || 0),
      notes: f.notes.trim() || null,
      is_active: true,
    };
    try {
      if (item) await updateAccessoryRecord(item.id, payload);
      else await createAccessory(payload);
      toast.success(item ? "Acessório atualizado" : "Acessório cadastrado");
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!item && (
        <DialogTrigger asChild>
          <Button variant="hero" size="sm">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Editar acessório" : "Novo acessório"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" value={f.name} set={(v) => setF({ ...f, name: v })} wide />
          <Field label="Categoria" value={f.category} set={(v) => setF({ ...f, category: v })} />
          <Field
            label="Quantidade em estoque"
            value={f.stock_total}
            set={(v) => setF({ ...f, stock_total: v })}
            type="number"
          />
          <Field
            label="Custo unitário"
            value={f.unit_cost}
            set={(v) => setF({ ...f, unit_cost: v })}
            type="number"
          />
          <Field
            label="Valor de locação / un."
            value={f.rental_rate}
            set={(v) => setF({ ...f, rental_rate: v })}
            type="number"
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="hero" disabled={busy} onClick={save}>
            {busy ? "Salvando..." : "Salvar"}
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
  type = "text",
  wide = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => set(e.target.value)} className="h-11" />
    </div>
  );
}
