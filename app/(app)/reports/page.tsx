import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { ReportIcon } from "@/components/report-viewer";
import { REPORTS } from "@/lib/reports";

export default function ReportsHub() {
  const groups = ["Sales", "Inventory", "Customers", "Staff", "Finance & Tax"] as const;
  return (
    <>
      <PageHeader title="Reports" sub="17 reports · export to PDF, Excel or CSV, or schedule by email" />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="h-section mb-3">{g}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {REPORTS.filter((r) => r.group === g).map((r) => (
                <Link key={r.slug} href={`/reports/${r.slug}`} className="card group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-lift">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-tint text-fg transition group-hover:bg-orange-500 group-hover:text-navy-900"><ReportIcon name={r.icon} /></span>
                  <span className="flex-1"><span className="block font-semibold">{r.title}</span><span className="text-sm text-fg2">{r.desc}</span></span>
                  <ArrowRight size={18} className="mt-1 text-fg2 opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
