import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { paymentLabel } from "@/lib/format";
import { ConfirmPaymentButton } from "@/components/ConfirmPaymentButton";

export default async function PaymentsPage() {
  const user = await requireUser();
  const [quotePays, subs] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: user.id, status: "accepted" },
      include: { customer: true },
      orderBy: { acceptedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId: user.id, kind: "subscription" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const received = quotePays.filter((q) => q.paymentStatus === "paid").reduce((s, q) => s + q.total, 0);
  const open = quotePays.filter((q) => q.paymentStatus !== "paid").reduce((s, q) => s + q.total, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Pagamentos</h1>
        <p className="text-mute">Pix e Mercado Pago dos orçamentos, e a sua assinatura do OrçaFlow.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-mute">Recebido</p>
          <p className="mt-2 font-serif text-3xl text-forest">{money(received)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-mute">A receber</p>
          <p className="mt-2 font-serif text-3xl">{money(open)}</p>
        </div>
      </div>

      <section>
        <h2 className="font-serif text-2xl">Orçamentos aceitos</h2>
        <div className="card mt-3 divide-y divide-ink/5 overflow-hidden">
          {quotePays.map((q) => (
            <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <a href={`/dashboard/quotes/${q.id}`} className="min-w-0">
                <p className="font-medium">
                  #{q.number} · {q.customer.name}
                </p>
                <p className="text-sm text-mute">
                  {money(q.total)} · {paymentLabel(q.paymentStatus)}
                </p>
              </a>
              <ConfirmPaymentButton quoteId={q.id} status={q.paymentStatus} />
            </div>
          ))}
          {quotePays.length === 0 && <p className="px-5 py-8 text-mute">Nenhum orçamento aceito ainda.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Assinatura OrçaFlow</h2>
        <div className="card mt-3 divide-y divide-ink/5">
          {subs.map((p) => (
            <div key={p.id} className="flex justify-between px-5 py-3 text-sm">
              <span>
                {p.plan} · {p.provider}
              </span>
              <span>
                {money(p.amount)} · {p.status}
              </span>
            </div>
          ))}
          {subs.length === 0 && <p className="px-5 py-8 text-mute">Nenhuma cobrança de plano ainda.</p>}
        </div>
        <a href="/pricing" className="btn-ghost mt-4">
          Ver planos
        </a>
      </section>
    </div>
  );
}
