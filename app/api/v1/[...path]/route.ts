import { db } from "@/lib/server/db";
import { createHandler, publicRoute, type Route } from "@/lib/server/http";
import { adminRoutes } from "@/lib/server/modules/admin";
import { authRoutes } from "@/lib/server/modules/auth";
import { catalogRoutes } from "@/lib/server/modules/catalog";
import { customerRoutes } from "@/lib/server/modules/customers";
import { inventoryRoutes } from "@/lib/server/modules/inventory";
import { purchasingRoutes } from "@/lib/server/modules/purchasing";
import { registerRoutes } from "@/lib/server/modules/register";
import { reportRoutes } from "@/lib/server/modules/reports";
import { salesRoutes } from "@/lib/server/modules/sales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const routes: Route[] = [
  publicRoute("GET", "/health", async () => { await db.$queryRaw`SELECT 1`; return { status: "ok" }; }),
  ...authRoutes, ...salesRoutes, ...registerRoutes, ...catalogRoutes, ...inventoryRoutes,
  ...purchasingRoutes, ...customerRoutes, ...reportRoutes, ...adminRoutes,
];

const handler = createHandler(routes);
export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
