import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fulfillMercadoPagoPayment, fulfillStripeSession } from "@/app/billing-actions";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: {
    session_id?: string;
    payment_id?: string;
    collection_id?: string;
    collection_status?: string;
    status?: string;
    pending?: string;
  };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (searchParams.session_id) {
    await fulfillStripeSession(searchParams.session_id);
  }

  const mpPaymentId = searchParams.payment_id || searchParams.collection_id;
  let mpStatus = searchParams.collection_status || searchParams.status || "";
  if (mpPaymentId) {
    const result = await fulfillMercadoPagoPayment(mpPaymentId);
    mpStatus = result.status;
  }

  const pending = mpStatus === "pending" || mpStatus === "in_process";
  const approved = mpStatus === "approved" || Boolean(searchParams.session_id);

  return (
    <div className="paper-grid flex min-h-screen flex-col items-center px-5 py-10">
      <Logo />
      <div className="card mt-10 max-w-lg p-8 text-center">
        {pending ? (
          <>
            <p className="text-xs uppercase tracking-[0.16em] text-ember">Pix em processamento</p>
            <h1 className="mt-3 font-serif text-4xl">Quase lá.</h1>
            <p className="mt-3 text-mute">
              Pague o Pix no app do banco. Quando o Mercado Pago confirmar, o plano ativa sozinho.
            </p>
          </>
        ) : approved ? (
          <>
            <p className="text-xs uppercase tracking-[0.16em] text-forest">Pagamento confirmado</p>
            <h1 className="mt-3 font-serif text-4xl">Plano ativo.</h1>
            <p className="mt-3 text-mute">
              A cobrança foi registrada no Mercado Pago ou na Stripe. Você já pode usar o plano.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.16em] text-ember">Pagamento não concluído</p>
            <h1 className="mt-3 font-serif text-4xl">Não recebemos ainda.</h1>
            <p className="mt-3 text-mute">Status: {mpStatus || "desconhecido"}. Tente de novo no checkout.</p>
          </>
        )}
        <a href="/dashboard" className="btn-primary mt-6">
          Ir para o painel
        </a>
      </div>
    </div>
  );
}
