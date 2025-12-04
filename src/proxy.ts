import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy do Next.js 16
 * 
 * Responsável por:
 * - Detecção de tenant por subdomínio
 * - Proteção de rotas autenticadas
 * - Redirecionamentos de rotas antigas
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/admin/login',
  '/landing',
  '/',
]

// Rotas que começam com esses prefixos são públicas
const PUBLIC_PREFIXES = [
  '/api/auth', // Better-Auth API
]

// Rotas de admin (requerem role admin)
const ADMIN_ROUTES = [
  '/admin',
]

/**
 * Extrai o tenant do hostname
 * 
 * Exemplos:
 * - cliente.decode.app -> "cliente"
 * - cliente.localhost:3000 -> "cliente"
 * - localhost:3000 -> null (sem tenant)
 * - decode.app -> null (domínio principal)
 */
function getTenantFromHost(host: string): string | null {
  // Remove porta se existir
  const hostname = host.split(':')[0]
  
  // Lista de domínios principais (sem tenant)
  const mainDomains = ['localhost', 'decode.app', 'decode.ink']
  
  // Se for um domínio principal direto, não há tenant
  if (mainDomains.includes(hostname)) {
    return null
  }
  
  // Extrai subdomínio
  const parts = hostname.split('.')
  
  // Precisa ter pelo menos 2 partes (subdomain.domain)
  if (parts.length < 2) {
    return null
  }
  
  // O primeiro segmento é o tenant
  const tenant = parts[0]
  
  // Ignora subdomínios reservados
  const reservedSubdomains = ['www', 'api', 'admin', 'app']
  if (reservedSubdomains.includes(tenant)) {
    return null
  }
  
  return tenant
}

/**
 * Verifica se a rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  // Verifica rotas exatas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }
  
  // Verifica prefixos
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

/**
 * Verifica se o usuário está autenticado
 * Baseado no cookie de sessão do Better-Auth
 */
function isAuthenticated(request: NextRequest): boolean {
  // Better-Auth usa o cookie "better-auth.session_token"
  const sessionCookie = request.cookies.get('better-auth.session_token')
  return !!sessionCookie?.value
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || 'localhost:3000'
  
  // ===== REDIRECIONAMENTOS DE ROTAS ANTIGAS =====
  
  // /auth/sign-in ou /auth/sign-up -> /login
  if (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // /auth/forgot-password -> /forgot-password
  if (pathname.startsWith('/auth/forgot-password')) {
    return NextResponse.redirect(new URL('/forgot-password', request.url))
  }
  
  // /register -> /login
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // ===== DETECÇÃO DE TENANT =====
  
  // Extrai tenant do subdomínio
  const tenant = getTenantFromHost(host)
  
  // Também aceita header x-tenant-id para desenvolvimento
  const tenantHeader = request.headers.get('x-tenant-id')
  const effectiveTenant = tenant || tenantHeader
  
  // Cria response com headers de tenant
  const response = NextResponse.next()
  
  if (effectiveTenant) {
    // Adiciona tenant nos headers para uso em Server Components/Actions
    response.headers.set('x-tenant-slug', effectiveTenant)
  }
  
  // ===== PROTEÇÃO DE ROTAS =====
  
  // Rotas públicas não requerem autenticação
  if (isPublicRoute(pathname)) {
    return response
  }
  
  // Verifica autenticação
  const authenticated = isAuthenticated(request)
  
  if (!authenticated) {
    // Determina para qual login redirecionar
    // Rotas do dashboard/admin vão para /admin/login
    // Outras rotas vão para /login (usuário comum)
    const isAdminRoute = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/settings') ||
                         pathname.startsWith('/admin') ||
                         pathname.startsWith('/calendar') ||
                         pathname.startsWith('/chat') ||
                         pathname.startsWith('/mail') ||
                         pathname.startsWith('/tasks') ||
                         pathname.startsWith('/users') ||
                         pathname.startsWith('/faqs') ||
                         pathname.startsWith('/pricing')
    
    const loginPath = isAdminRoute ? '/admin/login' : '/login'
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Usuário autenticado, permite acesso
  return response
}

// Configuração de matcher
export const config = {
  matcher: [
    // Match all request paths except for:
    // - api (exceto /api/auth que tratamos no middleware)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico, robots.txt, sitemap.xml
    // - arquivos estáticos (.png, .jpg, .svg, etc)
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)).*)',
  ],
}
