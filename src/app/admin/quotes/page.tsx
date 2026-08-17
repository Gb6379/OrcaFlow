import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { requireAdmin } from "@/lib/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { paymentLabel } from "@/lib/format";

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdmin();
  const status = searchParams.status || "";
  const quotes = await prisma.quote.findMany({
    where: status ? { status } : {},
    include: { user: { select: { id: true, companyName: true } }, customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const filters = [
    ["", "Todos"],
    ["sent", "Enviado"],
    ["viewed", "Visualizado"],
    ["accepted", "Aceito"],
    ["expired", "Expirado"],
    ["draft", "Rascunho"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Orçamentos da plataforma</h1>
        <p className="text-mute">Últimos 200 · o que os prestadores estão mandando.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <a
            key={label}
            href={value ? `/admin/quotes?status=${value}` : "/admin/quotes"}
            className={`rounded-full px-3 py-1.5 text-sm ${(status || "") === value ? "bg-forest text-cream" : "bg-sand"}`}
          >
            {label}
          </a>
        ))}
      </div>
      <div className="card divide-y divide-ink/5 overflow-hidden">
        {quotes.map((q) => (
          <div key={q.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr_120px_120px]">
            <div>
              <a href={`/admin/users/${q.user.id}`} className="font-medium hover:text-forest">
                {q.user.companyName}
              </a>
              <p className="text-sm text-mute">#{q.number} · {q.customer.name}</p>
            </div>
            <p className="text-sm">{q.title}</p>
            <div>
              <p className="tabular-nums">{money(q.total)}</p>
              <p className="text-xs text-mute">{paymentLabel(q.paymentStatus)}</p>
            </div>
            <StatusBadge status={q.status} />
          </div>
        ))}
        {quotes.length === 0 && <p className="px-5 py-10 text-mute">Nenhum orçamento neste filtro.</p>}
      </div>
    </div>
  );
}
