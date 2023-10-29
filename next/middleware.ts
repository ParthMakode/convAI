import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // if user is signed in and the current path is /login redirect the user to /
  if (user && req.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // if user is not signed in and the current path is /account redirect the user to /login
  if (!user && (req.nextUrl.pathname === '/account' || req.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/account', '/login'],
}