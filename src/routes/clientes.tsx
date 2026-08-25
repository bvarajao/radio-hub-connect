import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Plus, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
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
import { brl, clients } from "@/lib/mock-data";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Cadastro de clientes com contato, responsável, histórico de locações e saldo a receber.",
      },
      { property: "og:title", content: "Clientes — Papo de Produtor" },
      {
        property: "og:description",
        content: "Base de clientes de locação de rádios com histórico e financeiro.",
      },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const [query, setQuery] = useState("");
  const list = clients.filter((c) =>
    `${c.nome} ${c.documento} ${c.responsavel}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <AppShell title="Clientes">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes cadastrados`}
        actions={<NewClientDialog />}
      />

      <div className="surface-panel p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, documento ou responsável"
            className="h-11 pl-9"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum cliente encontrado"
          description="Revise a busca ou cadastre um novo cliente para começar a locar."
          action={<NewClientDialog />}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((c) => (
            <article key={c.id} className="surface-panel p-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-accent-foreground">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{c.nome}</h2>
                  <p className="truncate text-xs text-muted-foreground">{c.documento}</p>
                </div>
                <Badge tone={c.saldo > 0 ? "danger" : "success"}>
                  {c.saldo > 0 ? `A receber ${brl(c.saldo)}` : "Em dia"}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.telefone}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </span>
                <span className="truncate">Responsável: {c.responsavel}</span>
                <span className="truncate">{c.locacoes} locações realizadas</span>
              </div>

              {c.observacoes && (
                <p className="mt-3 rounded-lg bg-secondary/50 p-2.5 text-xs text-muted-foreground">
                  {c.observacoes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function NewClientDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Novo cliente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome / Razão social" className="sm:col-span-2" />
          <Field label="CPF / CNPJ" />
          <Field label="Telefone" />
          <Field label="E-mail" className="sm:col-span-2" />
          <Field label="Responsável" className="sm:col-span-2" />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={3} placeholder="Condições comerciais, prazos, contatos extras" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="hero">Salvar cliente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Field = ({ label, className }: { label: string; className?: string }) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <Label>{label}</Label>
    <Input className="h-11" />
  </div>
);
