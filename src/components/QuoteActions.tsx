"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteQuoteAction, sendQuoteAction } from "@/app/actions";
import { whatsappLink } from "@/lib/whatsapp";

export function QuoteActions({
  id,
  status,
  phone,
  message,
  publicUrl,
}: {
  id: string;
  status: string;
  phone: string;
  message: string;
  publicUrl: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function send() {
    await sendQuoteAction(id);
    router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function remove() {
    if (!confirm("Apagar este orçamento?")) return;
    await deleteQuoteAction(id);
    router.push("/dashboard/quotes");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <button onClick={send} className="btn-primary">
          Enviar orçamento
        </button>
      )}
      {status !== "draft" && (
        <a href={whatsappLink(phone, message)} target="_blank" className="btn-forest">
          Mandar no WhatsApp
        </a>
      )}
      <button onClick={copy} className="btn-ghost">
        {copied ? "Link copiado" : "Copiar link"}
      </button>
      <a href={publicUrl} target="_blank" className="btn-ghost">
        Ver página do cliente
      </a>
      <button onClick={remove} className="btn-ghost text-rose-700">
        Apagar
      </button>
    </div>
  );
}
