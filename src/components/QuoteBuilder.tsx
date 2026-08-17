"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseQuoteAction, saveQuoteAction, sendQuoteAction } from "@/app/actions";
import { QuotePreview } from "./QuotePreview";
import { DecimalInput } from "./DecimalInput";
import type { QuoteItem } from "@/lib/money";
import type { ParsedQuote } from "@/lib/parser";
import { hasPlan } from "@/lib/plans";
import { PlanLimitCard } from "./PlanLimitCard";

type Customer = { id: string; name: string; phone: string; email: string };

const emptyItem = (): QuoteItem => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
  kind: "labor",
});

export function QuoteBuilder({
  companyName,
  plan,
  customers,
  initial,
  quota,
}: {
  companyName: string;
  plan: string;
  customers: Customer[];
  initial?: {
    id: string;
    number: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    title: string;
    notes: string;
    items: QuoteItem[];
    discountType: "none" | "percent" | "fixed";
    discountValue: number;
  };
  quota?: { used: number; limit: number; remaining: number; atLimit: boolean };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"form" | "ai">("form");
  const [prompt, setPrompt] = useState(
    "João, coloca instalação 3 ar condicionado 300 cada, material 350 e dá 10% desconto se pagar à vista.",
  );
  const [listening, setListening] = useState(false);
  const [customerName, setCustomerName] = useState(initial?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(initial?.customerPhone || "");
  const [customerEmail, setCustomerEmail] = useState(initial?.customerEmail || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [items, setItems] = useState<QuoteItem[]>(
    initial?.items?.length
      ? initial.items
      : [
          { description: "Mão de obra", quantity: 1, unitPrice: 0, kind: "labor" },
          { description: "Material", quantity: 1, unitPrice: 0, kind: "material" },
        ],
  );
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">(initial?.discountType || "none");
  const [discountValue, setDiscountValue] = useState(initial?.discountValue || 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [limitHit, setLimitHit] = useState(Boolean(quota?.atLimit));
  const canAI = hasPlan(plan, "pro");

  const updateItem = (index: number, patch: Partial<QuoteItem>) => {
    setItems((curr) => curr.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  function applyParsed(parsed?: ParsedQuote) {
    if (!parsed) return;
    if (parsed.customerName) setCustomerName(parsed.customerName);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.items?.length) setItems(parsed.items);
    setDiscountType(parsed.discountType);
    setDiscountValue(parsed.discountValue);
    if (parsed.notes) setNotes(parsed.notes);
    setMode("form");
  }

  async function runParse() {
    setBusy(true);
    setError("");
    const res = await parseQuoteAction(prompt);
    setBusy(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("parsed" in res) applyParsed(res.parsed);
  }

  function startVoice() {
    const Speech = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
      || (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition;
    if (!Speech) {
      setError("Seu navegador não suporta ditado. Use o Chrome.");
      return;
    }
    const rec = new Speech();
    rec.lang = "pt-BR";
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const said = event.results[0][0].transcript;
      setPrompt(said);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function save(andSend: boolean) {
    setBusy(true);
    setError("");
    const saved = await saveQuoteAction({
      id: initial?.id,
      customerName,
      customerPhone,
      customerEmail,
      title,
      notes,
      items: items
        .filter((item) => item.description.trim())
        .map((item) => ({ ...item, quantity: Math.max(1, item.quantity || 1) })),
      discountType,
      discountValue,
    });
    if ("error" in saved && saved.error) {
      setBusy(false);
      if ("code" in saved && saved.code === "PLAN_LIMIT") {
        setLimitHit(true);
        return;
      }
      setError(saved.error);
      return;
    }
    if (!("id" in saved) || !saved.id) {
      setBusy(false);
      setError("Não foi possível salvar.");
      return;
    }
    if (andSend) {
      const sent = await sendQuoteAction(saved.id);
      setBusy(false);
      if ("error" in sent && sent.error) {
        setError(sent.error);
        return;
      }
    } else {
      setBusy(false);
    }
    router.push(`/dashboard/quotes/${saved.id}`);
    router.refresh();
  }

  const customerOptions = useMemo(() => customers, [customers]);

  if (limitHit) {
    return <PlanLimitCard used={quota?.used || 5} limit={quota?.limit || 5} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <div className="flex rounded-full bg-sand/80 p-1 text-sm">
          <button
            onClick={() => setMode("form")}
            className={`flex-1 rounded-full px-4 py-2 ${mode === "form" ? "bg-white shadow-sm" : ""}`}
          >
            Formulário
          </button>
          <button
            onClick={() => setMode("ai")}
            className={`flex-1 rounded-full px-4 py-2 ${mode === "ai" ? "bg-white shadow-sm" : ""}`}
          >
            Texto / voz
          </button>
        </div>

        {mode === "ai" && (
          <div className="card p-5">
            <p className="font-serif text-2xl">Fale como você fala com o cliente</p>
            <p className="mt-1 text-sm text-mute">
              A IA monta cliente, serviço, mão de obra, material e desconto.
            </p>
            {!canAI && (
              <p className="mt-3 rounded-2xl bg-ember-soft px-3 py-2 text-sm">
                Disponível no plano Fechador. Você ainda pode preencher no formulário.
              </p>
            )}
            <textarea
              className="field mt-4 min-h-36"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={!canAI || busy} onClick={runParse} className="btn-primary disabled:opacity-50">
                {busy ? "Montando..." : "Gerar orçamento com IA"}
              </button>
              <button disabled={!canAI} onClick={startVoice} className="btn-ghost disabled:opacity-50">
                {listening ? "Ouvindo..." : "Ditar no microfone"}
              </button>
            </div>
          </div>
        )}

        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Cliente</label>
            <input
              className="field"
              list="customers"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                const found = customerOptions.find((c) => c.name === e.target.value);
                if (found) {
                  setCustomerPhone(found.phone);
                  setCustomerEmail(found.email);
                }
              }}
              placeholder="João Silva"
            />
            <datalist id="customers">
              {customerOptions.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">WhatsApp</label>
              <input className="field" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="11987654321" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="field" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="opcional" />
            </div>
          </div>
          <div>
            <label className="label">Serviço</label>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Instalação de 3 aparelhos de ar-condicionado"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Itens</label>
              <button onClick={() => setItems((curr) => [...curr, emptyItem()])} className="text-xs text-forest">
                + item
              </button>
            </div>
            <div className="mb-1 grid grid-cols-[1fr_5.25rem_6.75rem_1.75rem] gap-2 px-0.5">
              <span className="text-[11px] font-medium text-mute">Descrição</span>
              <span className="text-[11px] font-medium text-mute">Quantidade</span>
              <span className="text-[11px] font-medium text-mute">Valor (R$)</span>
              <span />
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_5.25rem_6.75rem_1.75rem] items-center gap-2">
                  <input
                    className="field py-2"
                    value={item.description}
                    placeholder="Descrição"
                    aria-label="Descrição"
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                  <DecimalInput
                    className="field py-2"
                    integer
                    emptyIfZero={false}
                    value={item.quantity}
                    onChange={(n) => updateItem(i, { quantity: n })}
                    ariaLabel="Quantidade"
                    placeholder="1"
                  />
                  <DecimalInput
                    className="field py-2"
                    value={item.unitPrice}
                    onChange={(n) => updateItem(i, { unitPrice: n })}
                    ariaLabel="Valor unitário em reais"
                    placeholder="0,00"
                  />
                  <button className="text-mute" onClick={() => setItems((curr) => curr.filter((_, idx) => idx !== i))} aria-label="Remover item">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Desconto</label>
              <select
                className="field"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
              >
                <option value="none">Sem desconto</option>
                <option value="percent">Porcentagem</option>
                <option value="fixed">Valor fixo</option>
              </select>
            </div>
            <div>
              <label className="label">Valor do desconto</label>
              <DecimalInput
                className="field"
                value={discountValue}
                onChange={setDiscountValue}
                ariaLabel="Valor do desconto"
                disabled={discountType === "none"}
                placeholder={discountType === "percent" ? "10" : "0,00"}
              />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="field min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

        <div className="flex flex-wrap gap-3 pb-20 lg:pb-0">
          <button disabled={busy} onClick={() => save(false)} className="btn-ghost">
            Salvar rascunho
          </button>
          <button disabled={busy} onClick={() => save(true)} className="btn-primary">
            Gerar orçamento
          </button>
        </div>
      </div>

      <div className="lg:sticky lg:top-8">
        <QuotePreview
          companyName={companyName}
          number={initial?.number}
          customerName={customerName}
          title={title}
          items={items}
          discountType={discountType}
          discountValue={discountValue}
          notes={notes}
        />
      </div>
    </div>
  );
}

type SpeechRecognition = {
  lang: string;
  start: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEvent = { results: { 0: { 0: { transcript: string } } } };
