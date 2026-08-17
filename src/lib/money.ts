export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function money(value: number) {
  return brl.format(value || 0);
}

export function parseMoney(raw: string) {
  const cleaned = raw.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === "," || cleaned === ".") return 0;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export type QuoteItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  kind: "labor" | "material" | "other";
};

export function itemTotal(item: QuoteItem) {
  return (item.quantity || 0) * (item.unitPrice || 0);
}

export function calcTotals(
  items: QuoteItem[],
  discountType: "none" | "percent" | "fixed",
  discountValue: number,
) {
  const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0);
  let discount = 0;
  if (discountType === "percent") discount = subtotal * (discountValue / 100);
  if (discountType === "fixed") discount = discountValue;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}
