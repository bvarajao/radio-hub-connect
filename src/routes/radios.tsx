import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { RadioStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type DbRadio,
  type DbRadioModel,
} from "@/lib/live-data";

export const Route = createFileRoute("/radios")({ component: RadiosPage });

type RadioRow = DbRadio & { band?: "VHF" | "UHF" | null };

function RadiosPage() {
  const [items, setItems] = useState<RadioRow[]>([]);
  const [models, setModels] = useState<DbRadioModel[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [open, setOpen] = useState(false);

  const load = () =>
    Promise.all([listRadios(), listRadioModels()])
      .then(([r, m]) => {
        setItems(r as RadioRow[]);
        setModels(m);
      })
      .catch((e) => toast.error(e.message));

  useEffect(() => {
    void load();
  }, []);

  const list = useMemo(
    () =>
      items.filter((r) => {
        const t = q.toLowerCase();
        const model = r.radio_models
          ? `${r.radio_models.manufacturer} ${r.radio_models.model}`
          : "";
        return (
          (!t ||
            `${r.code} ${r.serial_number || ""} ${model} ${r.band || ""}`
              .toLowerCase()
              .includes(t)) &&
          (status === "todos" || r.status === status)
        );
      }),
    [items, q, status],
  );

  return (
    <AppShell title="Rádios">
      <PageHeader
        title="Rádios e equipamentos"
        subtitle={`${items.length} equipamentos cadastrados`}
        actions={<NewRadioDialog open={open} setOpen={setOpen} models={models} onSaved={load} />}
      />

      <div className="surface-panel space-y-3 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, modelo, série, VHF ou UHF"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            ["todos", "Todos"],
            ["available", "Disponíveis"],
            ["rented", "Locados"],
            ["reserved", "Reservados"],
            ["maintenance", "Manutenção"],
            ["lost", "Perdidos"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setStatus(v!)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${status === v ? "border-primary bg-primary/15" : "border-border"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum rádio"
          description="Cadastre o primeiro equipamento do estoque."
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
              <Link
                key={r.id}
                to="/radios/$radioId"
                params={{ radioId: r.code }}
                className="surface-panel block p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-sm font-bold">{r.code}</p>
                    <p className="text-xs text-muted-foreground">
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
                    {r.band || "Sem faixa"}
                  </span>
                </div>
              </Link>
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
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        to="/radios/$radioId"
                        params={{ radioId: r.code }}
                        className="font-display font-bold"
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
                    <td className="px-4 py-3 font-semibold">{r.band || "—"}</td>
                    <td className="px-4 py-3">
                      <RadioStatusBadge status={toRadioStatus(r.status)} />
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

function NewRadioDialog({
  open,
  setOpen,
  models,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  models: DbRadioModel[];
  onSaved: () => void;
}) {
  const initialForm = {
    code: "",
    serial_number: "",
    model_id: "",
    manufacturer: "Motorola",
    model: "",
    band: "" as "" | "VHF" | "UHF",
    notes: "",
  };
  const [f, setF] = useState(initialForm);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!f.code) {
      toast.error("Informe o código patrimonial");
      return;
    }
    if (!f.band) {
      toast.error("Selecione se o rádio é VHF ou UHF");
      return;
    }

    setBusy(true);
    try {
      let modelId = f.model_id;
      if (!modelId && f.model) {
        const m = await createRadioModel({
          manufacturer: f.manufacturer || "Motorola",
          model: f.model,
        });
        const createdModelId = m[0]?.id;
        if (!createdModelId) throw new Error("Não foi possível criar o modelo do rádio");
        modelId = createdModelId;
      }

      await createRadio({
        code: f.code.toUpperCase(),
        serial_number: f.serial_number || null,
        model_id: modelId || null,
        band: f.band,
        status: "available",
        battery_status: "unknown",
        notes: f.notes || null,
      });

      toast.success("Rádio cadastrado");
      setOpen(false);
      setF(initialForm);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="h-4 w-4" /> Novo Rádio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo rádio</DialogTitle>
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
              <SelectTrigger>
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

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Faixa</Label>
            <Select value={f.band} onValueChange={(v) => setF({ ...f, band: v as "VHF" | "UHF" })}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione VHF ou UHF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VHF">VHF</SelectItem>
                <SelectItem value="UHF">UHF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="hero" onClick={save} disabled={busy}>
            {busy ? "Salvando..." : "Salvar rádio"}
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
