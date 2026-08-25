import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { RadioStatusBadge } from "@/components/app/StatusBadge";
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
import {
  createRadio,
  createRadioModel,
  listRadioModels,
  listRadios,
  toRadioStatus,
  type DbRadioModel,
} from "@/lib/live-data";
import { removeRadioSafely, updateRadioRecord, type OperationalRadio } from "@/lib/operations";

export const Route = createFileRoute("/radios")({ component: RadiosPage });

type BandFilter = "all" | "VHF" | "UHF";

function RadiosPage() {
  const [items, setItems] = useState<OperationalRadio[]>([]);
  const [models, setModels] = useState<DbRadioModel[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [band, setBand] = useState<BandFilter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OperationalRadio | null>(null);

  const load = () =>
    Promise.all([listRadios(), listRadioModels()])
      .then(([r, m]) => {
        setItems(r as OperationalRadio[]);
        setModels(m);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar rádios"));

  useEffect(() => {
    void load();
  }, []);

  const list = useMemo(
    () =>
      items.filter((r) => {
        const t = q.trim().toLowerCase();
        const model = r.radio_models
          ? `${r.radio_models.manufacturer} ${r.radio_models.model}`
          : "";
        const text = `${r.code} ${r.serial_number || ""} ${model} ${r.band || ""}`.toLowerCase();
        return (
          (!t || text.includes(t)) &&
          (status === "todos" || r.status === status) &&
          (band === "all" || r.band === band)
        );
      }),
    [items, q, status, band],
  );

  async function remove(radio: OperationalRadio) {
    try {
      const result = await removeRadioSafely(radio);
      toast.success(result.archived ? "Rádio inativado; histórico preservado" : "Rádio excluído");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível remover o rádio");
    }
  }

  return (
    <AppShell title="Rádios">
      <PageHeader
        title="Rádios e equipamentos"
        subtitle={`${items.length} cadastrados · ${items.filter((r) => r.status === "available").length} disponíveis`}
        actions={
          <RadioDialog
            open={open}
            setOpen={(value) => {
              setOpen(value);
              if (!value) setEditing(null);
            }}
            radio={editing}
            models={models}
            onSaved={load}
          />
        }
      />

      <div className="surface-panel space-y-3 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar código, modelo, série, VHF ou UHF"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["todos", "Todos"],
            ["available", "Disponíveis"],
            ["rented", "Locados"],
            ["maintenance", "Manutenção"],
            ["inactive", "Inativos"],
            ["lost", "Perdidos"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setStatus(v!)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status === v ? "border-primary bg-primary/15" : "border-border"}`}
            >
              {l}
            </button>
          ))}
          <span className="mx-1 hidden h-7 w-px bg-border sm:block" />
          {[
            ["all", "Todas as faixas"],
            ["VHF", "VHF"],
            ["UHF", "UHF"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setBand(v as BandFilter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${band === v ? "border-primary bg-primary/15" : "border-border"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum rádio encontrado"
          description="Cadastre um equipamento ou ajuste os filtros."
          action={
            <Button variant="hero" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Novo Rádio
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {list.map((r) => (
              <article key={r.id} className="surface-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/radios/$radioId"
                      params={{ radioId: r.code }}
                      className="font-display text-sm font-bold hover:text-primary"
                    >
                      {r.code}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.radio_models
                        ? `${r.radio_models.manufacturer} ${r.radio_models.model}`
                        : "Sem modelo"}
                    </p>
                  </div>
                  <RadioStatusBadge status={toRadioStatus(r.status)} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Série: {r.serial_number || "—"}</span>
                  <span className="rounded-full border border-border px-2.5 py-1 font-bold text-foreground">
                    {r.band}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <ConfirmAction
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" /> Remover
                      </Button>
                    }
                    title="Remover rádio?"
                    description="Se já existir histórico de locação ou manutenção, o rádio será inativado em vez de apagado."
                    confirmLabel="Remover"
                    onConfirm={() => remove(r)}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="surface-panel hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <Th>Código</Th>
                  <Th>Modelo</Th>
                  <Th>Série</Th>
                  <Th>Faixa</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        to="/radios/$radioId"
                        params={{ radioId: r.code }}
                        className="font-display font-bold hover:text-primary"
                      >
                        {r.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {r.radio_models
                        ? `${r.radio_models.manufacturer} ${r.radio_models.model}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.serial_number || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{r.band}</td>
                    <td className="px-4 py-3">
                      <RadioStatusBadge status={toRadioStatus(r.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => {
                            setEditing(r);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmAction
                          trigger={
                            <Button variant="ghost" size="icon" title="Remover">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          }
                          title="Remover rádio?"
                          description="Rádios com histórico serão inativados para preservar rastreabilidade."
                          confirmLabel="Remover"
                          onConfirm={() => remove(r)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}

function RadioDialog({
  open,
  setOpen,
  radio,
  models,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  radio: OperationalRadio | null;
  models: DbRadioModel[];
  onSaved: () => void;
}) {
  const blank = {
    code: "",
    serial_number: "",
    model_id: "",
    manufacturer: "Motorola",
    model: "",
    band: "" as "" | "VHF" | "UHF",
    status: "available",
    notes: "",
  };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (radio) {
      setF({
        code: radio.code,
        serial_number: radio.serial_number || "",
        model_id: radio.model_id || "",
        manufacturer: radio.radio_models?.manufacturer || "Motorola",
        model: radio.radio_models?.model || "",
        band: radio.band,
        status: radio.status,
        notes: radio.notes || "",
      });
    } else if (open) {
      setF(blank);
    }
  }, [radio, open]);

  async function save() {
    if (!f.code.trim()) {
      toast.error("Informe o código patrimonial");
      return;
    }
    if (!f.band) {
      toast.error("Selecione VHF ou UHF");
      return;
    }
    if (!f.model_id && !f.model.trim()) {
      toast.error("Informe o modelo do rádio");
      return;
    }

    setBusy(true);
    try {
      let modelId = f.model_id;
      if (!modelId) {
        const created = await createRadioModel({
          manufacturer: f.manufacturer.trim() || "Motorola",
          model: f.model.trim(),
        });
        const createdId = created[0]?.id;
        if (!createdId) throw new Error("Não foi possível cadastrar o modelo");
        modelId = createdId;
      }

      const payload = {
        code: f.code.trim().toUpperCase(),
        serial_number: f.serial_number.trim() || null,
        model_id: modelId,
        band: f.band,
        notes: f.notes.trim() || null,
        battery_status: "unknown",
        ...(radio && !["rented", "reserved", "maintenance"].includes(radio.status)
          ? { status: f.status }
          : {}),
        ...(!radio ? { status: "available" } : {}),
      };

      if (radio) await updateRadioRecord(radio.id, payload);
      else await createRadio(payload);

      toast.success(radio ? "Rádio atualizado" : "Rádio cadastrado");
      setOpen(false);
      setF(blank);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar rádio");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!radio && (
        <DialogTrigger asChild>
          <Button variant="hero">
            <Plus className="h-4 w-4" /> Novo Rádio
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{radio ? "Editar rádio" : "Novo rádio"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Código patrimonial" value={f.code} set={(v) => setF({ ...f, code: v })} />
          <Field
            label="Número de série"
            value={f.serial_number}
            set={(v) => setF({ ...f, serial_number: v })}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Modelo existente</Label>
            <Select
              value={f.model_id || "novo"}
              onValueChange={(v) => setF({ ...f, model_id: v === "novo" ? "" : v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Cadastrar novo modelo</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.manufacturer} {m.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!f.model_id && (
            <>
              <Field
                label="Fabricante"
                value={f.manufacturer}
                set={(v) => setF({ ...f, manufacturer: v })}
              />
              <Field label="Modelo" value={f.model} set={(v) => setF({ ...f, model: v })} />
            </>
          )}
          <div className="space-y-1.5">
            <Label>Faixa</Label>
            <Select value={f.band} onValueChange={(v) => setF({ ...f, band: v as "VHF" | "UHF" })}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VHF">VHF</SelectItem>
                <SelectItem value="UHF">UHF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {radio && !["rented", "reserved", "maintenance"].includes(radio.status) && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {radio?.status === "maintenance" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2">
              O status de manutenção é controlado pelo módulo Manutenção. Finalize ou cancele a
              ordem por lá para liberar o rádio.
            </div>
          )}
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
            {busy ? "Salvando..." : radio ? "Salvar alterações" : "Salvar rádio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => set(e.target.value)} className="h-11" />
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
