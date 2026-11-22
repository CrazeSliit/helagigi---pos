import { NextResponse, type NextRequest } from "next/server";
import { isEnabled, PUBLIC_ROUTES, SESSION_ROUTES } from "./lib/features";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/\/$/, "") || "/";
  if (PUBLIC_ROUTES.includes(path)) return NextResponse.next();
  const known = SESSION_ROUTES.includes(path) || isEnabled(path);
  const signedIn = req.cookies.has("hd_session");
  if (known && signedIn) return NextResponse.next();
  const to = req.nextUrl.clone();
  to.pathname = signedIn ? "/pos" : "/login";
  to.search = "";
  return NextResponse.redirect(to);
}

export const config = { matcher: ["/((?!api|_next|brand|.*\\..*).*)"] };
