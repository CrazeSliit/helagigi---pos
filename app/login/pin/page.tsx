"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PinPad } from "@/components/auth";
import { Logo } from "@/components/brand";
import { Avatar } from "@/components/ui";
import { LangSwitch, ThemeToggle } from "@/components/shell";
import { api, ApiFail, errText } from "@/lib/api";

type PinUser = { id: string; name: string; color: string; role: string };

export default function PinLogin() {
  const [people, setPeople] = useState<PinUser[] | null>(null);
  const [error, setError] = useState("");
  const [who, setWho] = useState<PinUser | null>(null);
  useEffect(() => { api<PinUser[]>("/auth/pin-users", { noRedirect: true }).then(setPeople).catch((e) => setError(e instanceof ApiFail && e.status === 403 ? "This terminal isn't registered yet. Sign in once with email and keep “Remember this terminal” ticked." : errText(e))); }, []);
  const submit = useCallback(async (pin: string) => {
    if (!who) return false;
    try {
      await api("/auth/pin-login", { body: { userId: who.id, pin }, noRedirect: true });
      window.location.assign("/pos");
      return true;
    } catch { return false; }
  }, [who]);
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo className="w-[130px]" pos />
        <div className="flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        {!who ? (
          <div className="w-full max-w-3xl text-center">
            <h1 className="font-heading text-2xl font-semibold">Who&apos;s selling today?</h1>
            {error ? <p className="mx-auto mt-4 max-w-md text-sm text-fg2">{error}</p> : <p className="mt-1 text-sm text-fg2">{people ? (people.length ? "Tap your name to sign in with your PIN" : "No staff have a PIN yet.") : "Loading…"}</p>}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {people?.map((s) => (
                <button key={s.id} onClick={() => setWho(s)} className="card flex flex-col items-center gap-3 p-6 transition hover:-translate-y-0.5 hover:border-orange-500/60 hover:shadow-lift active:scale-[.98]">
                  <Avatar name={s.name} size={72} color={s.color} />
                  <span><span className="block font-semibold">{s.name.split(" ")[0]}</span><span className="text-cap text-fg2">{s.role}</span></span>
                </button>
              ))}
            </div>
            <Link href="/login" className="mt-10 inline-flex text-sm font-semibold text-fg2 hover:text-fg">Sign in with email instead</Link>
          </div>
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center">
            <button onClick={() => setWho(null)} className="mb-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-fg2 hover:text-fg"><ArrowLeft size={16} />All staff</button>
            <Avatar name={who.name} size={88} color={who.color} className="shadow-lift ring-4 ring-surface" />
            <h1 className="mt-4 font-heading text-xl font-semibold">Hi, {who.name.split(" ")[0]}</h1>
            <p className="mb-8 text-sm text-fg2">Enter your PIN</p>
            <PinPad onSubmit={submit} />
          </div>
        )}
      </main>
    </div>
  );
}
