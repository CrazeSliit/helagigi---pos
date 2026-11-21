"use client";
import { Printer } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";

export default function KOT() {
  const items = [["2", "Chicken Kottu", "Extra spicy · no egg"], ["1", "Vegetable Fried Rice", ""], ["3", "Plain Hoppers", ""], ["2", "Egg Hoppers", "1 runny yolk"], ["1", "Pol Sambol (side)", ""], ["4", "Ginger Beer (EGB)", "Chilled"]];
  return (
    <>
      <PageHeader title="Kitchen order ticket" sub="Preview of what prints in the kitchen" actions={<Button variant="secondary" icon={Printer}>Print KOT</Button>} />
      <SubNav module="restaurant" />
      <div className="rounded-card bg-surface-2 py-8">
        <div className="mx-auto w-[302px] bg-white px-4 py-5 font-mono text-[12px] leading-[17px] text-black shadow-lift">
          <p className="text-center text-[16px] font-bold">KOT #0418</p>
          <p className="text-center">HeladiGi Café · Kandy</p>
          <div className="my-2 border-t-2 border-black" />
          <div className="flex justify-between text-[18px] font-bold"><span>TABLE T5</span><span>DINE-IN</span></div>
          <p>Guests: 5 · Server: Tharushi S.</p><p>21/11/2026 15:06</p>
          <div className="my-2 border-t-2 border-black" />
          {items.map(([q, n, m]) => (
            <div key={n} className="mb-1.5"><p className="text-[14px] font-bold">{q} × {n}</p>{m && <p className="ml-6 font-bold">** {m}</p>}</div>
          ))}
          <div className="my-2 border-t border-dashed border-black" />
          <p className="font-bold">NOTE: Birthday — bring watalappan with candle after mains</p>
          <div className="my-2 border-t-2 border-black" />
          <p className="text-center">— KITCHEN COPY —</p>
        </div>
      </div>
    </>
  );
}
