from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"pattern not found: {label}")
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, repl: str, label: str) -> str:
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"regex expected 1 match for {label}, got {count}")
    return out

# ---- operations.ts ---------------------------------------------------------
p = Path("src/lib/operations.ts")
s = p.read_text()
s = replace_once(
    s,
    '  accessories?: { name: string; stock_total: number } | null;',
    '  accessories?: { name: string; stock_total: number; rental_rate?: number | null } | null;',
    "rental accessory nested type",
)

availability_fn = '''\nexport async function accessoryAvailabilityForPeriod(\n  pickupAt: string,\n  dueAt: string,\n  excludeRentalId?: string,\n) {\n  const [accessories, rentals] = await Promise.all([listAllAccessories(), listRentalsOperational()]);\n  const committed = new Map<string, number>();\n\n  for (const rental of rentals) {\n    if (excludeRentalId && rental.id === excludeRentalId) continue;\n    if (!activeRentalStatuses.has(rental.status)) continue;\n    if (!overlap(pickupAt, dueAt, rental.pickup_at, rental.due_at)) continue;\n    for (const item of rental.rental_accessories || []) {\n      committed.set(\n        item.accessory_id,\n        (committed.get(item.accessory_id) || 0) + Number(item.quantity || 0),\n      );\n    }\n  }\n\n  return Object.fromEntries(\n    accessories.map((item) => [\n      item.id,\n      Math.max(0, Number(item.stock_total || 0) - (committed.get(item.id) || 0)),\n    ]),\n  ) as Record<string, number>;\n}\n'''
s = replace_once(
    s,
    '  return blocked;\n}\n\nasync function nextRentalCode()',
    '  return blocked;\n}\n' + availability_fn + '\nasync function nextRentalCode()',
    "accessory availability helper",
)

new_rebuild = '''async function rebuildRentalFinance(rental: {\n  id: string;\n  code: string;\n  client_id: string;\n  event_name: string | null;\n  total: number;\n  deposit_amount: number;\n  payment_status: string;\n  payment_method: string | null;\n  due_at?: string | null;\n}) {\n  const org = await requireOrganization();\n  const current = await rest<OperationalFinance[]>(\n    `financial_transactions?rental_id=eq.${rental.id}&select=*&order=created_at.asc`,\n  );\n  const paidRows = current.filter((item) => item.status === "paid");\n  const paidTotal = paidRows.reduce((sum, item) => sum + Number(item.amount || 0), 0);\n\n  if (rental.total + 0.0001 < paidTotal) {\n    throw new Error(\n      `Esta locação já possui ${paidTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} recebidos. O total não pode ficar abaixo do valor já pago.`,\n    );\n  }\n\n  const desiredReceived = Math.min(\n    rental.total,\n    rental.payment_status === "paid" ? rental.total : Math.max(Number(rental.deposit_amount || 0), paidTotal),\n  );\n\n  await deleteRows(\n    `financial_transactions?rental_id=eq.${rental.id}&status=in.(pending,overdue,cancelled)`,\n  );\n\n  const description = `Locação ${rental.code}${rental.event_name ? ` — ${rental.event_name}` : ""}`;\n  const rows: Array<Record<string, unknown>> = [];\n  const extraReceived = Math.max(0, desiredReceived - paidTotal);\n\n  if (extraReceived > 0) {\n    rows.push({\n      organization_id: org,\n      rental_id: rental.id,\n      client_id: rental.client_id,\n      type: "income",\n      category: paidTotal > 0 ? "rental_payment" : "rental_deposit",\n      description: paidTotal > 0 ? `${description} — pagamento` : `${description} — entrada`,\n      amount: extraReceived,\n      status: "paid",\n      paid_at: new Date().toISOString(),\n      payment_method: rental.payment_method,\n    });\n  }\n\n  const effectiveReceived = paidTotal + extraReceived;\n  const remaining = Math.max(0, rental.total - effectiveReceived);\n  if (remaining > 0) {\n    rows.push({\n      organization_id: org,\n      rental_id: rental.id,\n      client_id: rental.client_id,\n      type: "income",\n      category: "rental",\n      description,\n      amount: remaining,\n      status: "pending",\n      due_date: rental.due_at ? rental.due_at.slice(0, 10) : null,\n      payment_method: rental.payment_method,\n    });\n  }\n\n  if (rows.length) {\n    await rest("financial_transactions", {\n      method: "POST",\n      headers: { Prefer: "return=minimal" },\n      body: JSON.stringify(rows),\n    });\n  }\n\n  return { paidTotal: effectiveReceived, remaining };\n}\n\nexport async function createRentalOperational'''
s = regex_once(
    s,
    r'async function rebuildRentalFinance\(rental: \{.*?\n\}\n\nexport async function createRentalOperational',
    new_rebuild,
    "preserve paid rental finance",
)

