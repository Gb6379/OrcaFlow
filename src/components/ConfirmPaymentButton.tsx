"use client";

import { useRouter } from "next/navigation";
import { ownerConfirmPaymentAction } from "@/app/billing-actions";

export function ConfirmPaymentButton({ quoteId, status }: { quoteId: string; status: string }) {
  const router = useRouter();
  if (status === "paid") {
    return <p className="text-sm text-forest">Pagamento confirmado</p>;
  }
  return (
    <button
      className="btn-primary"
      onClick={async () => {
        await ownerConfirmPaymentAction(quoteId);
        router.refresh();
      }}
    >
      {status === "pending" ? "Confirmar Pix recebido" : "Marcar como pago"}
    </button>
  );
}
