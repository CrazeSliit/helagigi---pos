"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Grid3x3, Mail } from "lucide-react";
import { AuthSplit } from "@/components/auth";
import { Logo } from "@/components/brand";
import { Button, Checkbox, Field, Input, PasswordInput } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  return (
    <AuthSplit>
      <form className="w-full max-w-[400px]" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (!f.get("user")) return setErr("Enter your email or username");
        setErr(""); setLoading(true); setTimeout(() => router.push("/branch-select"), 700);
      }}>
        <Logo className="w-[180px]" pos />
        <h2 className="mt-8 font-heading text-2xl font-semibold">Welcome back</h2>
        <p className="mt-1 text-sm text-fg2">Sign in to your HeladiGi POS account.</p>
        <div className="mt-8 space-y-4">
          <Field label="Email or username" error={err}><Input name="user" defaultValue="craze@heladigi.lk" autoComplete="username" invalid={!!err} className="h-12" /></Field>
          <Field label="Password"><PasswordInput name="pw" defaultValue="heladigi2026" autoComplete="current-password" className="h-12" /></Field>
          <div className="flex items-center justify-between">
            <Checkbox checked={remember} onChange={setRemember} label="Remember this terminal" />
            <Link href="/forgot" className="text-sm font-semibold text-fg underline-offset-4 hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" variant="primary" size="l" className="h-12 w-full text-base" loading={loading}>Sign In</Button>
        </div>
        <div className="my-6 flex items-center gap-3 text-cap text-fg2"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
        <Link href="/login/pin" className="btn btn-l btn-outline w-full"><Grid3x3 size={18} />Cashier PIN login</Link>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-cap text-fg2"><Mail size={13} />Need an account? Contact support@heladigi.lk</p>
      </form>
    </AuthSplit>
  );
}
