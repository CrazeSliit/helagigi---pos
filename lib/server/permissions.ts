// Mirrors the matrix on /staff/roles.
export const PERMISSIONS = {
  "sales.make": "Make sales",
  "sales.discount": "Give discounts up to 10%",
  "sales.discount_any": "Give discounts above 10%",
  "sales.override_price": "Override prices",
  "sales.void": "Void sales",
  "sales.refund": "Process refunds",
  "sales.credit": "Sell on credit",
  "products.view_cost": "View cost price",
  "products.edit": "Edit products",
  "stock.adjust": "Adjust stock",
  "stock.receive": "Receive goods (GRN)",
  "stock.transfer": "Transfer stock",
  "shift.manage": "Open / close shift",
  "shift.cash": "Cash in / out",
  "shift.approve": "Approve variances",
  "expenses.record": "Record expenses",
  "suppliers.pay": "Pay suppliers",
  "reports.view": "View reports",
  "data.export": "Export data",
  "staff.manage": "Manage staff",
  "settings.manage": "Change settings",
  "audit.view": "View audit log",
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const DEFAULT_ROLES: Record<string, Permission[]> = {
  Owner: ALL_PERMISSIONS,
  Manager: ["sales.make", "sales.discount", "sales.discount_any", "sales.override_price", "sales.void", "sales.refund", "sales.credit", "products.view_cost", "products.edit", "stock.adjust", "stock.receive", "stock.transfer", "shift.manage", "shift.cash", "shift.approve", "expenses.record", "reports.view", "data.export", "audit.view"],
  Cashier: ["sales.make", "sales.discount", "sales.credit", "shift.manage", "shift.cash"],
  "Stock Keeper": ["products.view_cost", "products.edit", "stock.adjust", "stock.receive", "stock.transfer"],
  Accountant: ["products.view_cost", "expenses.record", "suppliers.pay", "reports.view", "data.export", "audit.view"],
};
