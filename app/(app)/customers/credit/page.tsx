"use client";
import { PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { CreditAging } from "@/components/credit-aging";

export default function Credit() {
  return (
    <>
      <PageHeader title="Credit & outstanding" sub="Customers with unpaid balances, by age" />
      <SubNav module="customers" />
      <CreditAging />
    </>
  );
}
