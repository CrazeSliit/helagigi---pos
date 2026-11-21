"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import { Avatar, Button, Card, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DenominationCounter, DENOMS } from "@/components/pos-kit";
import { rs } from "@/lib/format";

export default function OpenShift() {
  const router = useRouter();
  const [v, setV] = useState<Record<number, number>>({ 1000: 8, 500: 6, 100: 20, 50: 20, 20: 25, 10: 30, 5: 20, 2: 25, 1: 50 });
  const total = DENOMS.reduce((s, d) => s + d * (v[d] || 0), 0);
  return (
    <>
      <PageHeader title="Open shift" sub="Count the opening float in the drawer" />
      <SubNav module="register" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DenominationCounter value={v} onChange={setV} />
        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card>
            <div className="flex items-center gap-3"><Avatar name="Kasun Jayasuriya" color="#FF7A00" size={44} /><div><p className="font-semibold">Kasun Jayasuriya</p><p className="text-cap text-fg2">Colombo 03 · Terminal 1 · 21/11/2026</p></div></div>
            <div className="mt-5 rounded-card bg-tint p-4"><p className="text-sm text-fg2">Opening float</p><p className="font-heading text-[32px] font-bold tnum">{rs(total)}</p><p className="text-cap text-fg2">Suggested float: Rs. 15,000.00</p></div>
            <Button variant="primary" size="pos" className="mt-4 w-full" icon={Play} onClick={() => router.push("/pos")}>Start shift</Button>
          </Card>
        </div>
      </div>
    </>
  );
}
