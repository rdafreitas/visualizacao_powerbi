// ─────────────────────────────────────────────────────────────
// src/lib/permissions.ts
// Fonte única de verdade para controle de acesso por role.
// ─────────────────────────────────────────────────────────────

import type { Permission, Role } from '@/types/app'

export const PERMISSIONS: Record<Role, Permission[]> = {
  proprietario: [
    'admin:home',
    'admin:alunos',
    'admin:agenda',
    'admin:professores',
    'admin:financeiro',
    'admin:perfil',
    'admin:perfil:acessos',
  ],
  funcionario: [
    'admin:home',
    'admin:alunos',
    'admin:agenda',
    'admin:professores',
    // NÃO inclui: financeiro, perfil, perfil:acessos
  ],
  professor: [
    'professor:home',
    'professor:treinos',
    'professor:agenda',
    'professor:pagamentos',
    'professor:perfil',
  ],
  aluno: [
    'aluno:home',
    'aluno:evolucao',
    'aluno:agenda',
    'aluno:pagamentos',
    'aluno:perfil',
  ],
}

export const ROLE_HOME: Record<Role, string> = {
  proprietario: '/pages/admin/home',
  funcionario:  '/pages/admin/home',
  professor:    '/pages/professor/home',
  aluno:        '/pages/aluno/home',
}

export const ROUTE_PERMISSION: Record<string, Permission> = {
  // Admin
  '/pages/admin/home':            'admin:home',
  '/pages/admin/alunos':          'admin:alunos',
  '/pages/admin/agenda':          'admin:agenda',
  '/pages/admin/professores':     'admin:professores',
  '/pages/admin/financeiro':      'admin:financeiro',
  '/pages/admin/perfil':          'admin:perfil',
  '/pages/admin/perfil/acessos':  'admin:perfil:acessos',
  // Professor
  '/pages/professor/home':        'professor:home',
  '/pages/professor/treinos':     'professor:treinos',
  '/pages/professor/agenda':      'professor:agenda',
  '/pages/professor/pagamentos':  'professor:pagamentos',
  '/pages/professor/perfil':      'professor:perfil',
  // Aluno
  '/pages/aluno/home':            'aluno:home',
  '/pages/aluno/evolucao':        'aluno:evolucao',
  '/pages/aluno/agenda':          'aluno:agenda',
  '/pages/aluno/pagamentos':      'aluno:pagamentos',
  '/pages/aluno/perfil':          'aluno:perfil',
}

export const ADMIN_ROLES: Role[]     = ['proprietario', 'funcionario']
export const PROFESSOR_ROLES: Role[] = ['professor']
export const ALUNO_ROLES: Role[]     = ['aluno']

export const ROLE_DISPLAY: Record<Role, { label: string; icon: string; colorClass: string }> = {
  proprietario: { label: 'Proprietário', icon: '👑', colorClass: 'bg-gold/20 text-gold-dk'    },
  funcionario:  { label: 'Funcionário',  icon: '🏢', colorClass: 'bg-gray-100 text-gray-600'  },
  professor:    { label: 'Professor',    icon: '🎭', colorClass: 'bg-green/20 text-green-dk'  },
  aluno:        { label: 'Aluno',        icon: '🤸', colorClass: 'bg-orange/20 text-orange-dk'},
}

export const ROLE_LABELS: Record<Role, string> = {
  proprietario: 'Proprietário',
  funcionario:  'Funcionário',
  professor:    'Professor',
  aluno:        'Aluno',
}

// ── Utilitários ───────────────────────────────────────────────

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role)
}

export function isProfessorRole(role: Role): boolean {
  return PROFESSOR_ROLES.includes(role)
}

export function isAlunoRole(role: Role): boolean {
  return ALUNO_ROLES.includes(role)
}

export function getRoutePermission(pathname: string): Permission | undefined {
  const clean = pathname.replace(/\/$/, '')
  return ROUTE_PERMISSION[clean]
}
