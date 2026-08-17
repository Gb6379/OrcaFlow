import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { lastMonthKeys, monthKey, monthLabel, requireAdmin } from "@/lib/admin";
import { planLabel } from "@/lib/plans";

export default async function AdminRevenuePage() {
  await requireAdmin();
  const payments = await prisma.payment.findMany({
    where: { kind: "subscription" },
    include: { user: { select: { id: true, companyName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const paid = payments.filter((p) => p.status === "paid");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTotal = paid.filter((p) => p.paidAt && p.paidAt >= monthStart).reduce((s, p) => s + p.amount, 0);
  const allTotal = paid.reduce((s, p) => s + p.amount, 0);
  const courtesy = paid.filter((p) => p.provider === "admin" && p.amount === 0).length;

  const byPlan: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  for (const p of paid) {
    byPlan[p.plan || "free"] = (byPlan[p.plan || "free"] || 0) + p.amount;
    byProvider[p.provider] = (byProvider[p.provider] || 0) + p.amount;
  }

  const keys = lastMonthKeys(8);
  const byMonth = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const p of paid) {
    if (!p.paidAt) continue;
    const k = monthKey(p.paidAt);
    if (k in byMonth) byMonth[k] += p.amount;
  }
  const maxMonth = Math.max(...Object.values(byMonth), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Receita</h1>
        <p className="text-mute">Só cobranças de plano OrçaFlow — Pix dos orçamentos dos prestadores não entra aqui.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-mute">Este mês</p>
          <p className="mt-2 font-serif text-3xl">{money(monthTotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-mute">Acumulado</p>
          <p className="mt-2 font-serif text-3xl">{money(allTotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-mute">Cortesias</p>
          <p className="mt-2 font-serif text-3xl">{courtesy}</p>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="font-serif text-2xl">Por mês</h2>
        <div className="mt-6 flex h-40 items-end gap-2">
          {keys.map((k) => {
            const value = byMonth[k];
            const h = Math.round((value / maxMonth) * 100);
            return (
              <div key={k} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <p className="text-[10px] tabular-nums text-mute">{value ? money(value) : "—"}</p>
                <div className="w-full rounded-t-2xl bg-ember" style={{ height: `${Math.max(h, value ? 6 : 2)}%` }} />
                <p className="text-[10px] uppercase text-mute">{monthLabel(k)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-serif text-2xl">Por plano</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(byPlan).map(([plan, amount]) => (
              <li key={plan} className="flex justify-between">
                <span>{planLabel(plan)}</span>
                <span className="tabular-nums">{money(amount)}</span>
              </li>
            ))}
            {Object.keys(byPlan).length === 0 && <li className="text-mute">Sem receita ainda.</li>}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-serif text-2xl">Por provedor</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(byProvider).map(([provider, amount]) => (
              <li key={provider} className="flex justify-between">
                <span>{provider}</span>
                <span className="tabular-nums">{money(amount)}</span>
              </li>
            ))}
            {Object.keys(byProvider).length === 0 && <li className="text-mute">Sem receita ainda.</li>}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="font-serif text-2xl">Lançamentos</h2>
        <div className="card mt-3 divide-y divide-ink/5 overflow-hidden">
          {payments.map((p) => (
            <a key={p.id} href={`/admin/users/${p.user.id}`} className="grid gap-1 px-5 py-3 hover:bg-sand/40 sm:grid-cols-[1fr_120px_100px_100px]">
              <div>
                <p className="font-medium">{p.user.companyName}</p>
                <p className="text-sm text-mute">{p.user.email}</p>
              </div>
              <p className="text-sm">
                {planLabel(p.plan || "free")} · {p.provider}
              </p>
              <p className="text-sm text-mute">{p.status}</p>
              <p className="tabular-nums">{money(p.amount)}</p>
            </a>
          ))}
          {payments.length === 0 && <p className="px-5 py-10 text-mute">Nenhum lançamento.</p>}
        </div>
      </section>
    </div>
  );
}
