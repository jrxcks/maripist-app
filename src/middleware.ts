// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Remove old NextAuth imports
// import { withAuth } from "next-auth/middleware";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next(); // Base response, allows setting cookies

  // Create a Supabase client tailored for middleware
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - important to keep session alive
  await supabase.auth.getSession();

  // Get current session data
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // --- Redirect Logic ---

  // 1. If user is NOT logged in and tries to access protected routes
  const isProtectedRoute = pathname.startsWith('/onboarding') || pathname.startsWith('/chat') || pathname.startsWith('/profile');
  if (!session && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    return NextResponse.redirect(redirectUrl);
  }

  // 2. If user IS logged in and tries to access non-protected pages like root, login, signup
  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup');
  if (session && (pathname === '/' || isAuthRoute)) {
     // Redirect logged-in users from root or auth pages to the dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // --- Allow Access ---
  // If none of the redirect conditions match, allow the request to proceed
  return res;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - Supabase auth uses its own endpoints)
     *
     * We need the middleware to run on:
     * - / (Root page)
     * - /auth/login (Auth pages)
     * - /auth/signup (Auth pages)
     * - /dashboard (Protected app route)
     * - /chat/* (Protected route)
     * - /onboarding/* (Protected route)
     * - /profile/* (Protected route)
     * - potentially other app routes like /settings, /calendar etc.
     */
    '/',
    '/auth/login',
    '/auth/signup',
    '/dashboard/:path*', // Match dashboard and potential sub-routes
    '/therapists/:path*', // Add therapists route pattern
    '/chat/:path*',
    '/onboarding/:path*',
    '/profile/:path*',
    // Add other protected top-level routes or group patterns here if needed
    // e.g., '/settings', '/calendar', etc.
    '/settings/:path*', // Example: Add settings if it exists
    '/calendar/:path*', // Example: Add calendar if it exists
    '/goals/:path*', // Example: Add goals if it exists
    '/education/:path*', // Example: Add education if it exists
    '/specialists/:path*', // Example: Add specialists if it exists
    '/support/:path*', // Example: Add support if it exists
  ],
};

// Remove old NextAuth middleware export
/*
export default withAuth(
  ...
);
*/ 