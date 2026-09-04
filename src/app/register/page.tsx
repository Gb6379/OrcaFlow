"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { registerAction } from "../actions";
import { TRADES } from "@/lib/format";

function RegisterForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const plan = useSearchParams().get("plan") || "";

  async function onSubmit(formData: FormData) {
    setError("");
    setPending(true);
    try {
      const res = await registerAction(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (res?.ok) window.location.assign(res.next);
    } catch {
      setError("Não foi possível criar a conta. Tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="paper-grid min-h-screen px-5 py-8">
      <div className="mx-auto max-w-xl">
        <Logo />
        <h1 className="mt-8 font-serif text-4xl">Abra a oficina digital em 1 minuto</h1>
        <p className="mt-2 text-mute">
          {plan
            ? "Depois do cadastro você cai direto no pagamento do plano."
            : "Sem escolher plano você entra no Inicial: R$ 0, com 5 orçamentos por mês."}
        </p>
        <form action={onSubmit} className="card mt-8 space-y-4 p-6">
          <input type="hidden" name="plan" value={plan} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Seu nome</label>
              <input name="name" required className="field" placeholder="Ricardo Silva" />
            </div>
            <div>
              <label className="label">Empresa</label>
              <input name="companyName" required className="field" placeholder="Silva Climatização" />
            </div>
          </div>
          <div>
            <label className="label">Ofício</label>
            <select name="trade" className="field" defaultValue="Técnico de ar-condicionado">
              {TRADES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input name="phone" className="field" placeholder="11988881010" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input name="email" type="email" required className="field" />
          </div>
          <div>
            <label className="label">Senha</label>
            <input name="password" type="password" minLength={6} required className="field" />
          </div>
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Criando..." : plan ? "Criar conta e pagar" : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-sm text-mute">
          Já tem conta?{" "}
          <a className="text-forest underline" href="/login">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
