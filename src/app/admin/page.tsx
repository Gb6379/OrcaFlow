import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { isSubscriptionActive, lastMonthKeys, monthKey, monthLabel, planPrice, requireAdmin } from "@/lib/admin";
import { planLabel } from "@/lib/plans";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-mute">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-sm text-mute">{hint}</p> : null}
    </div>
  );
}

export default async function AdminHomePage() {
  await requireAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [users, payments, quotes] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        plan: true,
        planStatus: true,
        planPeriodEnd: true,
        createdAt: true,
        blockedAt: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { kind: "subscription" },
      include: { user: { select: { companyName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.findMany({
      select: { status: true, total: true, createdAt: true, sentAt: true },
    }),
  ]);

  const activeSubs = users.filter((u) => isSubscriptionActive(u, now));
  const mrr = activeSubs.reduce((sum, u) => sum + planPrice(u.plan), 0);
  const monthRevenue = payments
    .filter((p) => p.status === "paid" && p.paidAt && p.paidAt >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);
  const allRevenue = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const newWeek = users.filter((u) => u.createdAt >= weekAgo).length;
  const blocked = users.filter((u) => u.blockedAt).length;
  const quotesMonth = quotes.filter((q) => q.createdAt >= monthStart).length;
  const sent = quotes.filter((q) => ["sent", "viewed", "accepted"].includes(q.status) || q.sentAt).length;
  const accepted = quotes.filter((q) => q.status === "accepted").length;
  const conversion = sent ? Math.round((accepted / sent) * 100) : 0;

  const keys = lastMonthKeys(6);
  const byMonth = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const p of payments) {
    if (p.status !== "paid" || !p.paidAt) continue;
    const k = monthKey(p.paidAt);
    if (k in byMonth) byMonth[k] += p.amount;
  }
  const maxMonth = Math.max(...Object.values(byMonth), 1);

  const expiring = activeSubs
    .filter((u) => u.planPeriodEnd && u.planPeriodEnd < new Date(now.getTime() + 7 * 86400000))
    .sort((a, b) => (a.planPeriodEnd?.getTime() || 0) - (b.planPeriodEnd?.getTime() || 0));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mute">Plataforma</p>
        <h1 className="mt-1 font-serif text-4xl">Painel administrativo</h1>
        <p className="mt-1 text-mute">Usuários, assinaturas e o que o OrçaFlow está faturando.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="MRR" value={money(mrr)} hint={`${activeSubs.length} assinaturas ativas`} />
        <Stat label="Receita do mês" value={money(monthRevenue)} hint={`${money(allRevenue)} no total`} />
        <Stat label="Usuários" value={String(users.length)} hint={`${newWeek} novos em 7 dias`} />
        <Stat label="Orçamentos no mês" value={String(quotesMonth)} hint={`${conversion}% de conversão`} />
      </div>

      {blocked > 0 && (
        <p className="text-sm text-ember">{blocked} conta{blocked > 1 ? "s" : ""} bloqueada{blocked > 1 ? "s" : ""}.</p>
      )}

      <section className="card p-6">
        <h2 className="font-serif text-2xl">Receita por mês</h2>
        <div className="mt-6 flex h-40 items-end gap-3">
          {keys.map((k) => {
            const value = byMonth[k];
            const h = Math.round((value / maxMonth) * 100);
            return (
              <div key={k} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <p className="text-[10px] tabular-nums text-mute">{value ? money(value) : "—"}</p>
                <div
                  className="w-full rounded-t-2xl bg-forest"
                  style={{ height: `${Math.max(h, value ? 6 : 2)}%` }}
                />
                <p className="text-[11px] uppercase tracking-wide text-mute">{monthLabel(k)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Contas novas</h2>
            <a href="/admin/users" className="text-sm text-forest">
              Ver todas
            </a>
          </div>
          <div className="card divide-y divide-ink/5 overflow-hidden">
            {users.slice(0, 6).map((u) => (
              <a key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-sand/40">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.companyName}</p>
                  <p className="truncate text-sm text-mute">{u.email}</p>
                </div>
                <p className="text-sm text-forest">{planLabel(u.plan)}</p>
              </a>
            ))}
            {users.length === 0 && <p className="px-5 py-8 text-mute">Nenhum usuário ainda.</p>}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Cobranças recentes</h2>
            <a href="/admin/revenue" className="text-sm text-forest">
              Ver receita
            </a>
          </div>
          <div className="card divide-y divide-ink/5 overflow-hidden">
            {payments.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.user.companyName}</p>
                  <p className="text-sm text-mute">
                    {planLabel(p.plan || "free")} · {p.provider} · {p.status}
                  </p>
                </div>
                <p className="tabular-nums">{money(p.amount)}</p>
              </div>
            ))}
            {payments.length === 0 && <p className="px-5 py-8 text-mute">Nenhuma cobrança ainda.</p>}
          </div>
        </section>
      </div>

      {expiring.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl">Vencem em 7 dias</h2>
          <div className="card mt-3 divide-y divide-ink/5 overflow-hidden">
            {expiring.map((u) => (
              <a key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-sand/40">
                <span>{u.companyName}</span>
                <span className="text-sm text-mute">
                  {planLabel(u.plan)} · {u.planPeriodEnd?.toLocaleDateString("pt-BR")}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
