import type { QuoteItem } from "./money";

export type ParsedQuote = {
  customerName: string;
  title: string;
  items: QuoteItem[];
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  notes: string;
};

function toNumber(raw: string) {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function grabMoney(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return toNumber(match[1]);
  }
  return 0;
}

export function parseQuoteText(input: string): ParsedQuote {
  const text = input.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();

  const name = "([A-ZÁÉÍÓÚÂÊÔÃÕ][a-zàáâãäéêíóôõúç]+)";
  let customerName = "";
  const pro = text.match(new RegExp(`(?:pro|para|pro cliente|cliente)\\s+${name}(?:\\s+${name})?`, "i"));
  const leading = text.match(new RegExp(`^${name}(?:\\s+${name})?\\s*[,:]`));
  if (pro?.[1]) customerName = [pro[1], pro[2]].filter(Boolean).join(" ");
  else if (leading?.[1]) customerName = [leading[1], leading[2]].filter(Boolean).join(" ");

  const qtyMatch = lower.match(/(\d+)\s*(?:ar[\s-]*condicionados?|acs?|aparelhos|unidades?)/i);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;

  const eachPrice = grabMoney(lower, [/(\d+(?:[.,]\d+)?)\s*(?:reais\s+)?cada/i]);
  const labor = grabMoney(lower, [
    /(\d+(?:[.,]\d+)?)\s*(?:reais\s+)?(?:de\s+)?m[aã]o\s*de\s*obra/i,
    /m[aã]o\s*de\s*obra\s*(?:de\s+|:?\s*)(?:r\$\s*)?(\d+(?:[.,]\d+)?)/i,
  ]);
  const material = grabMoney(lower, [
    /materi(?:al|ais)\s*(?:aproximadamente\s*|aprox\.?\s*|uns\s*)?(?:r\$\s*)?(\d+(?:[.,]\d+)?)/i,
    /(\d+(?:[.,]\d+)?)\s*(?:reais\s+)?(?:de\s+)?materi(?:al|ais)/i,
  ]);

  const discountMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s+)?desconto|desconto\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%/i);
  const discountValue = discountMatch ? toNumber(discountMatch[1] || discountMatch[2] || "0") : 0;

  let title = "";
  if (/ar[\s-]*condicionad|\bacs?\b/i.test(text)) {
    title =
      quantity > 1
        ? `Instalação de ${quantity} aparelhos de ar-condicionado`
        : "Instalação de ar-condicionado";
  } else if (/fia[cç][aã]o/i.test(text)) {
    title = "Troca da fiação";
  } else if (/pintura/i.test(text)) {
    title = "Pintura";
  } else if (/limpeza/i.test(text)) {
    title = "Limpeza";
  } else if (/manuten[cç][aã]o/i.test(text)) {
    title = "Manutenção";
  } else if (/reforma/i.test(text)) {
    title = "Reforma";
  }
  if (!title) {
    title = text
      .replace(/^[^,]*,\s*(?:coloca|faz(?:er)?(?: um orçamento)?|manda)\s*/i, "")
      .replace(/(?:pro|para)\s+[A-Za-zÁÉÍÓÚÂÊÔÃÕáéíóúâêôãõç]+,?/gi, "")
      .replace(/\d+(?:[.,]\d+)?\s*(?:reais|cada|de mão de obra|de material)?/gi, "")
      .replace(/material[^.]*|mão de obra[^.]*|desconto[^.]*|à vista[^.]*|a vista[^.]* /gi, "")
      .replace(/[,.]+/g, " ")
      .trim()
      .slice(0, 80);
  }
  if (!title) title = "Serviço";
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const items: QuoteItem[] = [];
  if (eachPrice && quantity) {
    items.push({
      description: "Mão de obra",
      quantity,
      unitPrice: eachPrice,
      kind: "labor",
    });
  } else if (labor) {
    items.push({
      description: "Mão de obra",
      quantity: 1,
      unitPrice: labor,
      kind: "labor",
    });
  }
  if (material) {
    items.push({
      description: "Material",
      quantity: 1,
      unitPrice: material,
      kind: "material",
    });
  }
  if (!items.length) {
    items.push({ description: title, quantity: 1, unitPrice: 0, kind: "other" });
  }

  const notes = /à vista|a vista/i.test(text) ? "Desconto se pagar à vista." : "";

  return {
    customerName,
    title,
    items,
    discountType: discountValue ? "percent" : "none",
    discountValue,
    notes,
  };
}

export async function parseQuoteWithAI(input: string): Promise<ParsedQuote> {
  const fallback = parseQuoteText(input);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallback;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Extraia um orçamento de serviço em JSON: {"customerName":string,"title":string,"items":[{"description":string,"quantity":number,"unitPrice":number,"kind":"labor"|"material"|"other"}],"discountType":"none"|"percent"|"fixed","discountValue":number,"notes":string}. Valores em reais. Português do Brasil.',
          },
          { role: "user", content: input },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return {
      customerName: parsed.customerName || fallback.customerName,
      title: parsed.title || fallback.title,
      items: Array.isArray(parsed.items) && parsed.items.length ? parsed.items : fallback.items,
      discountType: parsed.discountType || fallback.discountType,
      discountValue: Number(parsed.discountValue) || fallback.discountValue,
      notes: parsed.notes || fallback.notes,
    };
  } catch {
    return fallback;
  }
}
