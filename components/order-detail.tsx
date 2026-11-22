"use client";
import { useCallback, useEffect, useState } from "react";
import { Ban, Printer, User } from "lucide-react";
import { Status, Button, Avatar, Badge, Field, Textarea } from "@/components/ui";
import { Drawer, Modal } from "@/components/overlays";
import { OverrideModal, ReceiptModal } from "@/components/pos-modals";
import type { ReceiptData } from "@/components/pos-kit";
import { api, ApiFail, errText, METHOD, STATUS } from "@/lib/api";
import { ddmmyyyy, hhmm, rs } from "@/lib/format";
import { can, useSession } from "@/lib/session";
import { useApp } from "@/lib/store";

type Sale = {
  id: string; number: string; status: string; subtotal: number; discount: number; tax: number; total: number; paid: number; change: number; refunded: number; pointsEarned: number; soldAt: string; voidReason: string | null;
  branch: { id: string; name: string }; cashier: { name: string }; customer: { name: string; phone: string | null } | null;
  items: { id: string; name: string; variantLabel: string | null; quantity: number; unitPrice: number; total: number }[]; payments: { id: string; method: string; amount: number; reference: string | null }[];
};

export function OrderDetail({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const { toast } = useApp();
  const { me } = useSession();
  const [o, setO] = useState<Sale | null>(null);
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [approving, setApproving] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [voidErr, setVoidErr] = useState("");
  useEffect(() => {
    setO(null); setErr(""); setReceipt(false); setVoiding(false); setReason("");
    if (id) api<Sale>(`/sales/${id}`).then(setO).catch((e) => setErr(errText(e)));
  }, [id]);
  const doVoid = useCallback(async (approval?: { userId: string; pin: string }) => {
    if (!o) return false;
    setBusy(true); setVoidErr("");
    try {
      setO(await api<Sale>(`/sales/${o.id}/void`, { body: { reason: reason.trim(), approval } }));
      setVoiding(false); setApproving(false); onChanged();
      toast({ tone: "success", title: `${o.number} voided` });
      return true;
    } catch (e) {
      if (e instanceof ApiFail && e.status === 403) { if (approval) return false; setVoiding(false); setApproving(true); return false; }
      setApproving(false); setVoiding(true); setVoidErr(errText(e));
      return false;
    } finally { setBusy(false); }
  }, [o, reason, onChanged, toast]);
  if (!id) return null;
  const branch = me.branches.find((b) => b.id === o?.branch.id);
  const data: ReceiptData | null = o ? {
    invoice: o.number, date: ddmmyyyy(new Date(o.soldAt)), time: hhmm(new Date(o.soldAt)), cashier: o.cashier.name, customer: o.customer?.name, branch: o.branch.name, address: branch?.address, phone: branch?.phone,
    lines: o.items.map((i) => ({ name: i.name + (i.variantLabel ? ` (${i.variantLabel})` : ""), qty: i.quantity, price: i.unitPrice })),
    discount: o.discount, subtotal: o.subtotal, total: o.total, tax: o.tax, change: o.change, tendered: o.paid, points: o.pointsEarned,
    method: o.payments.filter((p) => p.amount > 0).map((p) => METHOD[p.method] ?? p.method).join(" + "),
  } : null;
  const canVoid = !!o && (o.status === "COMPLETED" || o.status === "ON_CREDIT") && !o.refunded && can(me, "sales.make");
  return (
    <>
      <Drawer open onClose={onClose} width="max-w-xl" title={o ? <span className="flex items-center gap-3">{o.number}<Status s={STATUS[o.status]} /></span> : "Order"} sub={o ? `${o.branch.name} · Cashier ${o.cashier.name} · ${ddmmyyyy(new Date(o.soldAt))} ${hhmm(new Date(o.soldAt))}` : undefined}
        footer={o ? <>
          <Button icon={Printer} onClick={() => setReceipt(true)}>Receipt</Button>
          {canVoid && <Button icon={Ban} variant="danger-outline" className="ml-auto" onClick={() => { setVoidErr(""); setVoiding(true); }}>Void</Button>}
        </> : undefined}>
        {err && <p role="alert" className="rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
        {!o && !err && <p className="py-10 text-center text-sm text-fg2" role="status">Loading…</p>}
        {o && <>
          {o.voidReason && <p className="mb-5 rounded-card bg-danger/10 p-3 text-sm text-danger"><b>Voided:</b> {o.voidReason}</p>}
          <div className="mb-5 flex items-center gap-3 rounded-card border border-line p-4">
            {o.customer ? <Avatar name={o.customer.name} size={44} color="#1A3170" /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2"><User size={20} /></span>}
            <div className="flex-1"><p className="font-semibold">{o.customer?.name ?? "Walk-in Customer"}</p><p className="text-cap text-fg2">{o.customer?.phone ?? "No customer linked"}</p></div>
            {o.pointsEarned > 0 && <Badge tone="orange">+{o.pointsEarned} pts</Badge>}
          </div>
          <h3 className="h-section mb-2">Items</h3>
          <ul className="divide-y divide-line rounded-card border border-line">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-4 py-3 text-sm"><span><span className="font-semibold">{i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""}</span><span className="block text-cap text-fg2 tnum">{i.quantity} × {rs(i.unitPrice)}</span></span><span className="font-semibold tnum">{rs(i.total)}</span></li>
            ))}
          </ul>
          <h3 className="h-section mb-2 mt-6">Payment</h3>
          <dl className="space-y-2 rounded-card bg-surface-2 p-4 text-sm">
            {[["Subtotal", rs(o.subtotal)], ["Discount", rs(o.discount)], ["VAT (incl.)", rs(o.tax)]].map(([a, b]) => <div key={a} className="flex justify-between"><dt className="text-fg2">{a}</dt><dd className="tnum">{b}</dd></div>)}
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd className="tnum">{rs(o.total)}</dd></div>
            {o.payments.map((p) => <div key={p.id} className="flex justify-between"><dt className="text-fg2">{METHOD[p.method] ?? p.method}{p.amount < 0 ? " (reversed)" : ""}{p.reference ? ` · ${p.reference}` : ""}</dt><dd className="tnum">{rs(p.amount)}</dd></div>)}
            {o.change > 0 && <div className="flex justify-between"><dt className="text-fg2">Change given</dt><dd className="tnum">{rs(o.change)}</dd></div>}
          </dl>
        </>}
      </Drawer>
      <ReceiptModal open={receipt} onClose={() => setReceipt(false)} data={data} />
      <Modal open={voiding} onClose={() => setVoiding(false)} title={`Void ${o?.number ?? ""}`} sub="Stock, payments and points are reversed. This can't be undone." size="s"
        footer={<><Button size="l" onClick={() => setVoiding(false)}>Cancel</Button><Button size="l" variant="danger-outline" loading={busy} disabled={reason.trim().length < 3} onClick={() => void doVoid()}>Void sale</Button></>}>
        {voidErr && <p role="alert" className="mb-3 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{voidErr}</p>}
        <Field label="Reason" required><Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[88px]" /></Field>
      </Modal>
      <OverrideModal open={approving} onClose={() => { setApproving(false); setVoiding(true); }} onSubmit={doVoid} action="Void this sale" perm="sales.void" />
    </>
  );
}
