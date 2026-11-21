"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { AuthSplit } from "@/components/auth";
import { Button, Field, Input, PasswordInput, Steps } from "@/components/ui";
import { cn } from "@/lib/format";

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function Forgot() {
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState(["4", "8", "2", "", "", ""]);
  const [pw, setPw] = useState("Kandy@2026");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const s = strength(pw);
  const lbl = ["Too weak", "Weak", "Fair", "Good", "Strong"][s];
  const col = ["bg-danger", "bg-danger", "bg-warning", "bg-amber-400", "bg-success"][s];
  return (
    <AuthSplit>
      <div className="w-full max-w-[420px]">
        <Link href="/login" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-fg2 hover:text-fg"><ArrowLeft size={16} />Back to sign in</Link>
        <Steps steps={["Email", "Verify", "New password"]} current={step} />
        {step === 0 && (
          <form className="mt-10" onSubmit={(e) => { e.preventDefault(); setStep(1); }}>
            <span className="grid h-14 w-14 place-items-center rounded-card bg-orange-100 text-navy-900"><KeyRound size={26} /></span>
            <h1 className="mt-5 font-heading text-2xl font-semibold">Forgot your password?</h1>
            <p className="mt-1 text-sm text-fg2">Enter your account email and we&apos;ll send a 6-digit code.</p>
            <Field label="Email" className="mt-6"><Input type="email" defaultValue="craze@heladigi.lk" className="h-12" /></Field>
            <Button type="submit" variant="primary" size="l" className="mt-6 w-full">Send code</Button>
          </form>
        )}
        {step === 1 && (
          <form className="mt-10" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <span className="grid h-14 w-14 place-items-center rounded-card bg-sky-300/40 text-navy-900 dark:text-sky-300"><MailCheck size={26} /></span>
            <h1 className="mt-5 font-heading text-2xl font-semibold">Check your inbox</h1>
            <p className="mt-1 text-sm text-fg2">We sent a code to <b className="text-fg">craze@heladigi.lk</b>. It expires in 10:00.</p>
            <div className="mt-6 flex gap-2 sm:gap-3">
              {otp.map((d, i) => (
                <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); const n = [...otp]; n[i] = v; setOtp(n); if (v && i < 5) refs.current[i + 1]?.focus(); }}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus(); }}
                  className={cn("h-14 w-full rounded-ctl border-2 bg-surface text-center font-heading text-2xl font-semibold text-fg outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20", d ? "border-navy-900 dark:border-sky-300" : "border-line")} />
              ))}
            </div>
            <p className="mt-3 text-sm text-fg2">Didn&apos;t get it? <button type="button" className="font-semibold text-fg underline-offset-4 hover:underline">Resend in 0:42</button></p>
            <Button type="submit" variant="primary" size="l" className="mt-6 w-full" disabled={otp.some((d) => !d)}>Verify</Button>
          </form>
        )}
        {step === 2 && (
          <form className="mt-10" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <span className="grid h-14 w-14 place-items-center rounded-card bg-success/10 text-success"><ShieldCheck size={26} /></span>
            <h1 className="mt-5 font-heading text-2xl font-semibold">Set a new password</h1>
            <Field label="New password" className="mt-6"><PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
            <div className="mt-3 flex gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < s ? col : "bg-line")} />)}</div>
            <p className="mt-1.5 text-cap font-semibold text-fg2">Strength: <span className="text-fg">{lbl}</span></p>
            <ul className="mt-3 grid grid-cols-2 gap-1.5 text-cap text-fg2">
              {[["8+ characters", pw.length >= 8], ["Uppercase letter", /[A-Z]/.test(pw)], ["A number", /\d/.test(pw)], ["A symbol", /[^A-Za-z0-9]/.test(pw)]].map(([l, ok]) => (
                <li key={l as string} className={cn("flex items-center gap-1.5", ok && "text-success")}><CheckCircle2 size={14} />{l}</li>
              ))}
            </ul>
            <Field label="Confirm password" className="mt-4"><PasswordInput defaultValue="Kandy@2026" /></Field>
            <Button type="submit" variant="primary" size="l" className="mt-6 w-full" disabled={s < 3}>Update password</Button>
          </form>
        )}
        {step === 3 && (
          <div className="mt-12 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success animate-pop"><CheckCircle2 size={40} /></span>
            <h1 className="mt-5 font-heading text-2xl font-semibold">Password updated</h1>
            <p className="mt-1 text-sm text-fg2">You can now sign in with your new password.</p>
            <Link href="/login" className="btn btn-l btn-primary mt-6 w-full">Back to sign in</Link>
          </div>
        )}
      </div>
    </AuthSplit>
  );
}
