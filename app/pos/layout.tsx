import { SessionGate } from "@/lib/session";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <SessionGate>{children}</SessionGate>;
}
