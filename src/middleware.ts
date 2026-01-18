import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/request-demo",
  "/sign-in(.*)",
  "/auth-error",
  "/widget/(.*)",
  "/api/health",
  "/api/public/(.*)",
]);

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const isAdminApiRoute = createRouteMatcher(["/api/admin(.*)"]);

function hasClerkKeys(): boolean {
  return !!(
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }
  await auth.protect();
});

export default async function middleware(req: NextRequest) {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!hasClerkKeys()) {
    if (isAppRoute(req)) {
      return NextResponse.redirect(new URL("/auth-error", req.url));
    }

    if (isAdminApiRoute(req)) {
      return NextResponse.json(
        { ok: false, error: "server_misconfigured" },
        { status: 503 }
      );
    }

    return NextResponse.next();
  }

  return clerkHandler(req, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
