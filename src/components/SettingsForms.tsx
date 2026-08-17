"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelPlanAction, openBillingPortalAction, saveMercadoPagoTokenAction, saveMpReceiveTokenAction } from "@/app/billing-actions";
import { updateSettingsAction } from "@/app/actions";
import type { Plan } from "@/lib/plans";

type UserFields = {
  name: string;
  companyName: string;
  phone: string;
  whatsapp: string;
  cnpj: string;
  address: string;
  trade: string;
  validityDays: number;
  followUpDay0: string;
  followUpDay2: string;
  followUpDay5: string;
  plan: string;
  planStatus: string;
  planPeriodEnd: string | null;
  pixKey: string;
  pixKeyType: string;
  pixName: string;
  pixCity: string;
  hasStripe: boolean;
  mpHint: string;
  mpReceiveHint: string;
};

export function SettingsForms({
  user,
  trades,
  plans,
}: {
  user: UserFields;
  trades: string[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [saved, setSaved] = useState("");

  async function save(formData: FormData) {
    const res = await updateSettingsAction(formData);
    setSaved(res.error || "Salvo.");
    router.refresh();
  }

  return (
    <>
      <form action={save} className="card space-y-4 p-6">
        <h2 className="font-serif text-2xl">Empresa</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Seu nome</label>
            <input name="name" className="field" defaultValue={user.name} />
          </div>
          <div>
            <label className="label">Empresa</label>
            <input name="companyName" className="field" defaultValue={user.companyName} />
          </div>
        </div>
        <div>
          <label className="label">Ofício</label>
          <select name="trade" className="field" defaultValue={user.trade}>
            {trades.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Telefone</label>
            <input name="phone" className="field" defaultValue={user.phone} />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input name="whatsapp" className="field" defaultValue={user.whatsapp} />
          </div>
        </div>
        <div>
          <label className="label">CNPJ</label>
          <input name="cnpj" className="field" defaultValue={user.cnpj} />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input name="address" className="field" defaultValue={user.address} />
        </div>
        <div>
          <label className="label">Validade padrão (dias)</label>
          <input name="validityDays" type="number" min={1} className="field" defaultValue={user.validityDays} />
        </div>
        <button className="btn-forest">Salvar empresa</button>
        {saved && <span className="ml-3 text-sm text-forest">{saved}</span>}
      </form>

      <form action={save} className="card space-y-4 p-6">
        <h2 className="font-serif text-2xl">Pix para receber orçamento</h2>
        <p className="text-sm text-mute">
          Com a chave Pix, o cliente toca em <strong>Aceitar e pagar</strong> e já vê o QR. Se você não preencher, usamos o WhatsApp ou o e-mail da conta. O dinheiro cai na sua chave, não no OrçaFlow.
        </p>
        <div>
          <label className="label">Tipo da chave</label>
          <select name="pixKeyType" className="field" defaultValue={user.pixKeyType}>
            <option value="email">E-mail</option>
            <option value="phone">Telefone</option>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="random">Chave aleatória</option>
          </select>
        </div>
        <div>
          <label className="label">Chave Pix</label>
          <input name="pixKey" className="field" defaultValue={user.pixKey} placeholder="sua chave" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome no Pix</label>
            <input name="pixName" className="field" defaultValue={user.pixName} placeholder={user.companyName} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input name="pixCity" className="field" defaultValue={user.pixCity} />
          </div>
        </div>
        <button className="btn-forest">Salvar Pix</button>
      </form>

      <MpReceiveForm hint={user.mpReceiveHint} />

      <form action={save} className="card space-y-4 p-6">
        <h2 className="font-serif text-2xl">Mensagens de follow-up</h2>
        <p className="text-sm text-mute">
          Use {"{cliente}"}, {"{servico}"}, {"{total}"}, {"{numero}"} e {"{link}"}.
        </p>
        <div>
          <label className="label">Dia 0</label>
          <textarea name="followUpDay0" className="field min-h-24" defaultValue={user.followUpDay0} />
        </div>
        <div>
          <label className="label">Dia 2</label>
          <textarea name="followUpDay2" className="field min-h-24" defaultValue={user.followUpDay2} />
        </div>
        <div>
          <label className="label">Dia 5</label>
          <textarea name="followUpDay5" className="field min-h-24" defaultValue={user.followUpDay5} />
        </div>
        <button className="btn-forest">Salvar mensagens</button>
      </form>

      <MpCredentialsForm hint={user.mpHint} />

      <section>
        <h2 className="font-serif text-2xl">Plano e cobrança</h2>
        <p className="mt-1 text-sm text-mute">
          Plano atual: <strong>{user.plan}</strong>
          {user.planPeriodEnd ? ` · válido até ${new Date(user.planPeriodEnd).toLocaleDateString("pt-BR")}` : ""}
          {user.planStatus !== "active" ? ` · ${user.planStatus}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.hasStripe && (
            <form action={openBillingPortalAction}>
              <button className="btn-ghost">Gerenciar cartão na Stripe</button>
            </form>
          )}
          {user.plan !== "free" && (
            <form action={cancelPlanAction}>
              <button className="btn-ghost">Cancelar e voltar ao grátis</button>
            </form>
          )}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className={`card p-5 ${user.plan === plan.id ? "ring-2 ring-forest" : ""}`}>
              <p className="font-medium">{plan.name}</p>
              <p className="font-serif text-3xl">{plan.priceLabel}</p>
              <ul className="mt-3 space-y-1 text-sm text-mute">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {user.plan === plan.id ? (
                <p className="btn-ghost mt-4 w-full text-center">Plano atual</p>
              ) : plan.id === "free" ? (
                <form action={cancelPlanAction}>
                  <button className="btn-ghost mt-4 w-full">Voltar ao grátis</button>
                </form>
              ) : (
                <a href={`/checkout?plan=${plan.id}`} className="btn-primary mt-4 w-full">
                  Assinar
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function MpReceiveForm({ hint }: { hint: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function save(formData: FormData) {
    const res = await saveMpReceiveTokenAction(formData);
    setMsg("error" in res && res.error ? res.error : "Token salvo. O cliente já pode aceitar e pagar no orçamento.");
    router.refresh();
  }

  return (
    <form action={save} className="card space-y-4 p-6">
      <h2 className="font-serif text-2xl">Aceitar e pagar (Mercado Pago)</h2>
      <p className="text-sm text-mute">
        Access Token da <strong>sua</strong> conta — não o do OrçaFlow. O cliente toca em Aceitar e pagar, escolhe Pix ou cartão, o dinheiro cai para você e o orçamento vira <strong>pago</strong> sozinho.
      </p>
      {hint ? (
        <p className="text-sm text-forest">Recebimento configurado: {hint}</p>
      ) : (
        <p className="text-sm text-ember">Sem este token, o cliente só vê Pix se você cadastrou a chave acima — e o pago continua manual.</p>
      )}
      <div>
        <label className="label">Access Token da sua conta</label>
        <input
          name="mpReceiveToken"
          className="field font-mono text-xs"
          type="password"
          placeholder="APP_USR-..."
          required
        />
      </div>
      <p className="text-xs text-mute">
        Painel:{" "}
        <a className="underline" href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer">
          developers.mercadopago.com.br
        </a>{" "}
        → sua aplicação → Credenciais. Use produção para dinheiro de verdade.
      </p>
      {msg && <p className="text-sm">{msg}</p>}
      <button className="btn-forest">Salvar recebimento</button>
    </form>
  );
}

function MpCredentialsForm({ hint }: { hint: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function save(formData: FormData) {
    const res = await saveMercadoPagoTokenAction(formData);
    setMsg("error" in res && res.error ? res.error : "Token salvo. O checkout agora abre o Mercado Pago de verdade.");
    router.refresh();
  }

  return (
    <form action={save} className="card space-y-4 p-6">
      <h2 className="font-serif text-2xl">Mercado Pago (assinaturas)</h2>
      <p className="text-sm text-mute">
        Access Token de <strong>produção</strong> para o OrçaFlow receber a mensalidade. Pix e cartão acontecem no site do Mercado Pago.
      </p>
      {hint ? <p className="text-sm text-forest">Configurado: {hint}</p> : (
        <p className="text-sm text-ember">Ainda não configurado — o checkout não cobra de verdade.</p>
      )}
      <div>
        <label className="label">Access Token</label>
        <input
          name="mpAccessToken"
          className="field font-mono text-xs"
          type="password"
          placeholder="APP_USR-..."
          required
        />
      </div>
      <p className="text-xs text-mute">
        Painel:{" "}
        <a className="underline" href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer">
          developers.mercadopago.com.br
        </a>{" "}
        → sua aplicação → Credenciais de produção.
      </p>
      {msg && <p className="text-sm">{msg}</p>}
      <button className="btn-forest">Salvar token</button>
    </form>
  );
}
