import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money, type QuoteItem } from "@/lib/money";
import { paymentLabel, quotePublicUrl } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { QuoteActions } from "@/components/QuoteActions";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { ConfirmPaymentButton } from "@/components/ConfirmPaymentButton";

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const quote = await prisma.quote.findFirst({
    where: { id: params.id, userId: user.id },
    include: { customer: true, followUps: { orderBy: { dayOffset: "asc" } } },
  });
  if (!quote) notFound();
  const items = JSON.parse(quote.itemsJson) as QuoteItem[];
  const publicUrl = quotePublicUrl(quote.publicToken);
  const waMessage = `Olá ${quote.customer.name.split(" ")[0]}! Segue o orçamento #${quote.number} para ${quote.title}: ${publicUrl}`;

  const steps = [
    { key: "sent", label: "Enviado", at: quote.sentAt },
    { key: "viewed", label: "Visualizado", at: quote.viewedAt },
    { key: "accepted", label: "Aceito", at: quote.acceptedAt },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-mute">Orçamento #{quote.number}</p>
          <h1 className="font-serif text-4xl">{quote.customer.name}</h1>
          <p className="mt-1 text-mute">{quote.title}</p>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      {quote.status === "accepted" && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-mute">Pagamento</p>
            <p className="font-serif text-2xl">{paymentLabel(quote.paymentStatus)}</p>
            {quote.paidAt ? (
              <p className="text-sm text-mute">{quote.paidAt.toLocaleString("pt-BR")}</p>
            ) : (
              <p className="text-sm text-mute">Pix do cliente ou confirmação manual</p>
            )}
          </div>
          <ConfirmPaymentButton quoteId={quote.id} status={quote.paymentStatus} />
        </div>
      )}

      <QuoteActions
        id={quote.id}
        status={quote.status}
        phone={quote.customer.phone}
        message={waMessage}
        publicUrl={publicUrl}
      />

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.key} className={`card p-4 ${step.at ? "ring-1 ring-forest/30" : "opacity-60"}`}>
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{step.label}</p>
            <p className="mt-2 font-medium">
              {step.at ? step.at.toLocaleString("pt-BR") : "Ainda não"}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl">Total</h2>
          <p className="font-serif text-4xl text-forest">{money(quote.total)}</p>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {item.description} {item.quantity > 1 ? `× ${item.quantity}` : ""}
              </span>
              <span>{money(item.quantity * item.unitPrice)}</span>
            </li>
          ))}
        </ul>
        {quote.notes ? <p className="mt-4 text-sm text-mute">{quote.notes}</p> : null}
        <p className="mt-4 text-xs text-mute">
          Válido até {quote.validUntil.toLocaleDateString("pt-BR")}
        </p>
      </div>

      {quote.followUps.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl">Sequência de follow-up</h2>
          <div className="mt-3 space-y-3">
            {quote.followUps.map((f) => (
              <div key={f.id} className="card p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Dia {f.dayOffset}</span>
                  <span className="text-mute">{f.status}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm">{f.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {quote.status === "draft" && (
        <div>
          <h2 className="mb-4 font-serif text-2xl">Editar</h2>
          <QuoteBuilder
            companyName={user.companyName}
            plan={user.plan}
            customers={[quote.customer]}
            initial={{
              id: quote.id,
              number: quote.number,
              customerName: quote.customer.name,
              customerPhone: quote.customer.phone,
              customerEmail: quote.customer.email,
              title: quote.title,
              notes: quote.notes,
              items,
              discountType: quote.discountType as "none" | "percent" | "fixed",
              discountValue: quote.discountValue,
            }}
          />
        </div>
      )}
    </div>
  );
}
