import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { requireAdmin, isSubscriptionActive } from "@/lib/admin";
import { planLabel } from "@/lib/plans";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminUserControls } from "@/components/AdminUserControls";
import { paymentLabel } from "@/lib/format";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      quotes: { include: { customer: true }, orderBy: { createdAt: "desc" }, take: 8 },
      payments: { where: { kind: "subscription" }, orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { quotes: true, customers: true } },
    },
  });
  if (!user) notFound();

  const accepted = user.quotes.filter((q) => q.status === "accepted").length;
  const active = isSubscriptionActive(user);

  return (
    <div className="space-y-8">
      <div>
        <a href="/admin/users" className="text-sm text-forest">
          ← Usuários
        </a>
        <h1 className="mt-2 font-serif text-4xl">{user.companyName}</h1>
        <p className="text-mute">
          {user.name} · {user.email}
          {user.phone ? ` · ${user.phone}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Plano", planLabel(user.plan), active ? "assinatura ativa" : user.planStatus],
          ["Válida até", user.planPeriodEnd ? user.planPeriodEnd.toLocaleDateString("pt-BR") : "—", user.planStatus],
          ["Orçamentos", String(user._count.quotes), `${accepted} aceitos`],
          ["Clientes", String(user._count.customers), user.trade],
        ].map(([k, v, s]) => (
          <div key={k} className="card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{k}</p>
            <p className="mt-2 font-serif text-3xl">{v}</p>
            <p className="mt-1 text-sm text-mute">{s}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section>
            <h2 className="font-serif text-2xl">Orçamentos recentes</h2>
            <div className="card mt-3 divide-y divide-ink/5 overflow-hidden">
              {user.quotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="font-medium">
                      #{q.number} · {q.customer.name}
                    </p>
                    <p className="text-sm text-mute">{q.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums">{money(q.total)}</p>
                    <StatusBadge status={q.status} />
                  </div>
                </div>
              ))}
              {user.quotes.length === 0 && <p className="px-5 py-8 text-mute">Nenhum orçamento.</p>}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Cobranças OrçaFlow</h2>
            <div className="card mt-3 divide-y divide-ink/5 overflow-hidden">
              {user.payments.map((p) => (
                <div key={p.id} className="flex justify-between px-5 py-3 text-sm">
                  <span>
                    {planLabel(p.plan || user.plan)} · {p.provider} · {paymentLabel(p.status) === p.status ? p.status : paymentLabel(p.status)}
                  </span>
                  <span className="tabular-nums">{money(p.amount)}</span>
                </div>
              ))}
              {user.payments.length === 0 && <p className="px-5 py-8 text-mute">Nenhuma cobrança.</p>}
            </div>
          </section>
        </div>

        <AdminUserControls
          user={{
            id: user.id,
            email: user.email,
            plan: user.plan,
            planStatus: user.planStatus,
            planPeriodEnd: user.planPeriodEnd?.toISOString() || null,
            role: user.role,
            blockedAt: user.blockedAt?.toISOString() || null,
            isSelf: user.id === admin.id,
          }}
        />
      </div>
    </div>
  );
}