# Include due date in finance generation calls.
s = s.replace(
    '      payment_method: payload.payment_method,\n    });',
    '      payment_method: payload.payment_method,\n      due_at: payload.due_at,\n    });',
)
s = s.replace(
    '    payment_method: data.payment_method,\n  });',
    '    payment_method: data.payment_method,\n    due_at: data.due_at,\n  });',
)

# Normalize rental payment state and prevent reducing already-paid money before PATCH.
needle = '''  const now = new Date();\n  const status =\n    new Date(data.pickup_at) > now ? "reserved" : new Date(data.due_at) < now ? "late" : "active";\n  const rows = await rest<OperationalRental[]>(`rentals?id=eq.${rental.id}&select=*`, {\n    method: "PATCH",\n    headers: { Prefer: "return=representation" },\n    body: JSON.stringify({ ...data, status }),\n  });'''
replacement = '''  const paidRows = await rest<Array<{ amount: number }>>(\n    `financial_transactions?rental_id=eq.${rental.id}&status=eq.paid&select=amount`,\n  );\n  const alreadyPaid = paidRows.reduce((sum, item) => sum + Number(item.amount || 0), 0);\n  if (data.total + 0.0001 < alreadyPaid) {\n    throw new Error(\n      `Já existem ${alreadyPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} recebidos. Ajuste o total ou faça o estorno no Financeiro antes de reduzir a locação.`,\n    );\n  }\n\n  const received = Math.min(data.total, Math.max(Number(data.deposit_amount || 0), alreadyPaid));\n  const paymentStatus =\n    data.total <= 0 || received >= data.total ? "paid" : received > 0 ? "partial" : "pending";\n  const normalized = { ...data, deposit_amount: received, payment_status: paymentStatus };\n\n  const now = new Date();\n  const status =\n    new Date(data.pickup_at) > now ? "reserved" : new Date(data.due_at) < now ? "late" : "active";\n  const rows = await rest<OperationalRental[]>(`rentals?id=eq.${rental.id}&select=*`, {\n    method: "PATCH",\n    headers: { Prefer: "return=representation" },\n    body: JSON.stringify({ ...normalized, status }),\n  });'''
s = replace_once(s, needle, replacement, "normalize edited rental payment")
s = replace_once(
    s,
    '    deposit_amount: data.deposit_amount,\n    payment_status: data.payment_status,',
    '    deposit_amount: normalized.deposit_amount,\n    payment_status: normalized.payment_status,',
    "finance uses normalized rental payment",
)

# On failed create, restore radio statuses after deleting the partially-created rental.
s = replace_once(
    s,
    '    if (rentalId) await deleteRows(`rentals?id=eq.${rentalId}`).catch(() => undefined);\n    throw error;',
    '    if (rentalId) {\n      await deleteRows(`rentals?id=eq.${rentalId}`).catch(() => undefined);\n      await refreshRadioOperationalStatuses(payload.radioIds).catch(() => undefined);\n    }\n    throw error;',
    "rollback radio statuses on failed rental create",
)
p.write_text(s)

