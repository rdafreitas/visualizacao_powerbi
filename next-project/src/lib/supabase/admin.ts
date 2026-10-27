// src/lib/supabase/admin.ts
//
// Cliente Supabase com service_role key para operações privilegiadas.
//
// ╔══════════════════════════════════════════════════════════════╗
// ║  ATENÇÃO — ARQUIVO DE ALTO PRIVILÉGIO                       ║
// ║                                                              ║
// ║  Este cliente bypassa COMPLETAMENTE o RLS (Row Level         ║
// ║  Security). Ele enxerga e pode modificar QUALQUER dado      ║
// ║  em QUALQUER tabela, independente das policies definidas.   ║
// ║                                                              ║
// ║  NUNCA importe este arquivo em:                              ║
// ║    • Client Components ('use client')                        ║
// ║    • lib/supabase/proxy.ts                                   ║
// ║    • Qualquer arquivo que possa ser importado pelo browser   ║
// ║                                                              ║
// ║  SOMENTE importe em Server Actions ('use server') que        ║
// ║  requerem explicitamente permissão elevada:                  ║
// ║    • Criar usuários no Auth (auth.admin.createUser)          ║
// ║    • Deletar usuários do Auth (auth.admin.deleteUser)        ║
// ║    • Operações que o RLS bloquearia para o usuário comum     ║
// ╚══════════════════════════════════════════════════════════════╝
//
// POR QUE SEPARAR EM ARQUIVO PRÓPRIO?
//   Segurança por auditoria: ao buscar 'from @/lib/supabase/admin'
//   no repositório, você encontra TODOS os pontos que usam a
//   service_role key. Isso torna o código revisável e facilita
//   detectar uso indevido em code reviews.
//
// SOBRE persistSession: false e autoRefreshToken: false:
//   O cliente admin usa a service_role key estática — não um token
//   de usuário. Persistir sessão ou renovar token não faz sentido
//   aqui e poderia criar um cookie de sessão indesejado com
//   privilégios elevados.

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // ← nunca com NEXT_PUBLIC_
    {
      auth: {
        persistSession:   false,  // não criar cookie de sessão admin
        autoRefreshToken: false,  // service_role não expira
        detectSessionInUrl: false,
      },
    }
  )
}
