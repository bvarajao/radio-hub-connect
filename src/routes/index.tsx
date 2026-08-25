import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RadioTower, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSession, signIn, signUp } from "@/lib/supabase-rest";

export const Route = createFileRoute("/")({ component: LoginPage });
const highlights=[{icon:Zap,title:"Locação em 1 clique",text:"Do dashboard direto para uma nova locação."},{icon:RadioTower,title:"Controle por patrimônio",text:"Cada rádio rastreado individualmente."},{icon:ShieldCheck,title:"Devolução conferida",text:"Checklist rápido e registro de avarias."}];
function LoginPage(){
 const nav=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState(""); const [create,setCreate]=useState(false); const [busy,setBusy]=useState(false);
 useEffect(()=>{if(getSession()) nav({to:"/dashboard",replace:true});},[nav]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);try{ if(create){const r=await signUp(email,password,name);if(!r.access_token){toast.success("Cadastro criado. Confirme seu e-mail e depois entre.");setCreate(false);return;}}else await signIn(email,password); nav({to:"/dashboard",replace:true});}catch(err){toast.error(err instanceof Error?err.message:"Não foi possível entrar");}finally{setBusy(false);}}
 return <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
  <div className="gradient-night hidden flex-col justify-between p-10 lg:flex"><Logo tone="light"/><div className="max-w-md space-y-6"><h1 className="font-display text-4xl leading-tight font-extrabold text-sidebar-foreground">A operação dos seus rádios sob controle total.</h1><p className="text-sm leading-relaxed text-sidebar-foreground/65">Estoque, locações, devoluções e financeiro em um único painel.</p><ul className="space-y-4">{highlights.map(({icon:Icon,title,text})=><li key={title} className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-accent"><Icon className="h-4.5 w-4.5 text-sidebar-primary"/></span><span><b className="block text-sm text-sidebar-foreground">{title}</b><span className="text-xs text-sidebar-foreground/60">{text}</span></span></li>)}</ul></div><p className="text-xs text-sidebar-foreground/40">© 2026 Papo de Produtor</p></div>
  <div className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-sm"><div className="mb-8 lg:hidden"><Logo/></div><h2 className="font-display text-2xl font-extrabold">{create?"Criar primeiro acesso":"Bem-vindo"}</h2><p className="mt-1 text-sm text-muted-foreground">{create?"Cadastre o administrador da Papo de Produtor.":"Entre para gerenciar a operação."}</p><form className="mt-8 space-y-4" onSubmit={submit}>{create&&<div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={e=>setName(e.target.value)} className="h-11" required/></div>}<div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-11" required/></div><div className="space-y-1.5"><Label>Senha</Label><Input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="h-11" required/></div><Button variant="hero" size="xl" className="w-full" disabled={busy}>{busy?"Aguarde...":create?"Criar acesso":"Entrar"}</Button></form><button className="mt-5 w-full text-sm font-medium text-primary hover:underline" onClick={()=>setCreate(v=>!v)}>{create?"Já tenho acesso":"Primeiro acesso? Criar conta"}</button></div></div>
 </div>;
}
