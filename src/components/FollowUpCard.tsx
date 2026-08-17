"use client";

import { useRouter } from "next/navigation";
import { markFollowUpSentAction, skipFollowUpAction } from "@/app/actions";
import { whatsappLink } from "@/lib/whatsapp";

export function FollowUpCard({
  id,
  dayOffset,
  customer,
  title,
  message,
  phone,
  scheduledFor,
  due,
}: {
  id: string;
  dayOffset: number;
  customer: string;
  title: string;
  message: string;
  phone: string;
  scheduledFor: string;
  due: boolean;
}) {
  const router = useRouter();

  async function sent() {
    await markFollowUpSentAction(id);
    router.refresh();
  }

  async function skip() {
    await skipFollowUpAction(id);
    router.refresh();
  }

  return (
    <article className={`card p-5 ${due ? "ring-2 ring-ember" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-ember">Dia {dayOffset}</p>
          <h3 className="mt-1 font-serif text-2xl">{customer}</h3>
          <p className="text-sm text-mute">{title}</p>
        </div>
        <p className="text-xs text-mute">{scheduledFor}</p>
      </div>
      <p className="mt-4 whitespace-pre-line rounded-2xl bg-sand/60 px-4 py-3 text-sm">{message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={whatsappLink(phone, message)}
          target="_blank"
          onClick={sent}
          className="btn-primary"
        >
          Enviar no WhatsApp
        </a>
        <button onClick={sent} className="btn-ghost">
          Marcar enviado
        </button>
        <button onClick={skip} className="btn-ghost">
          Pular
        </button>
      </div>
    </article>
  );
}
