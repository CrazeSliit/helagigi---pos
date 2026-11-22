"use client";
import Link from "next/link";
import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import { AuthSplit } from "@/components/auth";
import { Logo } from "@/components/brand";
import { Button, Checkbox, Field, Input, PasswordInput } from "@/components/ui";
import { api, errText } from "@/lib/api";

export default function Login() {
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  return (
    <AuthSplit>
      <form className="w-full max-w-[400px]" onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const user = String(f.get("user") ?? "").trim(), password = String(f.get("pw") ?? "");
        if (!user || !password) return setErr("Enter your email or username and password");
        setErr(""); setLoading(true);
        try {
          await api("/auth/login", { body: { user, password }, noRedirect: true });
          try { sessionStorage.setItem("hd.remember", remember ? "1" : "0"); } catch { /* storage unavailable */ }
          window.location.assign("/branch-select");
        } catch (x) { setErr(errText(x)); setLoading(false); }
      }}>
        <Logo className="w-[180px]" pos />
        <h2 className="mt-8 font-heading text-2xl font-semibold">Welcome back</h2>
        <p className="mt-1 text-sm text-fg2">Sign in to your HeladiGi POS account.</p>
        <div className="mt-8 space-y-4">
          <Field label="Email or username" error={err}><Input name="user" autoComplete="username" autoFocus invalid={!!err} className="h-12" /></Field>
          <Field label="Password"><PasswordInput name="pw" autoComplete="current-password" className="h-12" /></Field>
          <Checkbox checked={remember} onChange={setRemember} label="Remember this terminal for PIN login" />
          <Button type="submit" variant="primary" size="l" className="h-12 w-full text-base" loading={loading}>Sign In</Button>
        </div>
        <div className="my-6 flex items-center gap-3 text-cap text-fg2"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
        <Link href="/login/pin" className="btn btn-l btn-outline w-full"><Grid3x3 size={18} />Cashier PIN login</Link>
        <p className="mt-8 text-center text-cap text-fg2">Forgot your password? Ask your manager or the business owner to reset it.</p>
      </form>
    </AuthSplit>
  );
}
