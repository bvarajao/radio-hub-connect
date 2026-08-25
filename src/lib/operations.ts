import { requireOrganization, rest } from "./supabase-rest";
import {
  createMaintenance,
  type DbAccessory,
  type DbClient,
  type DbFinance,
  type DbMaintenance,
  type DbRadio,
  type DbRental,
} from "./live-data";

export type OperationalRadio = DbRadio & { band: "VHF" | "UHF" };
export type OperationalClient = DbClient & {
  type?: "person" | "company";
  address?: string | null;
};
export type OperationalFinance = DbFinance & {
  rental_id?: string | null;
  maintenance_id?: string | null;
};
export type OperationalRentalAccessory = {
  accessory_id: string;
  quantity: number;
  returned_quantity: number;
  unit_rate: number;
  notes: string | null;
  accessories?: { name: string; stock_total: number } | null;
};
export type OperationalRental = DbRental & {
  rental_accessories?: OperationalRentalAccessory[];
};

const activeRentalStatuses = new Set(["reserved", "active", "late"]);
const openMaintenanceStatuses = new Set(["open", "in_progress", "waiting_parts"]);

function inFilter(values: string[]) {
  return values.join(",");
}

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(aEnd).getTime() > new Date(bStart).getTime()
  );
}

async function deleteRows(path: string) {
  return rest<unknown>(path, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

async function refreshRadioOperationalStatuses(radioIds: string[]) {
  const ids = [...new Set(radioIds.filter(Boolean))];
  if (!ids.length) return;

  const [radios, maintenance, rentalLinks] = await Promise.all([
    rest<Array<{ id: string; status: string }>>(`radios?id=in.(${inFilter(ids)})&select=id,status`),
    rest<Array<{ radio_id: string }>>(
      `maintenance_orders?radio_id=in.(${inFilter(ids)})&status=in.(open,in_progress,waiting_parts)&select=radio_id`,
    ),
    rest<Array<{ radio_id: string; rentals?: { status: string } | null }>>(
      `rental_radios?radio_id=in.(${inFilter(ids)})&select=radio_id,rentals(status)`,
    ),
  ]);

  const maintenanceIds = new Set(maintenance.map((m) => m.radio_id));
  const rentedIds = new Set(
    rentalLinks
      .filter((link) => link.rentals && ["active", "late"].includes(link.rentals.status))
      .map((link) => link.radio_id),
  );

  await Promise.all(
    radios.map(async (radio) => {
      if (["lost", "inactive"].includes(radio.status)) return;
      const nextStatus = maintenanceIds.has(radio.id)
        ? "maintenance"
        : rentedIds.has(radio.id)
          ? "rented"
          : "available";
      if (nextStatus !== radio.status) await updateRadioRecord(radio.id, { status: nextStatus });
    }),
  );
}

export async function listAllClients() {
  const org = await requireOrganization();
  return rest<OperationalClient[]>(
    `clients?organization_id=eq.${org}&select=*&order=is_active.desc,name.asc`,
  );
}

export async function updateClientRecord(id: string, data: Record<string, unknown>) {
  return rest<OperationalClient[]>(`clients?id=eq.${id}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
}

export async function removeClientSafely(id: string) {
  const rentals = await rest<Array<{ id: string }>>(`rentals?client_id=eq.${id}&select=id&limit=1`);
  if (rentals.length) {
    await updateClientRecord(id, { is_active: false });
    return { deleted: false, archived: true };
  }
  await deleteRows(`clients?id=eq.${id}`);
  return { deleted: true, archived: false };
}

export async function reactivateClient(id: string) {
  return updateClientRecord(id, { is_active: true });
}

export async function updateRadioRecord(id: string, data: Record<string, unknown>) {
  return rest<OperationalRadio[]>(`radios?id=eq.${id}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
}

export async function removeRadioSafely(radio: OperationalRadio) {
  const rentalLinks = await rest<Array<{ rental_id: string }>>(
    `rental_radios?radio_id=eq.${radio.id}&select=rental_id`,
  );
  if (rentalLinks.length) {
    const ids = rentalLinks.map((r) => r.rental_id);
    const current = await rest<Array<{ id: string; status: string }>>(
      `rentals?id=in.(${inFilter(ids)})&status=in.(reserved,active,late)&select=id,status&limit=1`,
    );
    if (current.length)
      throw new Error("Este rádio está comprometido em uma locação e não pode ser excluído agora.");
  }

  const maintenance = await rest<Array<{ id: string; status: string }>>(
    `maintenance_orders?radio_id=eq.${radio.id}&select=id,status`,
  );
  if (maintenance.some((m) => openMaintenanceStatuses.has(m.status))) {
    throw new Error(
      "Este rádio possui uma manutenção em aberto. Finalize ou cancele a ordem antes de inativá-lo.",
    );
  }

  if (rentalLinks.length || maintenance.length) {
    await updateRadioRecord(radio.id, { status: "inactive" });
    return { deleted: false, archived: true };
  }

  await deleteRows(`radios?id=eq.${radio.id}`);
  return { deleted: true, archived: false };
}

export async function listRadioRentalHistory(radioId: string) {
  return rest<
    Array<{
      rental_id: string;
      return_status: string | null;
      returned_at: string | null;
      rentals?: {
        code: string;
        event_name: string | null;
        pickup_at: string;
        due_at: string;
        status: string;
        total: number | null;
        clients?: { name: string } | null;
      } | null;
    }>
  >(
    `rental_radios?radio_id=eq.${radioId}&select=rental_id,return_status,returned_at,rentals(code,event_name,pickup_at,due_at,status,total,clients(name))&order=created_at.desc`,
  );
}

export async function listAllAccessories() {
  const org = await requireOrganization();
  return rest<DbAccessory[]>(
    `accessories?organization_id=eq.${org}&select=*&order=is_active.desc,name.asc`,
  );
}

export async function updateAccessoryRecord(id: string, data: Record<string, unknown>) {
  return rest<DbAccessory[]>(`accessories?id=eq.${id}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
}

export async function removeAccessorySafely(id: string) {
  const usage = await rest<Array<{ rental_id: string }>>(
    `rental_accessories?accessory_id=eq.${id}&select=rental_id&limit=1`,
  );
  if (usage.length) {
    await updateAccessoryRecord(id, { is_active: false });
    return { deleted: false, archived: true };
  }
  await deleteRows(`accessories?id=eq.${id}`);
  return { deleted: true, archived: false };
}

export async function syncFinanceStatuses() {
  const org = await requireOrganization();
  const today = new Date().toISOString().slice(0, 10);
  await rest(
    `financial_transactions?organization_id=eq.${org}&status=eq.pending&due_date=lt.${today}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "overdue" }),
    },
  );
}

