import { notFound } from "next/navigation";
import { REPORTS } from "@/lib/reports";
import { ReportViewer } from "@/components/report-viewer";

export function generateStaticParams() {
  return REPORTS.map((r) => ({ slug: r.slug }));
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!REPORTS.find((r) => r.slug === slug)) notFound();
  return <ReportViewer slug={slug} />;
}
