"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { api, errText, METHOD } from "@/lib/api";
import { ddmmyyyy, hhmm, rs } from "@/lib/format";
import { branchOf, useSession } from "@/lib/session";
import type { ShiftSummary } from "../page";

const S = ({ t }: { t: string }) => <><div className="my-2 border-t border-dashed border-black" /><p className="text-center font-bold">{t}</p><div className="my-2 border-t border-dashed border-black" /></>;
const R = ({ a, b, bold }: { a: string; b: string; bold?: boolean }) => <div className={`flex justify-between ${bold ? "font-bold" : ""}`}><span>{a}</span><span className="tnum">{b}</span></div>;
const n = (v: number) => rs(v, { prefix: false });
const when = (iso: string) => `${ddmmyyyy(new Date(iso))} ${hhmm(new Date(iso))}`;

export default function ZReport() {
  const { me } = useSession();
  const [d, setD] = useState<(ShiftSummary & { type: "X" | "Z" }) | null>(null);
  const [err, setErr] = useState("");
  const [none, setNone] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        let id = new URLSearchParams(window.location.search).get("id");
        if (!id) id = (await api<{ shift: { id: string } } | null>("/shifts/current"))?.shift.id ?? null;
        if (!id) return setNone(true);
        setD(await api(`/shifts/${encodeURIComponent(id)}/report`));
      } catch (e) { setErr(errText(e)); }
    })();
  }, []);
  const head = <SubNav module="register" />;
  if (err) return <><PageHeader title="Shift report" />{head}<p role="alert" className="py-16 text-center font-semibold text-danger">{err}</p></>;
  if (none) return <><PageHeader title="Shift report" />{head}<p className="py-16 text-center text-sm text-fg2">No open shift. Pick a closed shift from <Link href="/register/history" className="font-semibold underline">Shift history</Link>.</p></>;
  if (!d) return <p className="py-20 text-center text-sm text-fg2" role="status">Loading…</p>;
  const net = d.grossSales - d.returnsTotal;
  const variance = d.shift.variance ?? 0;
  const expected = d.shift.expectedCash ?? d.expectedCash;
  return (
    <>
      <PageHeader title={`${d.type}-Report`} sub={d.type === "Z" ? "End-of-shift report" : "Mid-shift snapshot"} actions={<Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>} />
      {head}
      <div className="rounded-card bg-surface-2 py-8">
        <div className="print-area mx-auto w-[302px] bg-white px-4 py-5 font-mono text-[11px] leading-[15px] text-black shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="HeladiGi" className="mx-auto mb-2 w-[55%]" />
          <p className="text-center font-bold">HeladiGi Mart — {branchOf(me)?.name}</p>
          <p className="text-center text-[14px] font-bold">{d.type}-REPORT</p>
          <p className="text-center">{d.shift.number}</p>
          <S t="SHIFT" />
          <R a="Opened" b={when(d.shift.openedAt)} /><R a="Closed" b={d.shift.closedAt ? when(d.shift.closedAt) : "— open —"} />
          <S t="SALES" />
          <R a="Sales (after discounts)" b={n(d.grossSales)} /><R a="Discounts given" b={n(d.discounts)} /><R a={`Returns (${d.returnsCount})`} b={`-${n(d.returnsTotal)}`} /><R a="Net sales" b={n(net)} bold />
          <R a="VAT (incl.)" b={n(d.tax)} /><R a="Transactions" b={String(d.salesCount)} /><R a="Avg basket" b={n(d.salesCount ? d.grossSales / d.salesCount : 0)} />
          <S t="PAYMENTS (NET)" />
          {d.payments.length ? d.payments.map((p) => <R key={p.method} a={METHOD[p.method] ?? p.method} b={n(p.amount)} />) : <p className="text-center">No payments</p>}
          <S t="CASH DRAWER" />
          <R a="Opening float" b={n(d.openingFloat)} /><R a="Cash sales (net)" b={n(d.cashSales)} /><R a="Cash in" b={n(d.cashIn)} /><R a="Cash out" b={`-${n(d.cashOut)}`} />
          <R a="Expected" b={n(expected)} bold />
          {d.shift.countedCash != null && <><R a="Counted" b={n(d.shift.countedCash)} /><R a={`Variance${variance < 0 ? " (SHORT)" : variance > 0 ? " (OVER)" : ""}`} b={n(variance)} bold /></>}
          <div className="my-2 border-t border-dashed border-black" />
          <p className="mt-6">Cashier: ______________</p><p className="mt-4">Manager: ______________</p>
        </div>
      </div>
    </>
  );
}
