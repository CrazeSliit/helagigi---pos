export type ReportDef = { slug: string; title: string; group: "Sales" | "Inventory" | "Customers" | "Staff" | "Finance & Tax"; desc: string; icon: string; chart: "trend" | "bars" | "hbars" | "donut" | "heatmap" | "stacked" | "aging" };

export const REPORTS: ReportDef[] = [
  { slug: "sales-summary", title: "Sales summary", group: "Sales", desc: "Daily, weekly and monthly sales with period comparison", icon: "TrendingUp", chart: "trend" },
  { slug: "sales-by-product", title: "Sales by product / category / brand", group: "Sales", desc: "What sells, how much and at what margin", icon: "Package", chart: "hbars" },
  { slug: "sales-by-hour", title: "Sales by hour", group: "Sales", desc: "Heatmap of busy hours by day of week", icon: "Clock", chart: "heatmap" },
  { slug: "sales-by-branch", title: "Sales by branch", group: "Sales", desc: "Compare Colombo 03, Kandy and Kurunegala", icon: "Building2", chart: "bars" },
  { slug: "payment-methods", title: "Payment methods", group: "Sales", desc: "Cash, card, LankaQR, credit and gift card split", icon: "CreditCard", chart: "donut" },
  { slug: "discounts", title: "Discount & promotion performance", group: "Sales", desc: "Uplift and cost of every promotion", icon: "BadgePercent", chart: "bars" },
  { slug: "returns", title: "Returns & refunds", group: "Sales", desc: "Refunds by reason, product and cashier", icon: "Undo2", chart: "hbars" },
  { slug: "inventory-valuation", title: "Inventory valuation", group: "Inventory", desc: "Stock value at cost and retail, per branch", icon: "Boxes", chart: "bars" },
  { slug: "stock-movement", title: "Stock movement", group: "Inventory", desc: "Opening, in, out and closing stock", icon: "ArrowLeftRight", chart: "stacked" },
  { slug: "dead-stock", title: "Dead stock / slow movers", group: "Inventory", desc: "Items with no sales in 30, 60 or 90 days", icon: "PackageX", chart: "hbars" },
  { slug: "supplier-purchases", title: "Supplier purchases", group: "Inventory", desc: "Spend and fill rate by supplier", icon: "Truck", chart: "hbars" },
  { slug: "customers", title: "Customer report", group: "Customers", desc: "Top customers, new vs returning", icon: "Users", chart: "stacked" },
  { slug: "receivables", title: "Credit / receivables aging", group: "Customers", desc: "Outstanding customer balances by age", icon: "HandCoins", chart: "aging" },
  { slug: "sales-by-staff", title: "Sales by cashier / staff", group: "Staff", desc: "Sales, transactions and average basket per person", icon: "UserCog", chart: "hbars" },
  { slug: "shift-variance", title: "Shift & cash variance", group: "Staff", desc: "Short and over amounts per shift", icon: "Wallet", chart: "bars" },
  { slug: "profit-loss", title: "Profit & loss", group: "Finance & Tax", desc: "Revenue, COGS, gross profit, expenses, net profit", icon: "Calculator", chart: "stacked" },
  { slug: "tax", title: "Tax report (VAT)", group: "Finance & Tax", desc: "VAT collected and SSCL — ready for IRD filing", icon: "Landmark", chart: "bars" },
];
