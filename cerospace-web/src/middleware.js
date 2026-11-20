import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    ["/", "/login", "/register"].includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith("/products");
  const isAuthRoute = ["/login", "/register"].includes(nextUrl.pathname);

  if (isApiAuthRoute) return null;

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn) {
    const role = user.role;
    const sellerStatus = user.seller_status;

    // Admin Protection
    if (nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    // Seller Protection
    if (nextUrl.pathname.startsWith("/seller")) {
      if (role !== "seller") {
        return NextResponse.redirect(new URL("/", nextUrl));
      }

      // Allow access to /seller/pending even if not approved
      if (nextUrl.pathname === "/seller/pending") {
        return null;
      }

      if (sellerStatus !== "approved") {
        return NextResponse.redirect(new URL("/seller/pending", nextUrl));
      }
    }

    // Buyer Protection
    const isBuyerRoute =
      nextUrl.pathname.startsWith("/buyer") || nextUrl.pathname === "/cart";
    if (isBuyerRoute && role !== "buyer") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return null;
});

export const config = {
  matcher: [
    "/((?!api/register|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};