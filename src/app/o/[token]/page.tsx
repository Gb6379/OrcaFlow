import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money, type QuoteItem } from "@/lib/money";
import { formatPhone, whatsappLink } from "@/lib/whatsapp";
import { AcceptButton } from "@/components/AcceptButton";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { PixPay } from "@/components/PixPay";
import { fulfillQuoteMpPayment, quotePixData } from "@/app/billing-actions";
import { receivePixForUser } from "@/lib/pix";

export const dynamic = "force-dynamic";

async function markViewed(quoteId: string, status: string) {
  if (status === "sent") {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "viewed", viewedAt: new Date() },
    });
  } else if (!["accepted", "expired", "declined"].includes(status)) {
    await prisma.quote.updateMany({
      where: { id: quoteId, viewedAt: null },
      data: { viewedAt: new Date() },
    });
  }
}

export default async function PublicQuotePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: {
    payment_id?: string;
    collection_id?: string;
    collection_status?: string;
    status?: string;
  };
}) {
  let quote = await prisma.quote.findUnique({
    where: { publicToken: params.token },
    include: { user: true, customer: true },
  });
  if (!quote) notFound();

  const mpPaymentId = searchParams.payment_id || searchParams.collection_id;
  if (mpPaymentId && quote.user.mpReceiveToken) {
    await fulfillQuoteMpPayment(mpPaymentId, quote.userId);
    quote = await prisma.quote.findUnique({
      where: { publicToken: params.token },
      include: { user: true, customer: true },
    });
    if (!quote) notFound();
  }

  const expired = quote.validUntil < new Date() && quote.status !== "accepted";
  if (expired && quote.status !== "expired") {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "expired" } });
  }
  if (!expired) await markViewed(quote.id, quote.status);

  const items = JSON.parse(quote.itemsJson) as QuoteItem[];
  const status = expired ? "expired" : quote.status;
  const wa = quote.user.whatsapp || quote.user.phone;
  const question = `Oi! Vi o orçamento #${quote.number} (${quote.title}) e queria tirar uma dúvida.`;
  const canAutoPay = Boolean(quote.user.mpReceiveToken.trim());
  const hasPix = Boolean(receivePixForUser(quote.user).key);
  const unpaid = quote.paymentStatus !== "paid";
  const pix =
    hasPix && !canAutoPay && status !== "expired" && unpaid ? await quotePixData(quote.id) : null;
  const mpReturn = searchParams.collection_status || searchParams.status;

  return (
    <div className="paper-grid min-h-screen">
      <div className="no-print mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
        <Logo />
        <PrintButton />
      </div>

      <main className="mx-auto max-w-2xl px-5 pb-16">
        <article className="ticket rounded-[32px] border-[6px] border-transparent bg-cream p-7 shadow-lift sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-mute">{quote.user.trade}</p>
              <h1 className="font-serif text-3xl text-forest sm:text-4xl">{quote.user.companyName}</h1>
              {quote.user.address ? <p className="mt-1 text-sm text-mute">{quote.user.address}</p> : null}
              {quote.user.cnpj ? <p className="text-sm text-mute">CNPJ {quote.user.cnpj}</p> : null}
            </div>
            <p className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-cream">#{quote.number}</p>
          </div>

          <div className="mt-8 border-t border-dashed border-ink/15 pt-6">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">Orçamento para</p>
            <p className="mt-1 text-xl font-medium">{quote.customer.name}</p>
            <h2 className="mt-5 font-serif text-3xl leading-snug">{quote.title}</h2>
          </div>

          <ul className="mt-8 space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-4 text-sm sm:text-base">
                <span>
                  {item.description}
                  {item.quantity > 1 ? (
                    <span className="text-mute">
                      {" "}
                      · {item.quantity} × {money(item.unitPrice)}
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums">{money(item.quantity * item.unitPrice)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-ink/10 pt-5">
            {quote.discountValue > 0 && (
              <p className="mb-2 flex justify-between text-sm text-forest">
                <span>
                  Desconto
                  {quote.discountType === "percent" ? ` ${quote.discountValue}%` : ""}
                </span>
                <span>{money(quote.subtotal - quote.total)}</span>
              </p>
            )}
            <div className="flex items-end justify-between">
              <span className="text-xs uppercase tracking-[0.18em] text-mute">Total</span>
              <span className="font-serif text-5xl text-forest">{money(quote.total)}</span>
            </div>
            <p className="mt-3 text-sm text-mute">
              Validade: {quote.validUntil.toLocaleDateString("pt-BR")}
            </p>
            {quote.notes ? <p className="mt-3 text-sm">{quote.notes}</p> : null}
          </div>

          <div className="no-print mt-8">
            {status === "expired" ? (
              <div className="rounded-2xl bg-stone-200 px-5 py-4 text-center text-stone-700">
                Este orçamento expirou. Fale com {quote.user.name} para uma nova proposta.
              </div>
            ) : quote.paymentStatus === "paid" ? (
              <div className="rounded-2xl bg-emerald-100 px-5 py-4 text-center text-emerald-900">
                Pagamento recebido. Obrigado!
              </div>
            ) : (
              <div>
                {status === "accepted" ? (
                  <div className="rounded-2xl bg-emerald-100 px-5 py-4 text-center text-emerald-900">
                    Orçamento aceito. {quote.user.companyName} já foi avisada.
                  </div>
                ) : canAutoPay ? (
                  <AcceptButton
                    token={quote.publicToken}
                    amountLabel={money(quote.total)}
                    payMode="mp"
                  />
                ) : !pix ? (
                  <AcceptButton token={quote.publicToken} />
                ) : null}
                {canAutoPay && status === "accepted" ? (
                  <div className="mt-3">
                    {mpReturn === "pending" ? (
                      <p className="mb-3 rounded-2xl bg-amber-50 px-5 py-3 text-center text-sm text-amber-900">
                        Pagamento em processamento. Assim que confirmar, este orçamento vira pago.
                      </p>
                    ) : mpReturn === "rejected" || mpReturn === "failure" ? (
                      <p className="mb-3 rounded-2xl bg-rose-50 px-5 py-3 text-center text-sm text-rose-800">
                        O pagamento não foi concluído. Você pode tentar de novo.
                      </p>
                    ) : null}
                    <AcceptButton
                      token={quote.publicToken}
                      amountLabel={money(quote.total)}
                      payMode="mp"
                      alreadyAccepted
                    />
                  </div>
                ) : null}
                {pix ? (
                  <PixPay
                    token={quote.publicToken}
                    payload={pix.payload}
                    qrDataUrl={pix.qrDataUrl}
                    amount={pix.amount}
                    company={pix.company}
                    paymentStatus={quote.paymentStatus}
                  />
                ) : null}
                {!canAutoPay && !hasPix ? (
                  <p className="mt-3 text-center text-sm text-mute">
                    Combine o pagamento direto com {quote.user.companyName}.
                  </p>
                ) : null}
              </div>
            )}
            {wa ? (
              <a
                href={whatsappLink(wa, question)}
                target="_blank"
                className="btn-ghost mt-3 w-full"
              >
                Tirar dúvida no WhatsApp
                {quote.user.phone ? ` · ${formatPhone(quote.user.phone)}` : ""}
              </a>
            ) : null}
          </div>
        </article>
        <p className="no-print mt-8 text-center text-xs text-mute">
          Página gerada pelo OrçaFlow · orçamento profissional com um toque para aceitar
        </p>
      </main>
    </div>
  );
}
