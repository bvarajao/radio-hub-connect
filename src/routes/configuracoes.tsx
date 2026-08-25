import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accessories, brlExact } from "@/lib/mock-data";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Papo de Produtor — Gestão de Rádios" },
      {
        name: "description",
        content:
          "Dados da empresa, usuários, formas de pagamento, categorias de acessórios e preferências do sistema.",
      },
      { property: "og:title", content: "Configurações — Papo de Produtor" },
      {
        property: "og:description",
        content: "Ajuste empresa, equipe e preferências do sistema de gestão de rádios.",
      },
    ],
  }),
  component: SettingsPage,
});

const users = [
  { nome: "Bruno Varajão", email: "bruno@papodeprodutor.com", papel: "Administrador" },
  { nome: "Marina Duarte", email: "marina@papodeprodutor.com", papel: "Operação" },
  { nome: "Diego Santos", email: "diego@papodeprodutor.com", papel: "Financeiro" },
];

const payments = ["Pix", "Cartão de crédito", "Dinheiro", "Transferência", "Boleto / empenho"];

function SettingsPage() {
  return (
    <AppShell title="Configurações">
      <PageHeader title="Configurações" subtitle="Empresa, equipe e preferências do sistema" />

      <Tabs defaultValue="empresa">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Razão social" value="Papo de Produtor Produções Ltda" />
            <Field label="CNPJ" value="41.998.221/0001-70" />
            <Field label="Telefone" value="(21) 99900-1122" />
            <Field label="E-mail" value="contato@papodeprodutor.com" />
            <Field label="Cidade" value="Rio de Janeiro / RJ" />
            <Field label="Responsável" value="Bruno Varajão" />
            <div className="sm:col-span-2">
              <Button variant="hero">Salvar dados da empresa</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <div className="surface-panel overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-4">
              <h2 className="min-w-0 truncate font-display text-base font-bold">Equipe</h2>
              <Button variant="hero" size="sm">
                <Plus className="h-4 w-4" /> Convidar
              </Button>
            </div>
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.email} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge tone={u.papel === "Administrador" ? "brand" : "muted"}>{u.papel}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <div className="surface-panel p-5">
            <h2 className="font-display text-base font-bold">Formas de pagamento aceitas</h2>
            <ul className="mt-4 space-y-3">
              {payments.map((p) => (
                <li
                  key={p}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-secondary/50 p-3"
                >
                  <span className="min-w-0 truncate text-sm">{p}</span>
                  <Switch defaultChecked />
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="acessorios" className="mt-4">
          <div className="surface-panel overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-4">
              <h2 className="min-w-0 truncate font-display text-base font-bold">
                Categorias de acessórios
              </h2>
              <Button variant="hero" size="sm">
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </div>
            <ul className="divide-y divide-border">
              {accessories.map((a) => (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">{a.estoque} em estoque</p>
                  </div>
                  <span className="text-sm font-semibold">{brlExact(a.valor)}</span>
                  <Button variant="ghost" size="icon" aria-label="Remover">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="preferencias" className="mt-4">
          <div className="surface-panel space-y-4 p-5">
            <Pref
              title="Alerta de devolução atrasada"
              text="Notificar a equipe 2 horas após o horário previsto."
            />
            <Pref
              title="Exigir conferência item por item"
              text="Obriga marcar cada rádio na devolução."
            />
            <Pref title="Numeração automática de locação" text="Padrão LOC-ANO-0000." />
            <Pref title="Bloquear locação com saldo em aberto" text="Aplicado a novos clientes." />
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input className="h-11" defaultValue={value} />
  </div>
);

const Pref = ({ title, text }: { title: string; text: string }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-secondary/50 p-3.5">
    <div className="min-w-0">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
    <Switch defaultChecked />
  </div>
);