export async function listFinanceOperational() {
  await syncFinanceStatuses();
  const org = await requireOrganization();
  return rest<OperationalFinance[]>(
    `financial_transactions?organization_id=eq.${org}&select=*&order=created_at.desc`,
  );
}

export async function updateFinanceRecord(id: string, data: Record<string, unknown>) {
  const next = { ...data };
  if (data.status === "paid" && !data.paid_at) next.paid_at = new Date().toISOString();
  if (data.status !== "paid" && Object.prototype.hasOwnProperty.call(data, "status"))
    next.paid_at = null;
  return rest<OperationalFinance[]>(`financial_transactions?id=eq.${id}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(next),
  });
}

export async function markFinancePaid(id: string) {
  return updateFinanceRecord(id, { status: "paid", paid_at: new Date().toISOString() });
}

export async function removeFinanceSafely(item: OperationalFinance) {
  if (item.rental_id || item.maintenance_id) {
    await updateFinanceRecord(item.id, { status: "cancelled" });
    return { deleted: false, archived: true };
  }
  await deleteRows(`financial_transactions?id=eq.${item.id}`);
  return { deleted: true, archived: false };
}

export async function updateMaintenanceRecord(id: string, data: Record<string, unknown>) {
  const currentRows = await rest<DbMaintenance[]>(
    `maintenance_orders?id=eq.${id}&select=*&limit=1`,
  );
  const current = currentRows[0];
  if (!current) throw new Error("Ordem de manutenção não encontrada.");

  const next = { ...data };
  const status = String(data.status ?? current.status);
  if (["completed", "cancelled"].includes(status) && !data.completed_at) {
    next.completed_at = new Date().toISOString();
  }
  if (openMaintenanceStatuses.has(status)) next.completed_at = null;

  const rows = await rest<DbMaintenance[]>(`maintenance_orders?id=eq.${id}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(next),
  });

  if (openMaintenanceStatuses.has(status)) {
    await updateRadioRecord(current.radio_id, { status: "maintenance" });
  } else {
    const others = await rest<Array<{ id: string }>>(
      `maintenance_orders?radio_id=eq.${current.radio_id}&id=neq.${id}&status=in.(open,in_progress,waiting_parts)&select=id&limit=1`,
    );
    if (!others.length) {
      const radioRows = await rest<Array<{ status: string }>>(
        `radios?id=eq.${current.radio_id}&select=status&limit=1`,
      );
      if (radioRows[0]?.status === "maintenance")
        await updateRadioRecord(current.radio_id, { status: "available" });
    }
  }

  return rows;
}

