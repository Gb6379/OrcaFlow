import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";
import { getQuoteQuota } from "@/app/actions";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireUser();
  const quota = await getQuoteQuota(user.id);
  const status = searchParams.status;
  const quotes = await prisma.quote.findMany({
    where: { userId: user.id, ...(status ? { status } : {}) },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const filters = [
    ["", "Todos"],
    ["draft", "Rascunho"],
    ["sent", "Enviado"],
    ["viewed", "Visualizado"],
    ["accepted", "Aceito"],
    ["expired", "Expirado"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Orçamentos</h1>
          <p className="text-mute">
            Enviado → Visualizado → Aceito
            {quota.plan === "free" ? ` · ${quota.used}/${quota.limit} no plano Inicial` : ""}
          </p>
        </div>
        {quota.atLimit ? (
          <a href="/pricing" className="btn-primary">
            Fazer upgrade
          </a>
        ) : (
          <a href="/dashboard/quotes/new" className="btn-primary">
            Novo orçamento
          </a>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <a
            key={label}
            href={value ? `/dashboard/quotes?status=${value}` : "/dashboard/quotes"}
            className={`rounded-full px-3 py-1.5 text-sm ${
              (status || "") === value ? "bg-forest text-cream" : "bg-sand"
            }`}
          >
            {label}
          </a>
        ))}
      </div>
      <div className="mt-6 card divide-y divide-ink/5 overflow-hidden">
        {quotes.map((q) => (
          <a key={q.id} href={`/dashboard/quotes/${q.id}`} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 hover:bg-sand/40 sm:grid-cols-[80px_1fr_140px_120px]">
            <p className="text-sm text-mute">#{q.number}</p>
            <div>
              <p className="font-medium">{q.customer.name}</p>
              <p className="text-sm text-mute">{q.title}</p>
            </div>
            <p className="tabular-nums">{money(q.total)}</p>
            <div className="sm:text-right">
              <StatusBadge status={q.status} />
            </div>
          </a>
        ))}
        {quotes.length === 0 && <p className="px-5 py-10 text-mute">Nenhum orçamento neste filtro.</p>}
      </div>
    </div>
  );
}
