"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminDeleteUserAction,
  adminExtendPlanAction,
  adminSetRoleAction,
  adminToggleBlockAction,
  adminUpdatePlanAction,
} from "@/app/admin-actions";
import { PLAN_LABEL } from "@/lib/plans";

export function AdminUserControls({
  user,
}: {
  user: {
    id: string;
    email: string;
    plan: string;
    planStatus: string;
    planPeriodEnd: string | null;
    role: string;
    blockedAt: string | null;
    isSelf: boolean;
  };
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function run(action: (data: FormData) => Promise<{ error?: string; deleted?: boolean }>, formData: FormData) {
    setMsg("");
    const res = await action(formData);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    if ("deleted" in res && res.deleted) {
      router.push("/admin/users");
      return;
    }
    setMsg("Salvo.");
    router.refresh();
  }

  const period = user.planPeriodEnd ? user.planPeriodEnd.slice(0, 10) : "";

  return (
    <div className="space-y-6">
      <form
        className="card space-y-4 p-6"
        action={(data) => run(adminUpdatePlanAction, data)}
      >
        <h2 className="font-serif text-2xl">Assinatura</h2>
        <input type="hidden" name="userId" value={user.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Plano</label>
            <select name="plan" className="field" defaultValue={user.plan}>
              {Object.entries(PLAN_LABEL).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select name="planStatus" className="field" defaultValue={user.planStatus}>
              <option value="active">Ativa</option>
              <option value="canceled">Cancelada</option>
              <option value="expired">Expirada</option>
              <option value="past_due">Inadimplente</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Válida até</label>
          <input name="planPeriodEnd" type="date" className="field" defaultValue={period} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="complimentary" className="h-4 w-4" />
          Cortesia (acesso sem cobrar)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="recordPayment" className="h-4 w-4" />
          Lançar cobrança na receita
        </label>
        <button className="btn-forest">Salvar plano</button>
      </form>

      <form className="card flex flex-wrap items-end gap-3 p-6" action={(data) => run(adminExtendPlanAction, data)}>
        <input type="hidden" name="userId" value={user.id} />
        <div>
          <label className="label">Estender</label>
          <input name="days" type="number" min={1} defaultValue={30} className="field w-28" />
        </div>
        <button className="btn-ghost">+ dias</button>
      </form>

      <form className="card flex flex-wrap items-end gap-3 p-6" action={(data) => run(adminSetRoleAction, data)}>
        <input type="hidden" name="userId" value={user.id} />
        <div>
          <label className="label">Papel</label>
          <select name="role" className="field w-40" defaultValue={user.role}>
            <option value="user">Usuário</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button className="btn-ghost" disabled={user.isSelf && user.role === "admin"}>
          Salvar papel
        </button>
      </form>

      <form className="card space-y-3 p-6" action={(data) => run(adminToggleBlockAction, data)}>
        <input type="hidden" name="userId" value={user.id} />
        <h2 className="font-serif text-2xl">{user.blockedAt ? "Desbloquear" : "Bloquear"}</h2>
        <p className="text-sm text-mute">
          {user.blockedAt ? "A conta volta a entrar no app." : "A pessoa não consegue mais fazer login."}
        </p>
        <button className="btn-ghost" disabled={user.isSelf}>
          {user.blockedAt ? "Desbloquear conta" : "Bloquear conta"}
        </button>
      </form>

      <form className="card space-y-3 p-6" action={(data) => run(adminDeleteUserAction, data)}>
        <input type="hidden" name="userId" value={user.id} />
        <h2 className="font-serif text-2xl text-rose-800">Apagar conta</h2>
        <p className="text-sm text-mute">
          Apaga usuário, clientes, orçamentos e pagamentos. Digite <strong>{user.email}</strong> para confirmar.
        </p>
        <input name="confirm" className="field" placeholder={user.email} disabled={user.isSelf} />
        <button className="btn bg-rose-700 text-white hover:bg-rose-800" disabled={user.isSelf}>
          Apagar definitivamente
        </button>
      </form>

      {msg && <p className="text-sm text-forest">{msg}</p>}
    </div>
  );
}
