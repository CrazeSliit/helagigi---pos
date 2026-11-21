"use client";
import { useState } from "react";
import { CheckCheck, Settings } from "lucide-react";
import Link from "next/link";
import { Button, Card, PageHeader, Tabs } from "@/components/ui";
import { NotificationList } from "@/components/shell";
import { FilterBar } from "@/components/table";

export default function Notifications() {
  const [tab, setTab] = useState("All");
  return (
    <>
      <PageHeader title="Notifications" actions={<><Link href="/settings?tab=notifications" className="btn btn-m btn-outline"><Settings size={18} />Preferences</Link><Button icon={CheckCheck}>Mark all as read</Button></>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ v: "All", label: "All", count: 6 }, { v: "Stock Alerts", label: "Stock alerts", count: 2 }, { v: "Sales", label: "Sales", count: 2 }, { v: "System", label: "System", count: 2 }]} />
      <FilterBar placeholder="Search notifications…" exportable={false} filters={[{ label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }, { label: "Any time", options: ["Today", "This week", "This month"] }]} />
      <Card pad={false}><NotificationList filter={tab} /></Card>
    </>
  );
}
