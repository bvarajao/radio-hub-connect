export type RadioStatus = "disponivel" | "locado" | "manutencao" | "reservado" | "inativo";

export type Radio = {
  id: string;
  codigo: string;
  modelo: string;
  serie: string;
  status: RadioStatus;
  bateria: number;
  local: string;
  observacao?: string;
};

export type RentalStatus = "ativa" | "reservada" | "finalizada" | "atrasada";
export type PaymentStatus = "pago" | "parcial" | "a_receber";

export type Rental = {
  id: string;
  numero: string;
  cliente: string;
  evento: string;
  retirada: string;
  devolucao: string;
  qtdRadios: number;
  valor: number;
  pagamento: PaymentStatus;
  status: RentalStatus;
  radios: string[];
};

export type Client = {
  id: string;
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  responsavel: string;
  locacoes: number;
  saldo: number;
  observacoes?: string;
};

export type Maintenance = {
  id: string;
  radio: string;
  problema: string;
  entrada: string;
  custo: number;
  status: "aberta" | "em_reparo" | "concluida";
  tecnico: string;
  observacao: string;
};

export const radioStatusLabel: Record<RadioStatus, string> = {
  disponivel: "Disponível",
  locado: "Locado",
  manutencao: "Manutenção",
  reservado: "Reservado",
  inativo: "Inativo/Perdido",
};

export const rentalStatusLabel: Record<RentalStatus, string> = {
  ativa: "Ativa",
  reservada: "Reservada",
  finalizada: "Finalizada",
  atrasada: "Atrasada",
};

export const paymentLabel: Record<PaymentStatus, string> = {
  pago: "Pago",
  parcial: "Parcial",
  a_receber: "A receber",
};

const modelos = [
  "Motorola EP450",
  "Motorola DEP450",
  "Motorola DTR620",
  "Kenwood TK-3000",
  "Hytera BD506",
];
const locais = [
  "Estoque A - Prateleira 1",
  "Estoque A - Prateleira 2",
  "Estoque B - Case 03",
  "Van de produção",
  "Bancada técnica",
];

const statusCycle: RadioStatus[] = [
  "locado",
  "locado",
  "disponivel",
  "disponivel",
  "reservado",
  "locado",
  "disponivel",
  "manutencao",
  "disponivel",
  "locado",
  "disponivel",
  "inativo",
];

export const radios: Radio[] = Array.from({ length: 48 }, (_, i) => {
  const n = i + 1;
  const status = statusCycle[i % statusCycle.length]!;
  return {
    id: `rad-${n}`,
    codigo: `RAD-${String(n).padStart(3, "0")}`,
    modelo: modelos[i % modelos.length]!,
    serie: `SN${2024000 + n * 37}`,
    status,
    bateria: status === "manutencao" ? 12 + (i % 20) : 55 + ((i * 7) % 45),
    local: locais[i % locais.length]!,
    observacao:
      status === "manutencao"
        ? "PTT travando de forma intermitente"
        : status === "inativo"
          ? "Não retornou do evento Réveillon Marina"
          : undefined,
  };
});

export const clients: Client[] = [
  {
    id: "cli-1",
    nome: "Vibe Produções Ltda",
    documento: "12.345.678/0001-90",
    telefone: "(21) 99812-4455",
    email: "operacoes@vibeproducoes.com.br",
    responsavel: "Marina Duarte",
    locacoes: 14,
    saldo: 2850,
    observacoes: "Cliente recorrente, fecha pacote mensal de 20 rádios.",
  },
  {
    id: "cli-2",
    nome: "Arena Shows Entretenimento",
    documento: "98.765.432/0001-12",
    telefone: "(11) 98771-2093",
    email: "logistica@arenashows.com",
    responsavel: "Rafael Nogueira",
    locacoes: 9,
    saldo: 0,
  },
  {
    id: "cli-3",
    nome: "Casamentos Bela Vista",
    documento: "45.221.900/0001-33",
    telefone: "(31) 99145-7788",
    email: "contato@belavistaeventos.com",
    responsavel: "Juliana Prado",
    locacoes: 5,
    saldo: 640,
  },
  {
    id: "cli-4",
    nome: "Prefeitura de Serra Azul",
    documento: "07.554.301/0001-08",
    telefone: "(16) 3322-8100",
    email: "eventos@serraazul.gov.br",
    responsavel: "Carlos Menezes",
    locacoes: 3,
    saldo: 4200,
    observacoes: "Pagamento por empenho, prazo de 30 dias.",
  },
  {
    id: "cli-5",
    nome: "Fábio Lima (MEI) — Som & Luz",
    documento: "321.654.987-00",
    telefone: "(48) 99630-1177",
    email: "fabio@somluzsc.com",
    responsavel: "Fábio Lima",
    locacoes: 7,
    saldo: 320,
  },
];

