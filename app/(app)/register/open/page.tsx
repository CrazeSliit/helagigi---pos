"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Avatar, Button, Card, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DenominationCounter, DENOMS } from "@/components/pos-kit";
import { api, errText } from "@/lib/api";
import { homeFor } from "@/lib/features";
import { ddmmyyyy, rs } from "@/lib/format";
import { branchOf, useSession } from "@/lib/session";

export default function OpenShift() {
  const router = useRouter();
  const { me } = useSession();
  const [v, setV] = useState<Record<number, number>>({});
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const total = DENOMS.reduce((s, d) => s + d * (v[d] || 0), 0);
  useEffect(() => {
    api("/shifts/current").then((s) => { if (s) router.replace("/register"); else setChecking(false); }).catch((e) => { setErr(errText(e)); setChecking(false); });
  }, [router]);
  const start = async () => {
    setBusy(true); setErr("");
    try { await api("/shifts/open", { body: { openingFloat: total } }); router.push(homeFor(me.permissions)); }
    catch (e) { setErr(errText(e)); setBusy(false); }
  };
  if (checking) return <p className="py-20 text-center text-sm text-fg2" role="status">Loading…</p>;
  return (
    <>
      <PageHeader title="Open shift" sub="Count the opening float in the drawer" />
      <SubNav module="register" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DenominationCounter value={v} onChange={setV} />
        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card>
            <div className="flex items-center gap-3"><Avatar name={me.name} color={me.color} size={44} /><div><p className="font-semibold">{me.name}</p><p className="text-cap text-fg2">{branchOf(me)?.name} · {ddmmyyyy(new Date())}</p></div></div>
            <div className="mt-5 rounded-card bg-tint p-4"><p className="text-sm text-fg2">Opening float</p><p className="font-heading text-[32px] font-bold tnum">{rs(total)}</p></div>
            {err && <p role="alert" className="mt-3 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
            <Button variant="primary" size="pos" className="mt-4 w-full" icon={Play} loading={busy} onClick={() => void start()}>Start shift</Button>
          </Card>
        </div>
      </div>
    </>
  );
}
