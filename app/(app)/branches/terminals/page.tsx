"use client";
import { useState } from "react";
import { Plus, Printer, RefreshCw, Wallet, Monitor } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button, PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable } from "@/components/table";
import { Modal } from "@/components/overlays";

const rows = [
  ["Colombo 03", "T1 · Main counter", "Online", "Just now", "Epson TM-T82", "Drawer CD-410"], ["Colombo 03", "T2 · Express lane", "Online", "1 min ago", "Epson TM-T82", "Drawer CD-410"],
  ["Colombo 03", "T3 · Counter 3", "Online", "2 min ago", "Xprinter XP-80", "Drawer CD-410"], ["Colombo 03", "T4 · Pharmacy", "Offline", "42 min ago", "Xprinter XP-80", "—"],
  ["Kandy", "T1 · Main counter", "Online", "Just now", "Epson TM-T82", "Drawer CD-410"], ["Kandy", "T2 · Counter 2", "Online", "3 min ago", "Epson TM-T82", "Drawer CD-410"],
  ["Kandy", "T3 · Tablet (iPad)", "Online", "Just now", "Bluetooth Star SM-L200", "—"], ["Kurunegala", "T1 · Main counter", "Syncing", "Syncing 12 sales", "Xprinter XP-80", "Drawer CD-410"],
  ["Kurunegala", "T2 · Counter 2", "Online", "5 min ago", "Xprinter XP-80", "Drawer CD-410"],
].map((r, i) => ({ id: i, br: r[0], name: r[1], s: r[2], sync: r[3], prn: r[4], drw: r[5] }));

export default function Terminals() {
  const [pair, setPair] = useState(false);
  return (
    <>
      <PageHeader title="Terminals" sub="Registers and devices per branch" actions={<Button variant="primary" icon={Plus} onClick={() => setPair(true)}>Pair new terminal</Button>} />
      <SubNav module="branches" />
      <DataTable rows={rows} rowActions={[{ label: "Force sync", icon: RefreshCw }, { label: "Test printer", icon: Printer }, { label: "Open drawer", icon: Wallet }]} cols={[
        { key: "name", label: "Terminal", render: (r) => <span className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-ctl bg-tint"><Monitor size={17} /></span><span className="font-semibold">{r.name}</span></span> },
        { key: "br", label: "Branch", render: (r) => <span className="text-fg2">{r.br}</span> },
        { key: "s", label: "Status", render: (r) => <Status s={r.s} /> },
        { key: "sync", label: "Last sync", render: (r) => <span className="text-fg2">{r.sync}</span> },
        { key: "prn", label: "Printer" },
        { key: "drw", label: "Cash drawer", render: (r) => <span className="text-fg2">{r.drw}</span> },
      ]} />
      <Modal open={pair} onClose={() => setPair(false)} title="Pair a new terminal" size="m">
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <div className="rounded-card border border-line bg-white p-4"><QRCodeSVG value="heladigi://pair?b=C03&code=7Q4-K2M" size={180} /></div>
          <ol className="space-y-3 text-sm">
            {["Install HeladiGi POS on the new tablet or PC", "Tap “Pair with QR” on the welcome screen", "Scan this code — the terminal joins Colombo 03"].map((s, i) => <li key={s} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500 text-cap font-bold text-navy-900">{i + 1}</span>{s}</li>)}
            <li className="rounded-ctl bg-surface-2 p-3 text-cap">Or enter code <b className="font-mono text-sm text-fg">7Q4-K2M</b> · expires in 9:41</li>
          </ol>
        </div>
      </Modal>
    </>
  );
}
