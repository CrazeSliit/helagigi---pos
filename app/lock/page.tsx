"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Users2 } from "lucide-react";
import { PinPad } from "@/components/auth";
import { Avatar } from "@/components/ui";

export default function LockScreen() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(i); }, []);
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-900">
      {/* blurred work surface behind */}
      <div className="absolute inset-0 scale-105 blur-xl opacity-60" aria-hidden>
        <div className="grid h-full grid-cols-[62%_38%]">
          <div className="grid grid-cols-4 gap-4 p-10">{Array.from({ length: 16 }).map((_, i) => <div key={i} className="rounded-card" style={{ background: ["#B9DDF7", "#FFF0E0", "#EAF0FB", "#FFA940"][i % 4] }} />)}</div>
          <div className="m-6 rounded-card bg-white" />
        </div>
      </div>
      <div className="absolute inset-0 bg-navy-900/70" />
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 text-white">
        <p className="font-heading text-5xl font-semibold tnum">{now ? now.toLocaleTimeString("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" }) : "15:02"}</p>
        <p className="mt-1 text-white/70">{now ? now.toLocaleDateString("en-GB", { timeZone: "Asia/Colombo", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }) : "Saturday, 21/11/2026"}</p>
        <div className="mt-10 flex flex-col items-center">
          <div className="relative"><Avatar name="Kasun Jayasuriya" size={88} color="#FF7A00" className="ring-4 ring-white/20" /><span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-white text-navy-900"><Lock size={16} /></span></div>
          <p className="mt-4 font-heading text-lg font-semibold">Kasun Jayasuriya</p>
          <p className="mb-8 text-sm text-white/60">Terminal locked · Cart with 3 items is safe</p>
          <PinPad dark onSuccess={() => router.push("/pos")} />
          <Link href="/login/pin" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/80 hover:bg-white/10"><Users2 size={18} />Switch user</Link>
        </div>
      </div>
    </div>
  );
}
