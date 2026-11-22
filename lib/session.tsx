"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiFail, errText } from "./api";
import { canOpen, homeFor } from "./features";

export type Me = {
  id: string; name: string; email: string | null; color: string; role: string; permissions: string[]; allBranches: boolean; branchId: string | null; terminalId: string | null; locked: boolean;
  branches: { id: string; name: string; code: string; address: string | null; phone: string | null }[];
};
const Ctx = createContext<{ me: Me; reload: () => Promise<void> } | null>(null);
export const useSession = () => { const c = useContext(Ctx); if (!c) throw new Error("useSession outside SessionGate"); return c; };
export const can = (me: Me, p: string) => me.permissions.includes(p);
export const branchOf = (me: Me) => me.branches.find((b) => b.id === me.branchId);

export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try { setError(""); setMe(await api<Me>("/auth/me", { noRedirect: true })); }
    catch (e) {
      if (e instanceof ApiFail && e.status === 401) window.location.assign("/login");
      else setError(errText(e));
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const blockedTo = !me ? null : me.locked ? "/lock" : !me.branchId ? "/branch-select" : !canOpen(path, me.permissions) ? homeFor(me.permissions) : null;
  useEffect(() => { if (blockedTo) router.replace(blockedTo); }, [blockedTo, router]);
  if (error) return <div className="grid min-h-screen place-items-center bg-bg p-6 text-center"><div><p className="font-semibold">{error}</p><button onClick={() => void reload()} className="btn btn-m btn-primary mt-4">Try again</button></div></div>;
  if (!me || blockedTo) return <div className="grid min-h-screen place-items-center bg-bg text-sm text-fg2" role="status">Loading…</div>;
  return <Ctx.Provider value={{ me, reload }}>{children}</Ctx.Provider>;
}
