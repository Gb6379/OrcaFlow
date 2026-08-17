"use client";

import { useState } from "react";
import { customerMarkPaidAction } from "@/app/billing-actions";
import { money } from "@/lib/money";

export function PixPay({
  token,
  payload,
  qrDataUrl,
  amount,
  company,
  paymentStatus,
}: {
  token: string;
  payload: string;
  qrDataUrl: string;
  amount: number;
  company: string;
  paymentStatus: string;
}) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(paymentStatus);
  const [busy, setBusy] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function paid() {
    setBusy(true);
    await customerMarkPaidAction(token);
    setBusy(false);
    setStatus("pending");
  }

  if (status === "paid") {
    return (
      <div className="mt-4 rounded-2xl bg-emerald-100 px-5 py-4 text-center text-emerald-900">
        Pagamento recebido. Obrigado!
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mt-4 rounded-2xl bg-amber-50 px-5 py-4 text-center text-amber-900">
        Pix enviado. {company} confirma o pagamento em instantes.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-forest-mist/60 p-5 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-forest">Pagar com Pix</p>
      <p className="mt-1 font-serif text-3xl text-forest">{money(amount)}</p>
      <img src={qrDataUrl} alt="QR Code Pix" className="mx-auto mt-4 h-48 w-48 rounded-2xl bg-white p-2" />
      <button type="button" onClick={copy} className="btn-ghost mt-4 w-full">
        {copied ? "Código copiado" : "Copiar Pix copia e cola"}
      </button>
      <button type="button" disabled={busy} onClick={paid} className="btn-forest mt-2 w-full">
        {busy ? "Enviando..." : "Já paguei"}
      </button>
      <p className="mt-3 text-xs text-mute">O valor cai direto na conta Pix de {company}. Pagar aceita o orçamento.</p>
    </div>
  );
}
