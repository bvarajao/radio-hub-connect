import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "info" | "danger" | "neutral";
  className?: string;
};

const iconTones = {
  brand: "bg-primary/12 text-accent-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/18 text-warning-foreground",
  info: "bg-info/12 text-info",
  danger: "bg-destructive/12 text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "surface-panel flex flex-col gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <span
          className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", iconTones[tone])}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <div>
        <p className="font-display text-2xl leading-none font-extrabold sm:text-[1.7rem]">
          {value}
        </p>
        {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