# ---- locacoes.nova.tsx -----------------------------------------------------
p = Path("src/routes/locacoes.nova.tsx")
s = p.read_text()
s = replace_once(
    s,
    '  blockedRadioIdsForPeriod,\n  createRentalOperational,',
    '  accessoryAvailabilityForPeriod,\n  blockedRadioIdsForPeriod,\n  createRentalOperational,',
    "import accessory availability",
)
s = replace_once(
    s,
    '  const [blocked, setBlocked] = useState<Set<string>>(new Set());\n  const [loadingAvailability, setLoadingAvailability] = useState(false);',
    '  const [blocked, setBlocked] = useState<Set<string>>(new Set());\n  const [accessoryAvailability, setAccessoryAvailability] = useState<Record<string, number>>({});\n  const [loadingAvailability, setLoadingAvailability] = useState(false);',
    "accessory availability state",
)
old_effect = '''    blockedRadioIdsForPeriod(new Date(pickup).toISOString(), new Date(due).toISOString())\n      .then((ids) => {\n        if (cancelled) return;\n        setBlocked(ids);\n        setSelected((current) => current.filter((id) => !ids.has(id)));\n      })'''
new_effect = '''    Promise.all([\n      blockedRadioIdsForPeriod(new Date(pickup).toISOString(), new Date(due).toISOString()),\n      accessoryAvailabilityForPeriod(new Date(pickup).toISOString(), new Date(due).toISOString()),\n    ])\n      .then(([ids, availability]) => {\n        if (cancelled) return;\n        setBlocked(ids);\n        setAccessoryAvailability(availability);\n        setSelected((current) => current.filter((id) => !ids.has(id)));\n        setAcc((current) =>\n          Object.fromEntries(\n            Object.entries(current).map(([id, qty]) => [id, Math.min(qty, availability[id] ?? qty)]),\n          ),\n        );\n      })'''
s = replace_once(s, old_effect, new_effect, "load accessory availability")
s = replace_once(
    s,
    '  const accTotal = Object.entries(acc).reduce(\n    (sum, [id, q]) => sum + Number(accessories.find((a) => a.id === id)?.unit_cost || 0) * q,\n    0,\n  );',
    '  const rentalRate = (id: string) => {\n    const accessory = accessories.find((a) => a.id === id) as\n      | (DbAccessory & { rental_rate?: number | null })\n      | undefined;\n    return Number(accessory?.rental_rate || 0);\n  };\n  const accTotal = Object.entries(acc).reduce((sum, [id, q]) => sum + rentalRate(id) * q, 0);',
    "use rental rate",
)
s = replace_once(
    s,
    '            unit_rate: Number(accessories.find((a) => a.id === id)?.unit_cost || 0),',
    '            unit_rate: rentalRate(id),',
    "save accessory rental rate",
)
s = replace_once(
    s,
    '                    const q = acc[a.id] || 0;\n                    return (',
    '                    const q = acc[a.id] || 0;\n                    const availableQty = accessoryAvailability[a.id] ?? a.stock_total;\n                    const rate = Number((a as DbAccessory & { rental_rate?: number | null }).rental_rate || 0);\n                    return (',
    "calculate displayed accessory availability",
)
s = replace_once(
    s,
    '                            {a.stock_total} em estoque · {brlExact(Number(a.unit_cost || 0))}/un',
    '                            {availableQty} disponíveis no período · {brlExact(rate)}/un',
    "display accessory availability and rental rate",
)
s = replace_once(
    s,
    '                            disabled={q >= a.stock_total}',
    '                            disabled={q >= availableQty}',
    "limit accessory quantity by period",
)
p.write_text(s)

# ---- configuracoes.tsx -----------------------------------------------------
p = Path("src/routes/configuracoes.tsx")
s = p.read_text()
s = replace_once(
    s,
    '                    <span className="mr-2 font-semibold">{brlExact(Number(a.unit_cost || 0))}</span>',
    '                    <span className="mr-2 text-right text-xs">\n                      <b className="block">Locação {brlExact(Number((a as DbAccessory & { rental_rate?: number | null }).rental_rate || 0))}</b>\n                      <span className="text-muted-foreground">Custo {brlExact(Number(a.unit_cost || 0))}</span>\n                    </span>',
    "show accessory rental rate",
)
s = replace_once(
    s,
    '  const blank = { name: "", category: "other", stock_total: "0", unit_cost: "0", notes: "" };',
    '  const blank = { name: "", category: "other", stock_total: "0", unit_cost: "0", rental_rate: "0", notes: "" };',
    "accessory form rental rate",
)
s = replace_once(
    s,
    '        unit_cost: String(item.unit_cost || 0),\n        notes: item.notes || "",',
    '        unit_cost: String(item.unit_cost || 0),\n        rental_rate: String(Number((item as DbAccessory & { rental_rate?: number | null }).rental_rate || 0)),\n        notes: item.notes || "",',
    "load accessory rental rate",
)
s = replace_once(
    s,
    '    if (Number(f.stock_total) < 0 || Number(f.unit_cost) < 0) {\n      toast.error("Quantidade e valor não podem ser negativos");',
    '    if (Number(f.stock_total) < 0 || Number(f.unit_cost) < 0 || Number(f.rental_rate) < 0) {\n      toast.error("Quantidade e valores não podem ser negativos");',
    "validate rental rate",
)
s = replace_once(
    s,
    '      unit_cost: Number(f.unit_cost || 0),\n      notes: f.notes.trim() || null,',
    '      unit_cost: Number(f.unit_cost || 0),\n      rental_rate: Number(f.rental_rate || 0),\n      notes: f.notes.trim() || null,',
    "save rental rate",
)
s = replace_once(
    s,
    '          <Field\n            label="Valor unitário"\n            value={f.unit_cost}\n            set={(v) => setF({ ...f, unit_cost: v })}\n            type="number"\n          />',
    '          <Field\n            label="Custo unitário"\n            value={f.unit_cost}\n            set={(v) => setF({ ...f, unit_cost: v })}\n            type="number"\n          />\n          <Field\n            label="Valor de locação / un."\n            value={f.rental_rate}\n            set={(v) => setF({ ...f, rental_rate: v })}\n            type="number"\n          />',
    "accessory rental price field",
)
p.write_text(s)

print("Operational upgrade applied")
