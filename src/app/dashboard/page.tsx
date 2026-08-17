import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";
import { hasPlan } from "@/lib/plans";
import { getQuoteQuota } from "@/app/actions";

export default async function DashboardPage() {
  const user = await requireUser();
  const quota = await getQuoteQuota(user.id);
  const [quotes, dueFollowUps] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: user.id },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.followUp.findMany({
      where: {
        quote: { userId: user.id },
        status: "pending",
        scheduledFor: { lte: new Date() },
      },
      include: { quote: { include: { customer: true } } },
      orderBy: { scheduledFor: "asc" },
    }),
  ]);

  const sent = quotes.filter((q) => ["sent", "viewed", "accepted"].includes(q.status)).length;
  const viewed = quotes.filter((q) => ["viewed", "accepted"].includes(q.status)).length;
  const accepted = quotes.filter((q) => q.status === "accepted").length;
  const pipeline = quotes
    .filter((q) => ["sent", "viewed"].includes(q.status))
    .reduce((sum, q) => sum + q.total, 0);
  const won = quotes.filter((q) => q.status === "accepted").reduce((sum, q) => sum + q.total, 0);
  const conversion = sent ? Math.round((accepted / sent) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mute">Olá, {user.name.split(" ")[0]}</p>
          <h1 className="mt-1 font-serif text-4xl">{user.companyName}</h1>
          <p className="mt-1 text-mute">
            {quota.plan === "free"
              ? `${quota.used} de ${quota.limit} orçamentos do plano Inicial neste mês`
              : `${quota.used} orçamento${quota.used === 1 ? "" : "s"} neste mês`}
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

      {quota.atLimit && (
        <div className="rounded-3xl bg-ember px-5 py-5 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-white/70">Limite do plano Inicial</p>
          <h2 className="font-serif text-2xl">Os {quota.limit} orçamentos do mês acabaram.</h2>
          <p className="mt-2 text-sm text-white/80">
            Faça upgrade para continuar enviando. No dia 1º a cota do Inicial volta.
          </p>
          <a href="/pricing" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-ember">
            Ver planos
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["No funil", money(pipeline), "enviados ainda em aberto"],
          ["Fechado", money(won), "orçamentos aceitos"],
          ["Conversão", `${conversion}%`, `${accepted} de ${sent} enviados`],
          ["Visualizados", String(viewed), "o cliente abriu o link"],
        ].map(([k, v, s]) => (
          <div key={k} className="card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{k}</p>
            <p className="mt-2 font-serif text-3xl">{v}</p>
            <p className="mt-1 text-sm text-mute">{s}</p>
          </div>
        ))}
      </div>

      {hasPlan(quota.plan, "pro") && dueFollowUps.length > 0 && (
        <section className="rounded-3xl bg-ember px-5 py-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">Cobrar agora</p>
              <h2 className="font-serif text-2xl">
                {dueFollowUps.length} follow-up{dueFollowUps.length > 1 ? "s" : ""} atrasado
                {dueFollowUps.length > 1 ? "s" : ""}
              </h2>
            </div>
            <a href="/dashboard/follow-ups" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ember">
              Abrir fila
            </a>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {dueFollowUps.slice(0, 3).map((f) => (
              <li key={f.id} className="rounded-2xl bg-white/10 px-4 py-3">
                Dia {f.dayOffset} · {f.quote.customer.name} · {f.quote.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Orçamentos recentes</h2>
          <a href="/dashboard/quotes" className="text-sm text-forest">
            Ver todos
          </a>
        </div>
        <div className="card divide-y divide-ink/5 overflow-hidden">
          {quotes.slice(0, 6).map((q) => (
            <a key={q.id} href={`/dashboard/quotes/${q.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-sand/40">
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
            </a>
          ))}
          {quotes.length === 0 && <p className="px-5 py-8 text-mute">Nenhum orçamento ainda.</p>}
        </div>
      </section>
    </div>
  );
}
