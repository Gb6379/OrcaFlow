"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomerAction, saveCustomerAction } from "@/app/actions";
import { formatPhone } from "@/lib/whatsapp";
import { money } from "@/lib/money";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  quotesCount: number;
  won: number;
};

const empty = {
  id: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export function CustomersManager({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(editing.id);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError("");
    if (editing.id) formData.set("id", editing.id);
    const res = await saveCustomerAction(formData);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditing(empty);
    router.refresh();
  }

  async function remove(customer: CustomerRow) {
    const extra = customer.quotesCount
      ? ` Isso também apaga ${customer.quotesCount} orçamento${customer.quotesCount === 1 ? "" : "s"} ligado${customer.quotesCount === 1 ? "" : "s"} a este cliente.`
      : "";
    if (!confirm(`Apagar ${customer.name}?${extra}`)) return;
    setBusy(true);
    const res = await deleteCustomerAction(customer.id);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (editing.id === customer.id) setEditing(empty);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-serif text-4xl">Clientes</h1>
        <p className="mt-1 text-mute">Edite, apague ou cadastre. A base fica pronta para o próximo orçamento.</p>
        <div className="card mt-6 divide-y divide-ink/5 overflow-hidden">
          {customers.map((c) => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-mute">
                    {c.phone ? formatPhone(c.phone) : "Sem telefone"}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                  {c.address ? <p className="mt-1 text-sm text-mute">{c.address}</p> : null}
                </div>
                <p className="text-sm tabular-nums">{money(c.won)}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="mr-auto text-xs text-mute">
                  {c.quotesCount} orçamento{c.quotesCount === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-xs"
                  onClick={() => {
                    setError("");
                    setEditing({
                      id: c.id,
                      name: c.name,
                      phone: c.phone,
                      email: c.email,
                      address: c.address,
                      notes: c.notes,
                    });
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="btn-ghost px-3 py-1.5 text-xs text-rose-700"
                  onClick={() => remove(c)}
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
          {customers.length === 0 && <p className="px-5 py-8 text-mute">Nenhum cliente ainda.</p>}
        </div>
      </div>

      <form key={editing.id || "new"} action={onSubmit} className="card h-fit space-y-3 p-5">
        <h2 className="font-serif text-2xl">{isEdit ? "Editar cliente" : "Novo cliente"}</h2>
        {isEdit && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label className="label">Nome</label>
          <input name="name" required className="field" defaultValue={editing.name} />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input name="phone" className="field" defaultValue={editing.phone} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input name="email" className="field" defaultValue={editing.email} />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input
            name="address"
            className="field"
            placeholder="Rua, número, bairro, cidade"
            defaultValue={editing.address}
          />
        </div>
        <div>
          <label className="label">Notas</label>
          <textarea name="notes" className="field min-h-20" defaultValue={editing.notes} />
        </div>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="btn-forest w-full">
          {isEdit ? "Salvar alterações" : "Salvar cliente"}
        </button>
        {isEdit && (
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => {
              setEditing(empty);
              setError("");
            }}
          >
            Cancelar edição
          </button>
        )}
      </form>
    </div>
  );
}
