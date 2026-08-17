"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";

const links = [
  { href: "/dashboard", label: "Início", icon: "home" },
  { href: "/dashboard/quotes", label: "Orçamentos", icon: "file" },
  { href: "/dashboard/quotes/new", label: "Novo", icon: "plus" },
  { href: "/dashboard/follow-ups", label: "Follow-up", icon: "bell" },
  { href: "/dashboard/customers", label: "Clientes", icon: "people" },
  { href: "/dashboard/payments", label: "Pagamentos", icon: "card" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (name === "home")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  if (name === "file")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  if (name === "bell")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M6 16h12l-1.2-2.2A6 6 0 0 1 6.8 8.5 5 5 0 0 1 12 4a5 5 0 0 1 5.2 4.5" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    );
  if (name === "card")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18M7 14h4" />
      </svg>
    );
  return (
    <svg {...common} viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.2" />
      <path d="M4 19a5 5 0 0 1 10 0M14 19a4 4 0 0 1 6 0" />
    </svg>
  );
}

export function DashboardNav({
  companyName,
  plan,
  admin = false,
}: {
  companyName: string;
  plan: string;
  admin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const planLabel: Record<string, string> = {
    free: "Inicial",
    starter: "Essencial",
    pro: "Fechador",
    business: "Equipe",
  };

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-ink/10 bg-cream/80 p-5 lg:flex lg:flex-col">
        <a href="/" className="font-serif text-2xl">
          Orça<span className="text-forest">Flow</span>
        </a>
        <p className="mt-3 text-sm text-mute">{companyName}</p>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-forest">{planLabel[plan] || "Inicial"}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm ${
                  active ? "bg-forest text-cream" : "text-ink/80 hover:bg-sand/70"
                }`}
              >
                <Icon name={link.icon} />
                {link.label}
              </a>
            );
          })}
          <a
            href="/dashboard/settings"
            className={`mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm ${
              pathname === "/dashboard/settings" ? "bg-forest text-cream" : "hover:bg-sand/70"
            }`}
          >
            Configurações
          </a>
          {admin ? (
            <a href="/admin" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-ember hover:bg-sand/70">
              Painel admin
            </a>
          ) : null}
          <form action={logoutAction}>
            <button className="mt-1 w-full rounded-2xl px-3 py-2.5 text-left text-sm text-mute hover:bg-sand/70">
              Sair
            </button>
          </form>
        </nav>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <a href="/dashboard" className="font-serif text-xl">
          OrçaFlow
        </a>
        <button onClick={() => setOpen((v) => !v)} className="rounded-full border border-ink/10 px-3 py-1 text-sm">
          Menu
        </button>
      </header>
      {open && (
        <div className="border-b border-ink/10 bg-cream px-4 py-3 lg:hidden">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="block py-2 text-sm">
              {link.label}
            </a>
          ))}
          <a href="/dashboard/settings" className="block py-2 text-sm">
            Configurações
          </a>
          {admin ? (
            <a href="/admin" className="block py-2 text-sm text-ember">
              Painel admin
            </a>
          ) : null}
          <form action={logoutAction}>
            <button className="py-2 text-sm text-mute">Sair</button>
          </form>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-ink/10 bg-cream/95 px-1 py-2 backdrop-blur lg:hidden">
        {links.slice(0, 5).map((link) => {
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 rounded-2xl py-1 text-[10px] ${
                active ? "text-ember" : "text-mute"
              }`}
            >
              <span className={link.icon === "plus" ? "rounded-full bg-ember p-1 text-white" : ""}>
                <Icon name={link.icon} />
              </span>
              {link.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