export const rentals: Rental[] = [
  {
    id: "loc-1",
    numero: "LOC-2026-0148",
    cliente: "Vibe Produções Ltda",
    evento: "Festival Verão Beira-Mar",
    retirada: "24/08/2026 08:00",
    devolucao: "26/08/2026 18:00",
    qtdRadios: 12,
    valor: 3840,
    pagamento: "parcial",
    status: "ativa",
    radios: ["RAD-001", "RAD-002", "RAD-006", "RAD-010"],
  },
  {
    id: "loc-2",
    numero: "LOC-2026-0147",
    cliente: "Arena Shows Entretenimento",
    evento: "Show Arena Norte",
    retirada: "23/08/2026 14:00",
    devolucao: "25/08/2026 12:00",
    qtdRadios: 8,
    valor: 2560,
    pagamento: "pago",
    status: "atrasada",
    radios: ["RAD-013", "RAD-014", "RAD-018"],
  },
  {
    id: "loc-3",
    numero: "LOC-2026-0146",
    cliente: "Casamentos Bela Vista",
    evento: "Casamento Prado & Souza",
    retirada: "25/08/2026 10:00",
    devolucao: "25/08/2026 23:59",
    qtdRadios: 4,
    valor: 720,
    pagamento: "a_receber",
    status: "ativa",
    radios: ["RAD-022", "RAD-025", "RAD-030", "RAD-034"],
  },
  {
    id: "loc-4",
    numero: "LOC-2026-0152",
    cliente: "Prefeitura de Serra Azul",
    evento: "Aniversário da Cidade",
    retirada: "01/09/2026 07:00",
    devolucao: "03/09/2026 20:00",
    qtdRadios: 20,
    valor: 7200,
    pagamento: "a_receber",
    status: "reservada",
    radios: ["RAD-005", "RAD-017", "RAD-029"],
  },
  {
    id: "loc-5",
    numero: "LOC-2026-0140",
    cliente: "Fábio Lima (MEI) — Som & Luz",
    evento: "Feira Gastronômica",
    retirada: "10/08/2026 09:00",
    devolucao: "12/08/2026 17:00",
    qtdRadios: 6,
    valor: 1440,
    pagamento: "pago",
    status: "finalizada",
    radios: ["RAD-003", "RAD-007", "RAD-009"],
  },
  {
    id: "loc-6",
    numero: "LOC-2026-0139",
    cliente: "Vibe Produções Ltda",
    evento: "Congresso Med Rio",
    retirada: "02/08/2026 07:30",
    devolucao: "04/08/2026 19:00",
    qtdRadios: 15,
    valor: 4500,
    pagamento: "pago",
    status: "finalizada",
    radios: ["RAD-011", "RAD-012", "RAD-020"],
  },
];

export const maintenances: Maintenance[] = [
  {
    id: "man-1",
    radio: "RAD-008",
    problema: "PTT travando de forma intermitente",
    entrada: "18/08/2026",
    custo: 120,
    status: "em_reparo",
    tecnico: "TecnoRádio Assistência",
    observacao: "Aguardando peça de reposição.",
  },
  {
    id: "man-2",
    radio: "RAD-020",
    problema: "Bateria não segura carga",
    entrada: "20/08/2026",
    custo: 89,
    status: "aberta",
    tecnico: "Oficina interna",
    observacao: "Trocar bateria por nova NNTN4497.",
  },
  {
    id: "man-3",
    radio: "RAD-032",
    problema: "Antena rompida e carcaça trincada",
    entrada: "12/08/2026",
    custo: 210,
    status: "concluida",
    tecnico: "TecnoRádio Assistência",
    observacao: "Retornou ao estoque em 19/08.",
  },
];

