"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { loginAction, loginDemoAction } from "../actions";

function LoginForm() {
  const [error, setError] = useState("");
  const next = useSearchParams().get("next") || "/dashboard";
  const blocked = useSearchParams().get("blocked");

  async function onSubmit(formData: FormData) {
    const res = await loginAction(formData);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-forest p-10 text-cream lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <div>
          <h1 className="font-serif text-5xl leading-tight">O cliente viu. Você não cobrou. O serviço foi embora.</h1>
          <p className="mt-4 max-w-md text-cream/70">Entre e veja orçamentos em Enviado, Visualizado e Aceito — e os follow-ups que já deveriam ter saído.</p>
        </div>
        <p className="text-sm text-cream/50">Demo: demo@orcaflow.com.br / demo1234</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h2 className="mt-8 font-serif text-4xl">Entrar</h2>
          <form action={onSubmit} className="mt-8 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="label">E-mail</label>
              <input name="email" type="email" required className="field" defaultValue="demo@orcaflow.com.br" />
            </div>
            <div>
              <label className="label">Senha</label>
              <input name="password" type="password" required className="field" defaultValue="demo1234" />
            </div>
            {blocked ? (
              <p className="text-sm text-rose-700">Esta conta foi bloqueada. Fale com o suporte.</p>
            ) : null}
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <button className="btn-primary w-full">Entrar</button>
          </form>
          <form action={loginDemoAction} className="mt-3">
            <button className="btn-ghost w-full">Abrir conta demo</button>
          </form>
          <p className="mt-6 text-sm text-mute">
            Ainda não tem conta?{" "}
            <a href="/register" className="text-forest underline">
              Criar grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
