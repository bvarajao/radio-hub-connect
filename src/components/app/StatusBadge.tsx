import { cn } from "@/lib/utils";
import {
  paymentLabel,
  radioStatusLabel,
  rentalStatusLabel,
  type PaymentStatus,
  type RadioStatus,
  type RentalStatus,
} from "@/lib/mock-data";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

const tones = {
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/15 text-warning-foreground",
  info: "border-info/25 bg-info/10 text-info",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
  brand: "border-primary/30 bg-primary/12 text-accent-foreground",
} as const;

export type Tone = keyof typeof tones;

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn(base, tones[tone], className)}>{children}</span>;
}

const radioTone: Record<RadioStatus, Tone> = {
  disponivel: "success",
  locado: "brand",
  manutencao: "warning",
  reservado: "info",
  inativo: "danger",
};

const rentalTone: Record<RentalStatus, Tone> = {
  ativa: "brand",
  reservada: "info",
  finalizada: "muted",
  atrasada: "danger",
};

const paymentTone: Record<PaymentStatus, Tone> = {
  pago: "success",
  parcial: "warning",
  a_receber: "danger",
};

export const RadioStatusBadge = ({ status }: { status: RadioStatus }) => (
  <Badge tone={radioTone[status]}>{radioStatusLabel[status]}</Badge>
);

export const RentalStatusBadge = ({ status }: { status: RentalStatus }) => (
  <Badge tone={rentalTone[status]}>{rentalStatusLabel[status]}</Badge>
);

export const PaymentBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={paymentTone[status]}>{paymentLabel[status]}</Badge>
);
