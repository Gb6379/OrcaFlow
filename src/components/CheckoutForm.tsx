"use client";

import { useState } from "react";
import { startMercadoPagoCheckoutAction, startStripeCheckoutAction } from "@/app/billing-actions";
import type { PaymentsMode } from "@/lib/billing";

export function CheckoutForm({
  plan,
  planName,
  priceLabel,
  mode,
  mpHint,
}: {
  plan: string;
  planName: string;
  priceLabel: string;
  mode: PaymentsMode;
  mpHint: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function payMp() {
    setBusy(true);
    setError("");
    await startMercadoPagoCheckoutAction(plan);
    setBusy(false);
  }

  async function payStripe() {
    setBusy(true);
    setError("");
    await startStripeCheckoutAction(plan);
    setBusy(false);
  }

  if (mode === "setup") {
    return (
      <div className="card space-y-4 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-ember">Pagamento real</p>
        <h2 className="font-serif text-2xl">Conecte o Mercado Pago</h2>
        <p className="text-sm text-mute">
          Sem formulário de cartão aqui. O cliente paga Pix ou cartão na página oficial do Mercado Pago, e o dinheiro cai na sua conta.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            Crie ou entre em{" "}
            <a className="text-forest underline" href="https://www.mercadopago.com.br" target="_blank" rel="noreferrer">
              mercadopago.com.br
            </a>
          </li>
          <li>
            Abra{" "}
            <a
              className="text-forest underline"
              href="https://www.mercadopago.com.br/developers/panel/app"
              target="_blank"
              rel="noreferrer"
            >
              Suas integrações
            </a>{" "}
            e crie uma aplicação
          </li>
          <li>
            Copie o <strong>Access Token de produção</strong> (começa com <code>APP_USR-</code>)
          </li>
          <li>
            Cole em <a className="text-forest underline" href="/dashboard/settings">Configurações → Mercado Pago</a> e volte aqui
          </li>
        </ol>
        <a href="/dashboard/settings" className="btn-primary w-full">
          Colar token em Configurações
        </a>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-forest">Checkout seguro</p>
      <h2 className="font-serif text-2xl">Pix ou cartão</h2>
      <p className="text-sm text-mute">
        Você sai desta tela e paga no {mode === "mercadopago" ? "Mercado Pago" : "Stripe"}. Cobrança de {priceLabel} no plano {planName}. Nós não guardamos número de cartão.
      </p>
      {mode === "mercadopago" && mpHint && (
        <p className="rounded-2xl bg-forest-mist px-3 py-2 text-sm">Conta Mercado Pago: {mpHint}</p>
      )}
      {mode === "mercadopago" && mpHint.includes("teste") && (
        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Este token é de teste (TEST-). Para dinheiro de verdade, use o Access Token de <strong>produção</strong> (APP_USR-).
        </p>
      )}
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {mode === "mercadopago" && (
        <button disabled={busy} onClick={payMp} className="btn-primary w-full py-3">
          {busy ? "Abrindo Mercado Pago..." : `Pagar ${priceLabel} no Mercado Pago`}
        </button>
      )}
      {mode === "stripe" && (
        <button disabled={busy} onClick={payStripe} className="btn-primary w-full py-3">
          {busy ? "Abrindo Stripe..." : `Pagar ${priceLabel}/mês na Stripe`}
        </button>
      )}
    </div>
  );
}
