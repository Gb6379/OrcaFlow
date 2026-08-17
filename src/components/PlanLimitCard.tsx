export function PlanLimitCard({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  return (
    <div className="card max-w-xl p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-ember">Plano Inicial</p>
      <h2 className="mt-2 font-serif text-3xl">Você chegou nos {limit} orçamentos do mês.</h2>
      <p className="mt-3 text-mute">
        Sem plano pago, o Inicial (R$ 0) libera {limit} orçamentos por mês. Você já usou {used} de {limit}.
        No mês que vem a cota volta, ou você sobe de plano agora e continua fechando serviço.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/pricing" className="btn-primary">
          Ver planos e fazer upgrade
        </a>
        <a href="/checkout?plan=starter" className="btn-ghost">
          Essencial — R$ 29/mês
        </a>
      </div>
      <p className="mt-4 text-sm text-mute">O Fechador (R$ 59) inclui IA e follow-up automático.</p>
    </div>
  );
}
