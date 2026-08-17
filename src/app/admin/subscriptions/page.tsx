import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { isSubscriptionActive, planPrice, requireAdmin } from "@/lib/admin";
import { planLabel } from "@/lib/plans";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  await requireAdmin();
  const filter = searchParams.filter || "active";
  const now = new Date();
  const users = await prisma.user.findMany({
    where: { plan: { not: "free" } },
    orderBy: { planPeriodEnd: "asc" },
    include: { _count: { select: { quotes: true } } },
  });

  const rows = users.filter((u) => {
    const active = isSubscriptionActive(u, now);
    if (filter === "active") return active;
    if (filter === "expiring") {
      return active && u.planPeriodEnd && u.planPeriodEnd < new Date(now.getTime() + 14 * 86400000);
    }
    if (filter === "expired") return !active;
    return true;
  });

  const mrr = users.filter((u) => isSubscriptionActive(u, now)).reduce((s, u) => s + planPrice(u.plan), 0);

  const filters = [
    ["active", "Ativas"],
    ["expiring", "Vencem em 14 dias"],
    ["expired", "Inativas"],
    ["all", "Todas pagas"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Assinaturas</h1>
        <p className="text-mute">
          MRR {money(mrr)} · {rows.length} neste filtro
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <a
            key={value}
            href={`/admin/subscriptions?filter=${value}`}
            className={`rounded-full px-3 py-1.5 text-sm ${filter === value ? "bg-forest text-cream" : "bg-sand"}`}
          >
            {label}
          </a>
        ))}
      </div>
      <div className="card divide-y divide-ink/5 overflow-hidden">
        {rows.map((u) => {
          const active = isSubscriptionActive(u, now);
          return (
            <a key={u.id} href={`/admin/users/${u.id}`} className="grid gap-2 px-5 py-4 hover:bg-sand/40 sm:grid-cols-[1fr_120px_140px_100px]">
              <div>
                <p className="font-medium">{u.companyName}</p>
                <p className="text-sm text-mute">{u.email}</p>
              </div>
              <p className="text-sm text-forest">{planLabel(u.plan)}</p>
              <p className="text-sm text-mute">
                {u.planPeriodEnd ? u.planPeriodEnd.toLocaleDateString("pt-BR") : "sem data"}
              </p>
              <p className={`text-sm ${active ? "text-emerald-800" : "text-rose-700"}`}>
                {active ? money(planPrice(u.plan)) + "/mês" : u.planStatus}
              </p>
            </a>
          );
        })}
        {rows.length === 0 && <p className="px-5 py-10 text-mute">Nenhuma assinatura neste filtro.</p>}
      </div>
    </div>
  );
}