export const accessories = [
  { id: "acc-1", nome: "Bateria extra", estoque: 34, valor: 15 },
  { id: "acc-2", nome: "Carregador simples", estoque: 28, valor: 10 },
  { id: "acc-3", nome: "Carregador múltiplo (6 slots)", estoque: 6, valor: 45 },
  { id: "acc-4", nome: "Fone ponto de escuta", estoque: 22, valor: 20 },
  { id: "acc-5", nome: "Case de transporte", estoque: 8, valor: 30 },
  { id: "acc-6", nome: "Clip de cinto", estoque: 40, valor: 5 },
];

export const faturamentoMensal = [
  { mes: "Mar", valor: 18400 },
  { mes: "Abr", valor: 22150 },
  { mes: "Mai", valor: 19800 },
  { mes: "Jun", valor: 26700 },
  { mes: "Jul", valor: 31200 },
  { mes: "Ago", valor: 34860 },
];

export const lancamentos = [
  {
    id: "fin-1",
    data: "24/08/2026",
    descricao: "LOC-2026-0148 — Vibe Produções (entrada 50%)",
    tipo: "entrada" as const,
    valor: 1920,
    situacao: "recebido" as const,
  },
  {
    id: "fin-2",
    data: "23/08/2026",
    descricao: "LOC-2026-0147 — Arena Shows",
    tipo: "entrada" as const,
    valor: 2560,
    situacao: "recebido" as const,
  },
  {
    id: "fin-3",
    data: "20/08/2026",
    descricao: "Manutenção RAD-020 — bateria",
    tipo: "saida" as const,
    valor: 89,
    situacao: "pago" as const,
  },
  {
    id: "fin-4",
    data: "18/08/2026",
    descricao: "Manutenção RAD-008 — TecnoRádio",
    tipo: "saida" as const,
    valor: 120,
    situacao: "pago" as const,
  },
  {
    id: "fin-5",
    data: "05/09/2026",
    descricao: "LOC-2026-0152 — Prefeitura de Serra Azul",
    tipo: "entrada" as const,
    valor: 7200,
    situacao: "a_receber" as const,
  },
  {
    id: "fin-6",
    data: "30/08/2026",
    descricao: "LOC-2026-0146 — Casamentos Bela Vista",
    tipo: "entrada" as const,
    valor: 720,
    situacao: "a_receber" as const,
  },
];

export const radioHistory = [
  { data: "24/08/2026", tipo: "Locação", detalhe: "LOC-2026-0148 — Festival Verão Beira-Mar" },
  { data: "10/08/2026", tipo: "Devolução", detalhe: "Conferido OK, bateria 82%" },
  { data: "02/08/2026", tipo: "Locação", detalhe: "LOC-2026-0139 — Congresso Med Rio" },
  { data: "22/07/2026", tipo: "Manutenção", detalhe: "Troca de antena — R$ 60,00" },
  { data: "15/07/2026", tipo: "Locação", detalhe: "LOC-2026-0131 — Feira do Livro" },
];

export const dashboardMetrics = {
  total: radios.length,
  locados: radios.filter((r) => r.status === "locado").length,
  disponiveis: radios.filter((r) => r.status === "disponivel").length,
  manutencao: radios.filter((r) => r.status === "manutencao").length,
  reservados: radios.filter((r) => r.status === "reservado").length,
  faturamentoMes: 34860,
  aReceber: 7920,
  locacoesAtivas: rentals.filter((r) => r.status === "ativa").length,
  atrasadas: rentals.filter((r) => r.status === "atrasada").length,
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const brlExact = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
