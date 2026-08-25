import { RadioTower } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
  tone?: "light" | "dark";
};

export function Logo({ className, compact = false, tone = "dark" }: LogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="gradient-brand grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-[var(--shadow-glow)]">
        <RadioTower className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate font-display text-[0.95rem] leading-tight font-extrabold tracking-tight",
              tone === "light" ? "text-sidebar-foreground" : "text-foreground",
            )}
          >
            Papo de Produtor
          </span>
          <span
            className={cn(
              "block truncate text-[0.7rem] tracking-[0.18em] uppercase",
              tone === "light" ? "text-sidebar-foreground/60" : "text-muted-foreground",
            )}
          >
            Gestão de Rádios
          </span>
        </span>
      )}
    </div>
  );
}
