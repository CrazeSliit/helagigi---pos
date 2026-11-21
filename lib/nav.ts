import {
  BarChart3, Building2, ClipboardList, HandCoins, LayoutDashboard, Megaphone, Package, Boxes, Receipt, ScanBarcode,
  ScrollText, Settings, ShoppingCart, Truck, Undo2, UserCog, Users, UtensilsCrossed, Wallet, type LucideIcon,
} from "lucide-react";

export type NavItem = { key: string; href: string; icon: LucideIcon; badge?: number };
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: "g.sell", items: [
    { key: "n.pos", href: "/pos", icon: ScanBarcode },
    { key: "n.orders", href: "/orders", icon: ShoppingCart },
    { key: "n.returns", href: "/returns", icon: Undo2 },
    { key: "n.tables", href: "/restaurant", icon: UtensilsCrossed },
  ] },
  { group: "g.manage", items: [
    { key: "n.products", href: "/products", icon: Package },
    { key: "n.inventory", href: "/inventory", icon: Boxes, badge: 9 },
    { key: "n.purchasing", href: "/purchasing", icon: Truck },
    { key: "n.customers", href: "/customers", icon: Users },
    { key: "n.promotions", href: "/promotions", icon: Megaphone },
  ] },
  { group: "g.money", items: [
    { key: "n.register", href: "/register", icon: Wallet },
    { key: "n.expenses", href: "/expenses", icon: Receipt },
    { key: "n.payments", href: "/payments", icon: HandCoins },
  ] },
  { group: "g.insights", items: [
    { key: "n.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "n.reports", href: "/reports", icon: BarChart3 },
  ] },
  { group: "g.admin", items: [
    { key: "n.staff", href: "/staff", icon: UserCog },
    { key: "n.branches", href: "/branches", icon: Building2 },
    { key: "n.settings", href: "/settings", icon: Settings },
    { key: "n.audit", href: "/audit", icon: ScrollText },
  ] },
];

/** In-module sub navigation (rendered as tabs under the page header). */
export const SUBNAV: Record<string, { label: string; href: string }[]> = {
  returns: [{ label: "Returns", href: "/returns" }, { label: "New return", href: "/returns/new" }, { label: "Exchange", href: "/returns/exchange" }],
  products: [
    { label: "All products", href: "/products" }, { label: "Add product", href: "/products/new" }, { label: "Categories", href: "/products/categories" },
    { label: "Brands", href: "/products/brands" }, { label: "Units", href: "/products/units" }, { label: "Barcode labels", href: "/products/labels" }, { label: "Bulk import", href: "/products/import" },
  ],
  inventory: [
    { label: "Stock overview", href: "/inventory" }, { label: "Adjustments", href: "/inventory/adjust" }, { label: "Transfers", href: "/inventory/transfers" },
    { label: "Stock take", href: "/inventory/stock-take" }, { label: "Batches & expiry", href: "/inventory/batches" }, { label: "Movement history", href: "/inventory/movements" },
  ],
  purchasing: [
    { label: "Suppliers", href: "/purchasing" }, { label: "Purchase orders", href: "/purchasing/orders" }, { label: "New PO", href: "/purchasing/orders/new" },
    { label: "Receive (GRN)", href: "/purchasing/grn" }, { label: "Supplier payments", href: "/purchasing/payments" }, { label: "Purchase returns", href: "/purchasing/returns" },
  ],
  customers: [
    { label: "Customers", href: "/customers" }, { label: "Add customer", href: "/customers/new" }, { label: "Groups", href: "/customers/groups" }, { label: "Credit & outstanding", href: "/customers/credit" },
  ],
  promotions: [
    { label: "Promotions", href: "/promotions" }, { label: "Create promotion", href: "/promotions/new" }, { label: "Coupons", href: "/promotions/coupons" },
    { label: "Loyalty", href: "/promotions/loyalty" }, { label: "Gift cards", href: "/promotions/gift-cards" },
  ],
  register: [
    { label: "Current shift", href: "/register" }, { label: "Open shift", href: "/register/open" }, { label: "Close shift", href: "/register/close" },
    { label: "Z / X report", href: "/register/z-report" }, { label: "Shift history", href: "/register/history" },
  ],
  expenses: [{ label: "Expenses", href: "/expenses" }, { label: "Add expense", href: "/expenses/new" }, { label: "Categories", href: "/expenses/categories" }, { label: "Summary", href: "/expenses/summary" }],
  staff: [
    { label: "Staff", href: "/staff" }, { label: "Add staff", href: "/staff/new" }, { label: "Roles & permissions", href: "/staff/roles" },
    { label: "Attendance", href: "/staff/attendance" }, { label: "Commissions", href: "/staff/commissions" }, { label: "Performance", href: "/staff/performance" },
  ],
  branches: [{ label: "Branches", href: "/branches" }, { label: "Add branch", href: "/branches/new" }, { label: "Terminals", href: "/branches/terminals" }],
  restaurant: [{ label: "Floor plan", href: "/restaurant" }, { label: "Kitchen display", href: "/kds" }, { label: "KOT preview", href: "/restaurant/kot" }],
};
