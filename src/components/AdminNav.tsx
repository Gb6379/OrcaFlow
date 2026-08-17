"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/users", label: "Usuários" },
  { href: "/admin/subscriptions", label: "Assinaturas" },
  { href: "/admin/revenue", label: "Receita" },
  { href: "/admin/quotes", label: "Orçamentos" },
];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function active(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-ink/10 bg-forest p-5 text-cream lg:flex lg:flex-col">
        <a href="/admin" className="font-serif text-2xl">
          Orça<span className="text-cream/70">Admin</span>
        </a>
        <p className="mt-3 text-sm text-cream/60">{name}</p>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-cream/40">Painel da plataforma</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-3 py-2.5 text-sm ${
                active(link.href) ? "bg-cream text-forest" : "text-cream/80 hover:bg-white/10"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a href="/dashboard" className="mt-auto rounded-2xl px-3 py-2.5 text-sm text-cream/70 hover:bg-white/10">
            Voltar ao app
          </a>
          <form action={logoutAction}>
            <button className="mt-1 w-full rounded-2xl px-3 py-2.5 text-left text-sm text-cream/50 hover:bg-white/10">
              Sair
            </button>
          </form>
        </nav>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-forest px-4 py-3 text-cream lg:hidden">
        <a href="/admin" className="font-serif text-xl">
          OrçaAdmin
        </a>
        <button onClick={() => setOpen((v) => !v)} className="rounded-full border border-cream/20 px-3 py-1 text-sm">
          Menu
        </button>
      </header>
      {open && (
        <div className="border-b border-ink/10 bg-forest px-4 py-3 text-cream lg:hidden">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="block py-2 text-sm">
              {link.label}
            </a>
          ))}
          <a href="/dashboard" className="block py-2 text-sm text-cream/70">
            Voltar ao app
          </a>
          <form action={logoutAction}>
            <button className="py-2 text-sm text-cream/50">Sair</button>
          </form>
        </div>
      )}
    </>
  );
}