export async function removeMaintenanceRecord(item: DbMaintenance) {
  await deleteRows(`maintenance_orders?id=eq.${item.id}`);
  const others = await rest<Array<{ id: string }>>(
    `maintenance_orders?radio_id=eq.${item.radio_id}&status=in.(open,in_progress,waiting_parts)&select=id&limit=1`,
  );
  if (!others.length) {
    const radioRows = await rest<Array<{ status: string }>>(
      `radios?id=eq.${item.radio_id}&select=status&limit=1`,
    );
    if (radioRows[0]?.status === "maintenance")
      await updateRadioRecord(item.radio_id, { status: "available" });
  }
}

export async function createMaintenanceOperational(data: Record<string, unknown>) {
  const radioId = String(data.radio_id || "");
  if (!radioId) throw new Error("Selecione o rádio.");
  const radios = await rest<Array<{ status: string }>>(
    `radios?id=eq.${radioId}&select=status&limit=1`,
  );
  if (["rented", "reserved", "lost", "inactive"].includes(radios[0]?.status || "")) {
    throw new Error("Este rádio não pode entrar em manutenção no status atual.");
  }
  return createMaintenance(data);
}

export async function syncRentalStatuses() {
  const org = await requireOrganization();
  const now = new Date().toISOString();
  const starting = await rest<Array<{ id: string }>>(
    `rentals?organization_id=eq.${org}&status=eq.reserved&pickup_at=lte.${encodeURIComponent(now)}&select=id`,
  );
  if (starting.length) {
    const ids = starting.map((r) => r.id);
    await rest(`rentals?id=in.(${inFilter(ids)})`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "active" }),
    });
    const links = await rest<Array<{ radio_id: string }>>(
      `rental_radios?rental_id=in.(${inFilter(ids)})&select=radio_id`,
    );
    if (links.length) {
      const radioIds = [...new Set(links.map((x) => x.radio_id))];
      await rest(`radios?id=in.(${inFilter(radioIds)})&status=eq.available`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "rented" }),
      });
    }
  }

  await rest(
    `rentals?organization_id=eq.${org}&status=eq.active&due_at=lt.${encodeURIComponent(now)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "late" }),
    },
  );
}

export async function listRentalsOperational() {
  await syncRentalStatuses();
  const org = await requireOrganization();
  return rest<OperationalRental[]>(
    `rentals?organization_id=eq.${org}&select=*,clients(name),rental_radios(radio_id,return_status,returned_at,radios(code,model_id,band)),rental_accessories(accessory_id,quantity,returned_quantity,unit_rate,notes,accessories(name,stock_total))&order=pickup_at.desc`,
  );
}

export async function getRentalOperational(code: string) {
  const org = await requireOrganization();
  const rows = await rest<OperationalRental[]>(
    `rentals?organization_id=eq.${org}&code=eq.${encodeURIComponent(code)}&select=*,clients(name),rental_radios(radio_id,return_status,returned_at,radios(code,model_id,band)),rental_accessories(accessory_id,quantity,returned_quantity,unit_rate,notes,accessories(name,stock_total))&limit=1`,
  );
  return rows[0] ?? null;
}

export async function blockedRadioIdsForPeriod(
  pickupAt: string,
  dueAt: string,
  excludeRentalId?: string,
) {
  const rentals = await listRentalsOperational();
  const blocked = new Set<string>();
  for (const rental of rentals) {
    if (excludeRentalId && rental.id === excludeRentalId) continue;
    if (!activeRentalStatuses.has(rental.status)) continue;
    if (!overlap(pickupAt, dueAt, rental.pickup_at, rental.due_at)) continue;
    for (const rr of rental.rental_radios || []) blocked.add(rr.radio_id);
  }
  return blocked;
}

async function nextRentalCode() {
  const org = await requireOrganization();
  const year = new Date().getFullYear();
  const rows = await rest<Array<{ code: string }>>(
    `rentals?organization_id=eq.${org}&code=like.LOC-${year}-%25&select=code&order=code.desc&limit=1`,
  );
  const last = Number(rows[0]?.code?.split("-").pop() || 0);
  return `LOC-${year}-${String(last + 1).padStart(4, "0")}`;
}

async function rebuildRentalFinance(rental: {
  id: string;
  code: string;
  client_id: string;
  event_name: string | null;
  total: number;
  deposit_amount: number;
  payment_status: string;
  payment_method: string | null;
}) {
  const org = await requireOrganization();
  await deleteRows(`financial_transactions?rental_id=eq.${rental.id}`);
  if (rental.total <= 0) return;

  const description = `Locação ${rental.code}${rental.event_name ? ` — ${rental.event_name}` : ""}`;
  const paid = rental.payment_status === "paid";
  const deposit = Math.min(Math.max(Number(rental.deposit_amount || 0), 0), rental.total);
  const rows: Array<Record<string, unknown>> = [];

  if (paid) {
    rows.push({
      organization_id: org,
      rental_id: rental.id,
      client_id: rental.client_id,
      type: "income",
      category: "rental",
      description,
      amount: rental.total,
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: rental.payment_method,
    });
  } else {
    if (deposit > 0) {
      rows.push({
        organization_id: org,
        rental_id: rental.id,
        client_id: rental.client_id,
        type: "income",
        category: "rental_deposit",
        description: `${description} — entrada`,
        amount: deposit,
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: rental.payment_method,
      });
    }
    if (rental.total - deposit > 0) {
      rows.push({
        organization_id: org,
        rental_id: rental.id,
        client_id: rental.client_id,
        type: "income",
        category: "rental",
        description,
        amount: rental.total - deposit,
        status: "pending",
        payment_method: rental.payment_method,
      });
    }
  }

  if (rows.length) {
    await rest("financial_transactions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
  }
}

export async function createRentalOperational(payload: {
  client_id: string;
  event_name: string | null;
  pickup_at: string;
  due_at: string;
  subtotal: number;
  discount: number;
  surcharge: number;
  total: number;
  payment_status: string;
  payment_method: string | null;
  deposit_amount: number;
  notes: string | null;
  radioIds: string[];
  accessories: Array<{ id: string; quantity: number; unit_rate: number }>;
}) {
  const org = await requireOrganization();
  if (!payload.client_id) throw new Error("Selecione o cliente.");
  if (!payload.radioIds.length) throw new Error("Selecione pelo menos um rádio.");
  if (new Date(payload.due_at) <= new Date(payload.pickup_at)) {
    throw new Error("A devolução precisa ser posterior à retirada.");
  }

  const blocked = await blockedRadioIdsForPeriod(payload.pickup_at, payload.due_at);
  const conflict = payload.radioIds.find((id) => blocked.has(id));
  if (conflict)
    throw new Error(
      "Um dos rádios selecionados já está comprometido neste período. Atualize a seleção.",
    );

  const code = await nextRentalCode();
  const status = new Date(payload.pickup_at) > new Date() ? "reserved" : "active";
  const { radioIds, accessories, ...rentalData } = payload;
  let rentalId: string | null = null;

  try {
    const created = await rest<OperationalRental[]>("rentals?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...rentalData, organization_id: org, code, status }),
    });
    const rental = created[0];
    if (!rental) throw new Error("Falha ao criar locação.");
    rentalId = rental.id;

    await rest("rental_radios", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(
        radioIds.map((radioId) => ({
          rental_id: rental.id,
          radio_id: radioId,
          daily_rate: 0,
          checkout_condition: "ok",
        })),
      ),
    });

    if (status === "active") {
      await rest(`radios?id=in.(${inFilter(radioIds)})`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "rented" }),
      });
    }

    if (accessories.length) {
      await rest("rental_accessories", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(
          accessories.map((a) => ({
            rental_id: rental.id,
            accessory_id: a.id,
            quantity: a.quantity,
            unit_rate: a.unit_rate,
          })),
        ),
      });
    }

    await rebuildRentalFinance({
      id: rental.id,
      code,
      client_id: payload.client_id,
      event_name: payload.event_name,
      total: payload.total,
      deposit_amount: payload.deposit_amount,
      payment_status: payload.payment_status,
      payment_method: payload.payment_method,
    });

    return rental;
  } catch (error) {
    if (rentalId) await deleteRows(`rentals?id=eq.${rentalId}`).catch(() => undefined);
    throw error;
  }
}

export async function updateRentalOperational(
  rental: OperationalRental,
  data: {
    client_id: string;
    event_name: string | null;
    pickup_at: string;
    due_at: string;
    subtotal: number;
    discount: number;
    surcharge: number;
    total: number;
    payment_status: string;
    payment_method: string | null;
    deposit_amount: number;
    notes: string | null;
  },
) {
  if (["returned", "cancelled"].includes(rental.status))
    throw new Error("Esta locação já foi encerrada e não pode ser editada.");
  if (new Date(data.due_at) <= new Date(data.pickup_at))
    throw new Error("A devolução precisa ser posterior à retirada.");

  const radioIds = (rental.rental_radios || []).map((r) => r.radio_id);
  const blocked = await blockedRadioIdsForPeriod(data.pickup_at, data.due_at, rental.id);
  if (radioIds.some((id) => blocked.has(id)))
    throw new Error("A nova data conflita com outra reserva de um dos rádios.");

  const now = new Date();
  const status =
    new Date(data.pickup_at) > now ? "reserved" : new Date(data.due_at) < now ? "late" : "active";
  const rows = await rest<OperationalRental[]>(`rentals?id=eq.${rental.id}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...data, status }),
  });

  if (radioIds.length) await refreshRadioOperationalStatuses(radioIds);

  await rebuildRentalFinance({
    id: rental.id,
    code: rental.code,
    client_id: data.client_id,
    event_name: data.event_name,
    total: data.total,
    deposit_amount: data.deposit_amount,
    payment_status: data.payment_status,
    payment_method: data.payment_method,
  });

  return rows;
}

