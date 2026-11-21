"use client";
import { Ban, Mail, Printer, Undo2, User } from "lucide-react";
import { Status, Button, Avatar, Badge } from "@/components/ui";
import { Drawer, Tooltip } from "@/components/overlays";
import { products, type Order } from "@/lib/data";
import { rs, cn } from "@/lib/format";
import { useApp } from "@/lib/store";

export function OrderDetail({ o, onClose }: { o: Order | null; onClose: () => void }) {
  const { toast } = useApp();
  if (!o) return null;
  const items = products.slice(0, Math.min(5, Math.max(2, o.items % 6))).map((p, i) => ({ p, qty: 1 + (i % 3) }));
  const steps = [
    { l: "Created", t: `${o.date} ${o.time}`, done: true },
    { l: "Paid", t: `${o.method} · ${o.time}`, done: o.status !== "Voided" && o.status !== "On Credit" },
    ...(o.status.includes("Refunded") ? [{ l: o.status, t: "21/11/2026 15:12 · by Dilani F.", done: true, bad: true }] : []),
    ...(o.status === "Voided" ? [{ l: "Voided", t: "Manager approved · Dilani F.", done: true, bad: true }] : []),
  ];
  return (
    <Drawer open onClose={onClose} width="max-w-xl" title={<span className="flex items-center gap-3">{o.id}<Status s={o.status} /></span>} sub={`${o.branch} · Cashier ${o.cashier}`}
      footer={<>
        <Button icon={Printer} onClick={() => toast({ tone: "success", title: "Reprinting receipt" })}>Reprint</Button>
        <Button icon={Mail}>Email receipt</Button>
        <Button icon={Undo2} variant="secondary" className="ml-auto">Refund</Button>
        <Tooltip label="Manager approval required"><Button icon={Ban} variant="danger-outline" locked>Void</Button></Tooltip>
      </>}>
      <ol className="relative mb-6 flex justify-between">
        <span className="absolute left-4 right-4 top-4 h-0.5 bg-line" />
        {steps.map((s, i) => (
          <li key={i} className="relative flex flex-col items-center text-center">
            <span className={cn("grid h-8 w-8 place-items-center rounded-full text-cap font-bold ring-4 ring-surface", "bad" in s && s.bad ? "bg-danger text-white" : s.done ? "bg-success text-white" : "bg-surface-2 text-fg2")}>{i + 1}</span>
            <span className="mt-2 text-sm font-semibold">{s.l}</span><span className="text-[11px] text-fg2">{s.t}</span>
          </li>
        ))}
      </ol>
      <div className="mb-5 flex items-center gap-3 rounded-card border border-line p-4">
        {o.customer === "Walk-in Customer" ? <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2"><User size={20} /></span> : <Avatar name={o.customer} size={44} color="#1A3170" />}
        <div className="flex-1"><p className="font-semibold">{o.customer}</p><p className="text-cap text-fg2">{o.customer === "Walk-in Customer" ? "No customer linked" : "+94 77 214 5566 · Gold · 2,846 pts"}</p></div>
        {o.customer !== "Walk-in Customer" && <Badge tone="orange">+{Math.floor(o.total / 100)} pts</Badge>}
      </div>
      <h3 className="h-section mb-2">Items</h3>
      <ul className="divide-y divide-line rounded-card border border-line">
        {items.map(({ p, qty }) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm"><span><span className="font-semibold">{p.name}</span><span className="block text-cap text-fg2 tnum">{qty} × {rs(p.price)}</span></span><span className="font-semibold tnum">{rs(qty * p.price)}</span></li>
        ))}
      </ul>
      <h3 className="h-section mb-2 mt-6">Payment</h3>
      <dl className="space-y-2 rounded-card bg-surface-2 p-4 text-sm">
        {[["Subtotal", rs(o.total)], ["Discount", rs(0)], ["VAT 18% (incl.)", rs(o.total - o.total / 1.18)]].map(([a, b]) => <div key={a} className="flex justify-between"><dt className="text-fg2">{a}</dt><dd className="tnum">{b}</dd></div>)}
        <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd className="tnum">{rs(o.total)}</dd></div>
        <div className="flex justify-between"><dt className="text-fg2">{o.method}</dt><dd className="tnum">{rs(o.method === "Cash" ? Math.ceil(o.total / 1000) * 1000 : o.total)}</dd></div>
        {o.method === "Cash" && <div className="flex justify-between"><dt className="text-fg2">Change</dt><dd className="tnum">{rs(Math.ceil(o.total / 1000) * 1000 - o.total)}</dd></div>}
      </dl>
    </Drawer>
  );
}

