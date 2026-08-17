import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { PlanLimitCard } from "@/components/PlanLimitCard";
import { getQuoteQuota } from "@/app/actions";

export default async function NewQuotePage() {
  const user = await requireUser();
  const quota = await getQuoteQuota(user.id);
  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  if (quota.atLimit) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Novo orçamento</h1>
        <div className="mt-6">
          <PlanLimitCard used={quota.used} limit={Number(quota.limit)} />
        </div>
      </div>
    );
  }

  const remaining = Number.isFinite(quota.remaining) ? quota.remaining : null;

  return (
    <div>
      <h1 className="font-serif text-4xl">Novo orçamento</h1>
      <p className="mt-1 text-mute">
        Digite, dite ou preencha. O cliente recebe um link para aceitar.
        {remaining !== null ? ` · ${remaining} de ${quota.limit} restantes no plano Inicial neste mês.` : ""}
      </p>
      <div className="mt-6">
        <QuoteBuilder
          companyName={user.companyName}
          plan={quota.plan}
          customers={customers}
          quota={quota}
        />
      </div>
    </div>
  );
}
