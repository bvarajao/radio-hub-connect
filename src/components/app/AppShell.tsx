import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  Menu,
  Plus,
  RadioTower,
  Settings,
  Users,
  Wallet,
  Wrench,
  LogOut,
  Bell,
  ClipboardCheck,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/radios", label: "Rádios", icon: RadioTower },
  { to: "/locacoes", label: "Locações", icon: CalendarClock },
  { to: "/devolucao", label: "Devolução", icon: ClipboardCheck },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/manutencao", label: "Manutenção", icon: Wrench },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const mobileNav = nav.filter((n) =>
  ["/dashboard", "/radios", "/locacoes", "/devolucao", "/financeiro"].includes(n.to),
);

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
          activeProps={{ className: "font-semibold" }}
        >
          <Icon className="h-4.5 w-4.5 shrink-0 opacity-80 group-data-[status=active]:text-sidebar-primary group-data-[status=active]:opacity-100" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="gradient-night flex h-full flex-col gap-6 p-4">
      <div className="px-1 pt-1">
        <Logo tone="light" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="space-y-3 border-t border-sidebar-border pt-4">
        <Button asChild variant="hero" className="w-full">
          <Link to="/locacoes/nova" onClick={onNavigate}>
            <Plus className="h-4 w-4" /> Nova Locação
          </Link>
        </Button>
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            BV
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Bruno Varajão</p>
            <p className="truncate text-xs text-sidebar-foreground/55">Operação</p>
          </div>
          <Link
            to="/login"
            className="text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-sidebar-border p-0">
                <SidebarBody onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden lg:block" />
          <p className="min-w-0 truncate font-display text-sm font-bold lg:text-base">
            {title ?? "Painel"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
            <Button asChild variant="hero" size="sm" className="hidden sm:inline-flex">
              <Link to="/locacoes/nova">
                <Plus className="h-4 w-4" /> Nova Locação
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 pt-5 pb-28 lg:px-8 lg:pb-10">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
          {mobileNav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium text-muted-foreground transition-colors",
                "data-[status=active]:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
