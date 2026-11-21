"use client";
import { useState } from "react";
import { Mail, Printer } from "lucide-react";
import { Button, PageHeader, Segmented } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { rs } from "@/lib/format";

export default function ZReport() {
  const [kind, setKind] = useState<"Z" | "X">("Z");
  const S = ({ t }: { t: string }) => <><div className="my-2 border-t border-dashed border-black" /><p className="text-center font-bold">{t}</p><div className="my-2 border-t border-dashed border-black" /></>;
  const R = ({ a, b, bold }: { a: string; b: string; bold?: boolean }) => <div className={`flex justify-between ${bold ? "font-bold" : ""}`}><span>{a}</span><span className="tnum">{b}</span></div>;
  return (
    <>
      <PageHeader title={`${kind}-Report`} sub={kind === "Z" ? "End-of-day report · resets totals" : "Mid-shift snapshot · does not reset"} actions={<><Segmented value={kind} onChange={setKind} options={[{ v: "Z", label: "Z-Report" }, { v: "X", label: "X-Report" }]} /><Button icon={Mail}>Email</Button><Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button></>} />
      <SubNav module="register" />
      <div className="rounded-card bg-surface-2 py-8">
        <div className="print-area mx-auto w-[302px] bg-white px-4 py-5 font-mono text-[11px] leading-[15px] text-black shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="HeladiGi" className="mx-auto mb-2 w-[55%]" />
          <p className="text-center font-bold">HeladiGi Mart — Colombo 03</p>
          <p className="text-center text-[14px] font-bold">{kind}-REPORT #{kind === "Z" ? "0321" : "X-1187"}</p>
          <p className="text-center">21/11/2026 15:04 · Terminal 1</p>
          <S t="SHIFT" />
          <R a="Cashier" b="Kasun J." /><R a="Opened" b="21/11/2026 08:01" /><R a="Closed" b={kind === "Z" ? "21/11/2026 15:02" : "— open —"} />
          <S t="SALES" />
          <R a="Gross sales" b={rs(392_440, { prefix: false })} /><R a="Discounts" b={`-${rs(5_120, { prefix: false })}`} /><R a="Refunds" b={`-${rs(2_450, { prefix: false })}`} /><R a="Net sales" b={rs(384_870, { prefix: false })} bold />
          <R a="VAT 18% (incl.)" b={rs(58_709.49, { prefix: false })} /><R a="Transactions" b="214" /><R a="Items sold" b="1,126" /><R a="Avg basket" b={rs(1_798.46, { prefix: false })} />
          <S t="PAYMENTS" />
          <R a="Cash" b={rs(186_420, { prefix: false })} /><R a="Card" b={rs(128_300, { prefix: false })} /><R a="LankaQR" b={rs(74_150, { prefix: false })} /><R a="Credit" b={rs(0, { prefix: false })} /><R a="Gift card" b={rs(0, { prefix: false })} />
          <S t="CASH DRAWER" />
          <R a="Opening float" b={rs(15_000, { prefix: false })} /><R a="Cash in" b={rs(2_000, { prefix: false })} /><R a="Cash out" b={`-${rs(3_450, { prefix: false })}`} /><R a="Cash refunds" b={`-${rs(1_570, { prefix: false })}`} />
          <R a="Expected" b={rs(198_400, { prefix: false })} bold /><R a="Counted" b={rs(197_383, { prefix: false })} /><R a="Variance (SHORT)" b={`-${rs(1_017, { prefix: false })}`} bold />
          <S t="VOIDS & OVERRIDES" />
          <R a="Voided sales (1)" b={rs(1_840, { prefix: false })} /><R a="Price overrides" b="2" /><R a="Discounts > 10%" b="1 (Dilani F.)" />
          <div className="my-2 border-t border-dashed border-black" />
          <p className="mt-6">Cashier: ______________</p><p className="mt-4">Manager: ______________</p>
        </div>
      </div>
    </>
  );
}
