import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPlan } from "@/lib/plans";
import { FollowUpCard } from "@/components/FollowUpCard";
import { quotePublicUrl } from "@/lib/format";

export default async function FollowUpsPage() {
  const user = await requireUser();
  const unlocked = hasPlan(user.plan, "pro");
  const followUps = unlocked
    ? await prisma.followUp.findMany({
        where: { quote: { userId: user.id }, status: "pending" },
        include: { quote: { include: { customer: true } } },
        orderBy: { scheduledFor: "asc" },
      })
    : [];

  const now = new Date();
  const due = followUps.filter((f) => f.scheduledFor <= now);
  const upcoming = followUps.filter((f) => f.scheduledFor > now);

  return (
    <div>
      <h1 className="font-serif text-4xl">Follow-up</h1>
      <p className="mt-1 text-mute">O sistema lembra. Você só manda o WhatsApp.</p>

      {!unlocked && (
        <div className="card mt-8 p-6">
          <p className="font-serif text-2xl">Follow-up automático entra no plano Fechador</p>
          <p className="mt-2 text-mute">
            Dia 0, dia 2 e dia 5. Mensagens prontas com o nome do cliente, o serviço e o link do orçamento.
          </p>
          <a href="/dashboard/settings" className="btn-primary mt-5">
            Assinar R$ 59/mês
          </a>
        </div>
      )}

      {unlocked && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-serif text-2xl">Para enviar agora ({due.length})</h2>
            <div className="mt-4 grid gap-4">
              {due.map((f) => (
                <FollowUpCard
                  key={f.id}
                  id={f.id}
                  dayOffset={f.dayOffset}
                  customer={f.quote.customer.name}
                  title={f.quote.title}
                  message={`${f.message}\n\n${quotePublicUrl(f.quote.publicToken)}`}
                  phone={f.quote.customer.phone}
                  scheduledFor={f.scheduledFor.toLocaleString("pt-BR")}
                  due
                />
              ))}
              {due.length === 0 && <p className="text-mute">Nada vencido. Bom sinal — ou a fila ainda não começou.</p>}
            </div>
          </section>
          <section>
            <h2 className="font-serif text-2xl">Agenda ({upcoming.length})</h2>
            <div className="mt-4 grid gap-4">
              {upcoming.map((f) => (
                <FollowUpCard
                  key={f.id}
                  id={f.id}
                  dayOffset={f.dayOffset}
                  customer={f.quote.customer.name}
                  title={f.quote.title}
                  message={`${f.message}\n\n${quotePublicUrl(f.quote.publicToken)}`}
                  phone={f.quote.customer.phone}
                  scheduledFor={f.scheduledFor.toLocaleString("pt-BR")}
                  due={false}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
