import { money, calcTotals, type QuoteItem } from "@/lib/money";

export function QuotePreview({
  companyName,
  number,
  customerName,
  title,
  items,
  discountType,
  discountValue,
  notes,
  validDays,
}: {
  companyName: string;
  number?: number;
  customerName: string;
  title: string;
  items: QuoteItem[];
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  notes?: string;
  validDays?: number;
}) {
  const { subtotal, discount, total } = calcTotals(items, discountType, discountValue);

  return (
    <div className="ticket rounded-[28px] border-[6px] border-transparent bg-cream p-6 shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-mute">Orçamento</p>
          <h3 className="font-serif text-2xl text-forest">{companyName}</h3>
        </div>
        <p className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-cream">
          #{number || "—"}
        </p>
      </div>
      <div className="mt-6 border-t border-dashed border-ink/15 pt-5">
        <p className="text-xs uppercase tracking-[0.16em] text-mute">Cliente</p>
        <p className="mt-1 text-lg font-medium">{customerName || "Nome do cliente"}</p>
        <p className="mt-4 font-serif text-xl leading-snug">{title || "Descrição do serviço"}</p>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {items.length === 0 && <li className="text-mute">Nenhum item ainda</li>}
        {items.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-4">
            <span>
              {item.description}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </span>
            <span className="tabular-nums">{money(item.quantity * item.unitPrice)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 border-t border-ink/10 pt-4 text-sm">
        <div className="flex justify-between text-mute">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex justify-between text-forest">
            <span>Desconto</span>
            <span>- {money(discount)}</span>
          </div>
        )}
        <div className="mt-3 flex items-end justify-between">
          <span className="text-xs uppercase tracking-[0.16em] text-mute">Total</span>
          <span className="font-serif text-3xl text-forest">{money(total)}</span>
        </div>
      </div>
      {notes ? <p className="mt-4 text-sm text-mute">{notes}</p> : null}
      <p className="mt-6 text-xs text-mute">Validade: {validDays || 7} dias</p>
      <div className="mt-5 rounded-2xl bg-ember px-4 py-3 text-center text-sm font-semibold text-white">
        ACEITAR ORÇAMENTO
      </div>
    </div>
  );
}
