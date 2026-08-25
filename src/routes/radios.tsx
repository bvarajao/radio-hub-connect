import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BatteryFull, Plus, QrCode, Search } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { RadioStatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { radios, radioStatusLabel, type RadioStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/radios")({
  head: () => ({
    meta: [
      { title: "Rádios e Equipamentos | Papo de Produtor" },
      {
        name: "description",
        content:
          "Controle individual de cada rádio comunicador por código patrimonial, status, bateria e localização.",
      },
      { property: "og:title", content: "Rádios e Equipamentos — Papo de Produtor" },
      {
        property: "og:description",
        content: "Estoque de rádios com busca, filtros por status e histórico por equipamento.",
      },
    ],
  }),
  component: RadiosPage,
});

const statusFilters: (RadioStatus | "todos")[] = [
  "todos",
  "disponivel",
  "locado",
  "reservado",
  "manutencao",
  "inativo",
];

function RadiosPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RadioStatus | "todos">("todos");
  const [modelo, setModelo] = useState("todos");

  const modelos = useMemo(() => [...new Set(radios.map((r) => r.modelo))], []);

  const list = radios.filter((r) => {
    const q = query.trim().toLowerCase();
    const okQuery =
      !q ||
      r.codigo.toLowerCase().includes(q) ||
      r.modelo.toLowerCase().includes(q) ||
      r.serie.toLowerCase().includes(q);
    return okQuery && (status === "todos" || r.status === status) && (modelo === "todos" || r.modelo === modelo);
  });

  return (
    <AppShell title="Rádios">
      <PageHeader
        title="Rádios e equipamentos"
        subtitle={`${radios.length} equipamentos cadastrados · controle por patrimônio`}
        actions={
          <>
            <Button variant="outline">
              <QrCode className="h-4 w-4" /> Etiquetas QR
            </Button>
            <Button variant="hero">
              <Plus className="h-4 w-4" /> Novo Rádio
            </Button>
          </>
        }
      />

      <div className="surface-panel space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="relative min-w-0">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código, modelo ou número de série"
              className="h-11 pl-9"
            />
          </div>
          <Select value={modelo} onValueChange={setModelo}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os modelos</SelectItem>
              {modelos.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                status === s
                  ? "border-primary bg-primary/15 text-accent-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {s === "todos" ? "Todos" : radioStatusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum rádio encontrado"
          description="Ajuste a busca ou os filtros para localizar o equipamento desejado."
          action={
            <Button
              variant="soft"
              onClick={() => {
                setQuery("");
                setStatus("todos");
                setModelo("todos");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {list.map((r) => (
              <Link
                key={r.id}
                to="/radios/$radioId"
                params={{ radioId: r.codigo }}
                className="surface-panel block p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold">{r.codigo}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.modelo}</p>
                  </div>
                  <RadioStatusBadge status={r.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{r.local}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <BatteryFull className="h-3.5 w-3.5" /> {r.bateria}%
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="surface-panel hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <Th>Código</Th>
                  <Th>Modelo</Th>
                  <Th>Nº de série</Th>
                  <Th>Status</Th>
                  <Th>Bateria</Th>
                  <Th>Localização</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-border transition-colors hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <Link
                        to="/radios/$radioId"
                        params={{ radioId: r.codigo }}
                        className="font-display font-bold hover:text-primary"
                      >
                        {r.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{r.modelo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.serie}</td>
                    <td className="px-4 py-3">
                      <RadioStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              r.bateria > 60
                                ? "bg-success"
                                : r.bateria > 30
                                  ? "bg-warning"
                                  : "bg-destructive",
                            )}
                            style={{ width: `${r.bateria}%` }}
                          />
                        </span>
                        {r.bateria}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.local}</td>
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

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left font-semibold">{children}</th>
);
