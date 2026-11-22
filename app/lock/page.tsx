"use client";
import { useCallback, useEffect, useState } from "react";
import { Lock, Users2 } from "lucide-react";
import { PinPad } from "@/components/auth";
import { Avatar } from "@/components/ui";
import { api, ApiFail } from "@/lib/api";
import { homeFor } from "@/lib/features";
import type { Me } from "@/lib/session";

export default function LockScreen() {
  const [me, setMe] = useState<Me | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(i); }, []);
  useEffect(() => {
    api<Me>("/auth/me", { noRedirect: true }).then((m) => { if (!m.locked) window.location.assign(homeFor(m.permissions)); else setMe(m); })
      .catch((e) => { if (e instanceof ApiFail && e.status === 401) window.location.assign("/login"); });
  }, []);
  const unlock = useCallback(async (pin: string) => {
    if (!me) return false;
    try {
      await api("/auth/unlock", { body: { pin }, noRedirect: true });
      window.location.assign(homeFor(me.permissions));
      return true;
    } catch { return false; }
  }, [me]);
  const switchUser = async () => {
    try { await api("/auth/logout", { body: {}, noRedirect: true }); } finally { window.location.assign("/login/pin"); }
  };
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-900">
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 text-white">
        <p className="font-heading text-5xl font-semibold tnum">{now?.toLocaleTimeString("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" })}</p>
        <p className="mt-1 text-white/70">{now?.toLocaleDateString("en-GB", { timeZone: "Asia/Colombo", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
        {me && (
          <div className="mt-10 flex flex-col items-center">
            <div className="relative"><Avatar name={me.name} size={88} color={me.color} className="ring-4 ring-white/20" /><span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-white text-navy-900"><Lock size={16} /></span></div>
            <p className="mt-4 font-heading text-lg font-semibold">{me.name}</p>
            <p className="mb-8 text-sm text-white/60">Terminal locked</p>
            <PinPad dark onSubmit={unlock} />
            <button onClick={() => void switchUser()} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/80 hover:bg-white/10"><Users2 size={18} />Switch user</button>
          </div>
        )}
      </div>
    </div>
  );
}
