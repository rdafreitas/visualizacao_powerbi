// ─────────────────────────────────────────────────────────────
// src/lib/permissions.ts
// Fonte única de verdade para controle de acesso por role.
// Consultado pelo middleware, layouts e componentes de navegação.
// ─────────────────────────────────────────────────────────────

import type { Permission, Role } from '@/types/app'

// Mapa completo de permissões por role
export const PERMISSIONS: Record<Role, Permission[]> = {
  proprietario: [
    'admin:home',
    'admin:alunos',
    'admin:agenda',
    'admin:professores',
    'admin:financeiro',
    'admin:perfil',
  ],
  funcionario: [
    'admin:home',
    'admin:alunos',
    'admin:agenda',
    'admin:professores',
    // NÃO inclui: 'admin:financeiro', 'admin:perfil'
  ],
  professor: [
    // Futuro: 'professor:home', 'professor:agenda', etc.
  ],
  aluno: [
    // Futuro: 'aluno:home', 'aluno:evolucao', etc.
  ],
}

// Rota de destino após login bem-sucedido por role
export const ROLE_HOME: Record<Role, string> = {
  proprietario: '/pages/admin/home',
  funcionario:  '/pages/admin/home',
  professor:    '/pages/professor/home',
  aluno:        '/pages/aluno/home',
}

// Mapa de rota → permissão necessária (usado pelo middleware)
export const ROUTE_PERMISSION: Record<string, Permission> = {
  '/pages/admin/home':        'admin:home',
  '/pages/admin/alunos':      'admin:alunos',
  '/pages/admin/agenda':      'admin:agenda',
  '/pages/admin/professores': 'admin:professores',
  '/pages/admin/financeiro':  'admin:financeiro',
  '/pages/admin/perfil':      'admin:perfil',
}

// Roles que têm acesso ao modo Admin
export const ADMIN_ROLES: Role[] = ['proprietario', 'funcionario']

// Badge visual e ícone por role (exibido na Topbar)
export const ROLE_DISPLAY: Record<Role, { label: string; icon: string; colorClass: string }> = {
  proprietario: { label: 'Proprietário', icon: '👑', colorClass: 'bg-gold/20 text-gold-dk' },
  funcionario:  { label: 'Funcionário',  icon: '🏢', colorClass: 'bg-gray-100 text-gray-600' },
  professor:    { label: 'Professor',    icon: '🎭', colorClass: 'bg-green/20 text-green-dk' },
  aluno:        { label: 'Aluno',        icon: '🤸', colorClass: 'bg-orange/20 text-orange-dk' },
}

// ── Utilitários ───────────────────────────────────────────────

/** Verifica se um role tem uma permissão específica */
export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

/** Verifica se o role tem acesso ao modo Admin */
export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role)
}

/** Retorna a permissão exigida por uma rota (ou undefined se pública) */
export function getRoutePermission(pathname: string): Permission | undefined {
  // Normaliza a rota removendo trailing slash
  const clean = pathname.replace(/\/$/, '')
  return ROUTE_PERMISSION[clean]
}
