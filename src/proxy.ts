import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy do Next.js 16
 * 
 * Responsável por:
 * - Detecção de tenant por subdomínio
 * - Roteamento Admin vs App (DEC-18)
 * - Proteção de rotas autenticadas
 * - Redirecionamentos de rotas antigas
 * 
 * Regra de Ouro (Multi-tenant):
 * - admin.decode.* ou /admin/* -> Route Group (admin)
 * - [tenant].decode.* -> Route Group (app)/[tenantId]
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
  '/login',
  '/admin-login',
  '/onboarding',
  '/sign-in',
  '/sign-in-2',
  '/sign-in-3',
  '/sign-up',
  '/sign-up-2',
  '/sign-up-3',
  '/forgot-password',
  '/forgot-password-2',
  '/forgot-password-3',
  '/landing',
  '/',
]

// Rotas que começam com esses prefixos são públicas
const PUBLIC_PREFIXES = [
  '/api/auth', // Better-Auth API
]

// Rotas de admin (requerem role admin)
const ADMIN_ROUTES = [
  '/dashboard',
  '/users',
  '/settings',
  '/calendar',
  '/chat',
  '/mail',
  '/tasks',
  '/faqs',
  '/pricing',
  '/upload-test',
]

/**
 * Extrai o tenant do hostname
 * 
 * Exemplos:
 * - cliente.decode.app -> "cliente"
 * - cliente.localhost:3000 -> "cliente"
 * - localhost:3000 -> null (sem tenant)
 * - decode.app -> null (domínio principal)
 * - admin.decode.app -> null (subdomínio reservado - vai para admin)
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
  
  // Ignora subdomínios reservados (admin vai para route group admin, não app)
  const reservedSubdomains = ['www', 'api', 'admin', 'app']
  if (reservedSubdomains.includes(tenant)) {
    return null
  }
  
  return tenant
}

/**
 * Verifica se é acesso ao painel admin
 * Via subdomínio admin.* ou rota /admin/*
 */
function isAdminAccess(host: string, pathname: string): boolean {
  const hostname = host.split(':')[0]
  const parts = hostname.split('.')
  
  // Subdomínio admin.*
  if (parts.length >= 2 && parts[0] === 'admin') {
    return true
  }
  
  // Rota que está nas ADMIN_ROUTES
  return ADMIN_ROUTES.some(route => pathname.startsWith(route))
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

  // /admin/login -> /admin-login (rota nova no route group admin)
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin-login', request.url))
  }
  
  // ===== DETECÇÃO DE CONTEXTO =====
  
  // Verifica se é acesso admin
  const isAdmin = isAdminAccess(host, pathname)
  
  // Extrai tenant do subdomínio (apenas para acesso não-admin)
  const tenant = !isAdmin ? getTenantFromHost(host) : null
  
  // Também aceita header x-tenant-id para desenvolvimento
  const tenantHeader = request.headers.get('x-tenant-id')
  const effectiveTenant = tenant || tenantHeader
  
  // Cria response com headers de contexto
  const response = NextResponse.next()
  
  if (effectiveTenant) {
    // Adiciona tenant nos headers para uso em Server Components/Actions
    response.headers.set('x-tenant-slug', effectiveTenant)
  }
  
  if (isAdmin) {
    // Marca como acesso admin
    response.headers.set('x-admin-access', 'true')
  }
  
  // ===== PROTEÇÃO DE ROTAS =====
  
  // Rotas públicas não requerem autenticação
  if (isPublicRoute(pathname)) {
    return response
  }
  
  // Verifica autenticação
  const authenticated = isAuthenticated(request)
  
  if (!authenticated) {
    // Sempre redireciona para /login (o admin-login é privado/secreto)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // ===== ROTEAMENTO TENANT (APP) =====
  
  // Se há tenant e não está em rota de tenant, redireciona
  // Isso permite que cliente.decode.app/ vá para /(app)/[tenantId]/
  if (effectiveTenant && !pathname.startsWith(`/${effectiveTenant}`)) {
    // Para agora, apenas passa o header - o roteamento dinâmico
    // será implementado conforme necessário
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