export async function replaceRentalRadios(rental: OperationalRental, nextRadioIds: string[]) {
  if (["returned", "cancelled"].includes(rental.status))
    throw new Error("Não é possível alterar equipamentos de uma locação encerrada.");
  if (!nextRadioIds.length) throw new Error("A locação precisa ter pelo menos um rádio.");

  const blocked = await blockedRadioIdsForPeriod(rental.pickup_at, rental.due_at, rental.id);
  if (nextRadioIds.some((id) => blocked.has(id)))
    throw new Error("Um dos rádios escolhidos está comprometido neste período.");

  const currentIds = (rental.rental_radios || []).map((r) => r.radio_id);
  const removed = currentIds.filter((id) => !nextRadioIds.includes(id));
  const added = nextRadioIds.filter((id) => !currentIds.includes(id));

  if (removed.length) {
    await deleteRows(`rental_radios?rental_id=eq.${rental.id}&radio_id=in.(${inFilter(removed)})`);
  }

  if (added.length) {
    await rest("rental_radios", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(
        added.map((radioId) => ({
          rental_id: rental.id,
          radio_id: radioId,
          daily_rate: 0,
          checkout_condition: "ok",
        })),
      ),
    });
  }

  if (removed.length || added.length) {
    await refreshRadioOperationalStatuses([...removed, ...added]);
  }
}

