import { requireOrganization, rest } from "./supabase-rest";
import type { RadioStatus, RentalStatus, PaymentStatus } from "./mock-data";

export type DbClient = { id:string; name:string; document:string|null; phone:string|null; email:string|null; contact_name:string|null; notes:string|null; is_active:boolean };
export type DbRadio = { id:string; code:string; serial_number:string|null; status:string; battery_status:string; battery_level:number|null; location:string|null; notes:string|null; model_id:string|null; radio_models?: { manufacturer:string; model:string } | null };
export type DbRental = { id:string; code:string; event_name:string|null; pickup_at:string; due_at:string; returned_at:string|null; status:string; subtotal:number; discount:number; surcharge:number; total:number|null; payment_status:string; payment_method:string|null; deposit_amount:number; notes:string|null; client_id:string; clients?: { name:string } | null; rental_radios?: Array<{ radio_id:string; return_status:string|null; radios?:{code:string}|null }> };
export type DbFinance = { id:string; type:string; category:string; description:string; amount:number; status:string; due_date:string|null; paid_at:string|null; payment_method:string|null; created_at:string; client_id:string|null };
export type DbMaintenance = { id:string; issue:string; status:string; opened_at:string; completed_at:string|null; technician:string|null; cost:number; notes:string|null; radio_id:string; radios?:{code:string}|null };
export type DbAccessory = { id:string; name:string; category:string; stock_total:number; unit_cost:number|null; notes:string|null; is_active:boolean };
export type DbRadioModel = { id:string; manufacturer:string; model:string; band:string|null };

export const toRadioStatus = (s:string):RadioStatus => ({available:"disponivel",rented:"locado",reserved:"reservado",maintenance:"manutencao",inactive:"inativo",lost:"inativo"}[s] as RadioStatus) || "inativo";
export const toRentalStatus = (s:string):RentalStatus => ({active:"ativa",reserved:"reservada",returned:"finalizada",late:"atrasada",cancelled:"finalizada"}[s] as RentalStatus) || "reservada";
export const toPaymentStatus = (s:string):PaymentStatus => ({paid:"pago",partial:"parcial",pending:"a_receber",cancelled:"a_receber"}[s] as PaymentStatus) || "a_receber";

export async function listClients(){ const org=await requireOrganization(); return rest<DbClient[]>(`clients?organization_id=eq.${org}&is_active=eq.true&select=*&order=name.asc`); }
export async function createClient(data:Partial<DbClient>){ const org=await requireOrganization(); return rest<DbClient[]>("clients?select=*",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...data,organization_id:org})}); }
export async function listRadioModels(){ const org=await requireOrganization(); return rest<DbRadioModel[]>(`radio_models?organization_id=eq.${org}&select=*&order=manufacturer.asc,model.asc`); }
export async function createRadioModel(data:{manufacturer:string;model:string;band?:string|null}){ const org=await requireOrganization(); return rest<DbRadioModel[]>("radio_models?select=*",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...data,organization_id:org})}); }
export async function listRadios(){ const org=await requireOrganization(); return rest<DbRadio[]>(`radios?organization_id=eq.${org}&select=*,radio_models(manufacturer,model)&order=code.asc`); }
export async function createRadio(data:Record<string,unknown>){ const org=await requireOrganization(); return rest<DbRadio[]>("radios?select=*",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...data,organization_id:org})}); }
export async function updateRadio(id:string,data:Record<string,unknown>){ return rest<DbRadio[]>(`radios?id=eq.${id}&select=*`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify(data)}); }
export async function listAccessories(){ const org=await requireOrganization(); return rest<DbAccessory[]>(`accessories?organization_id=eq.${org}&is_active=eq.true&select=*&order=name.asc`); }
export async function listRentals(){ const org=await requireOrganization(); return rest<DbRental[]>(`rentals?organization_id=eq.${org}&select=*,clients(name),rental_radios(radio_id,return_status,radios(code))&order=pickup_at.desc`); }
export async function createRental(payload:{client_id:string;event_name:string;pickup_at:string;due_at:string;status:string;subtotal:number;discount:number;surcharge:number;total:number;payment_status:string;payment_method:string|null;deposit_amount:number;notes:string|null;radioIds:string[];accessories:Array<{id:string;quantity:number;unit_rate:number}>}){
 const org=await requireOrganization();
 const existing=await rest<Array<{code:string}>>(`rentals?organization_id=eq.${org}&select=code&order=created_at.desc&limit=1`);
 const year=new Date().getFullYear(); const last=Number(existing[0]?.code?.split("-").pop()||0); const code=`LOC-${year}-${String(last+1).padStart(4,"0")}`;
 const {radioIds,accessories,...rentalData}=payload;
 const created=await rest<DbRental[]>("rentals?select=*",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...rentalData,organization_id:org,code})});
 const rental=created[0]; if(!rental) throw new Error("Falha ao criar locação");
 if(radioIds.length){ await rest("rental_radios",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(radioIds.map(id=>({rental_id:rental.id,radio_id:id,daily_rate:0,checkout_condition:"ok"})))}); await rest(`radios?id=in.(${radioIds.join(",")})`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:payload.status==="reserved"?"reserved":"rented"})}); }
 if(accessories.length){ await rest("rental_accessories",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(accessories.map(a=>({rental_id:rental.id,accessory_id:a.id,quantity:a.quantity,unit_rate:a.unit_rate})))}); }
 if(payload.total>0){ await rest("financial_transactions",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({organization_id:org,rental_id:rental.id,client_id:payload.client_id,type:"income",category:"rental",description:`Locação ${code}${payload.event_name?` — ${payload.event_name}`:""}`,amount:payload.total,status:payload.payment_status==="paid"?"paid":"pending",paid_at:payload.payment_status==="paid"?new Date().toISOString():null,payment_method:payload.payment_method})}); }
 return rental;
}
export async function listFinance(){ const org=await requireOrganization(); return rest<DbFinance[]>(`financial_transactions?organization_id=eq.${org}&select=*&order=created_at.desc`); }
export async function createFinance(data:Record<string,unknown>){ const org=await requireOrganization(); return rest<DbFinance[]>("financial_transactions?select=*",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...data,organization_id:org})}); }
export async function listMaintenance(){ const org=await requireOrganization(); return rest<DbMaintenance[]>(`maintenance_orders?organization_id=eq.${org}&select=*,radios(code)&order=opened_at.desc`); }
export async function createMaintenance(data:Record<string,unknown>){ const org=await requireOrganization(); const rows=await rest<DbMaintenance[]>("maintenance_orders?select=*",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...data,organization_id:org})}); if(data.radio_id) await updateRadio(String(data.radio_id),{status:"maintenance"}); return rows; }
export async function saveReturn(rental:DbRental, states:Record<string,"ok"|"damaged"|"missing">, notes:string){
 for(const rr of rental.rental_radios||[]){ const status=states[rr.radio_id]; if(!status) continue; await rest(`rental_radios?rental_id=eq.${rental.id}&radio_id=eq.${rr.radio_id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({return_status:status,return_notes:notes||null,returned_at:new Date().toISOString()})}); await updateRadio(rr.radio_id,{status:status==="ok"?"available":status==="damaged"?"maintenance":"lost"}); }
 await rest(`rentals?id=eq.${rental.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"returned",returned_at:new Date().toISOString()})});
}
