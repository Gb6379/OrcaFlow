"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptQuoteAction } from "@/app/actions";
import { startQuoteCheckoutAction } from "@/app/billing-actions";

export function AcceptButton({
  token,
  amountLabel,
  payMode = "none",
  alreadyAccepted = false,
}: {
  token: string;
  amountLabel?: string;
  payMode?: "none" | "mp" | "pix";
  alreadyAccepted?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const paying = payMode === "mp" || payMode === "pix";
  const label = paying
    ? alreadyAccepted
      ? `PAGAR AGORA ${amountLabel || ""}`.trim()
      : `ACEITAR E PAGAR ${amountLabel || ""}`.trim()
    : "ACEITAR ORÇAMENTO";

  async function run() {
    setBusy(true);
    setError("");
    if (payMode === "mp") {
      const res = await startQuoteCheckoutAction(token);
      if ("url" in res && res.url) {
        window.location.href = res.url;
        return;
      }
      setBusy(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      return;
    }
    const res = await acceptQuoteAction(token);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button disabled={busy} onClick={run} className="btn-primary w-full py-4 text-base">
        {busy ? (payMode === "mp" ? "Abrindo pagamento..." : "Registrando...") : label}
      </button>
      {payMode === "mp" ? (
        <p className="mt-2 text-center text-xs text-mute">
          Pix ou cartão. Quando o pagamento confirmar, o orçamento vira pago sozinho.
        </p>
      ) : payMode === "pix" && !alreadyAccepted ? (
        <p className="mt-2 text-center text-xs text-mute">
          Na sequência você vê o Pix para pagar na hora.
        </p>
      ) : null}
      {error && <p className="mt-2 text-center text-sm text-rose-700">{error}</p>}
    </div>
  );
}