export async function cancelRental(rental: OperationalRental) {
  if (rental.status === "returned")
    throw new Error("Uma locação já devolvida não pode ser cancelada.");
  if (rental.status === "cancelled") return;

  await rest(`rentals?id=eq.${rental.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "cancelled" }),
  });

  const radioIds = (rental.rental_radios || []).map((r) => r.radio_id);
  if (radioIds.length) await refreshRadioOperationalStatuses(radioIds);

  await rest(`financial_transactions?rental_id=eq.${rental.id}&status=in.(pending,overdue)`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export async function saveReturnOperational(
  rental: OperationalRental,
  radioStates: Record<string, "ok" | "damaged" | "missing">,
  accessoryReturns: Record<string, number>,
  notes: string,
) {
  if (["returned", "cancelled"].includes(rental.status))
    throw new Error("Esta locação já está encerrada.");

  const now = new Date().toISOString();
  for (const rr of rental.rental_radios || []) {
    const status = radioStates[rr.radio_id];
    if (!status) throw new Error("Confira todos os rádios antes de finalizar.");

    await rest(`rental_radios?rental_id=eq.${rental.id}&radio_id=eq.${rr.radio_id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        return_status: status,
        return_notes: notes || null,
        returned_at: now,
      }),
    });

    if (status === "ok") {
      await updateRadioRecord(rr.radio_id, { status: "available" });
    } else if (status === "missing") {
      await updateRadioRecord(rr.radio_id, { status: "lost" });
    } else {
      await updateRadioRecord(rr.radio_id, { status: "maintenance" });
      const existing = await rest<Array<{ id: string }>>(
        `maintenance_orders?radio_id=eq.${rr.radio_id}&status=in.(open,in_progress,waiting_parts)&select=id&limit=1`,
      );
      if (!existing.length) {
        await createMaintenance({
          radio_id: rr.radio_id,
          issue: `Avaria identificada na devolução ${rental.code}`,
          status: "open",
          cost: 0,
          notes: notes || null,
        });
      }
    }
  }

  for (const accessory of rental.rental_accessories || []) {
    const returned = accessoryReturns[accessory.accessory_id];
    if (returned == null || returned < 0 || returned > accessory.quantity) {
      throw new Error(
        `Confira a quantidade devolvida de ${accessory.accessories?.name || "um acessório"}.`,
      );
    }
    const returnNote =
      returned < accessory.quantity
        ? `Devolvidos ${returned} de ${accessory.quantity}.${notes ? ` ${notes}` : ""}`
        : notes || accessory.notes;
    await rest(
      `rental_accessories?rental_id=eq.${rental.id}&accessory_id=eq.${accessory.accessory_id}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ returned_quantity: returned, notes: returnNote || null }),
      },
    );
  }

  await rest(`rentals?id=eq.${rental.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "returned", returned_at: now }),
  });
}
