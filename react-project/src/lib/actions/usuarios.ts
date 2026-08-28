'use server'
// ─────────────────────────────────────────────────────────────
// src/lib/actions/usuarios.ts
// Server Actions para gestão de usuários.
//
// POR QUE "use server"?
// Server Actions são funções que rodam exclusivamente no servidor
// do Next.js. Isso é essencial aqui porque:
//   1. Usamos a SUPABASE_SERVICE_ROLE_KEY que NUNCA pode ir ao browser
//   2. O supabase.auth.admin.* só funciona com service_role
//   3. O browser envia uma requisição HTTP encriptada para o servidor,
//      que executa a função e retorna apenas o resultado
// ─────────────────────────────────────────────────────────────

import { createAdminClient, createClient, getProfile } from '@/lib/supabase/server'
import type { Role } from '@/types/app'

// ── Tipos de retorno das actions ─────────────────────────────

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

export interface CadastroUsuarioInput {
  nome:     string
  email:    string
  senha:    string
  role:     Role
  telefone: string
}

// ── Actions ──────────────────────────────────────────────────

/**
 * Cria um novo usuário no sistema.
 *
 * Fluxo:
 *   1. Verifica que quem chama é proprietario (autorização)
 *   2. Cria o usuário no Auth do Supabase (supabase.auth.admin.createUser)
 *      → O trigger `on_auth_user_created` cria o profiles automaticamente
 *   3. Insere o registro em profiles_credencial com metadados de acesso
 *
 * Por que usamos auth.admin.createUser e não auth.signUp?
 *   - signUp criaria uma sessão para o NOVO usuário, derrubando a sessão
 *     do admin que está cadastrando
 *   - admin.createUser cria o usuário sem afetar a sessão corrente
 *   - admin.createUser permite pular a confirmação de e-mail (email_confirm: true)
 */
export async function cadastrarUsuario(
  input: CadastroUsuarioInput
): Promise<ActionResult<{ id: string }>> {
  // 1. Verifica autorização — quem chama deve ser proprietario
  const perfilAtual = await getProfile()
  if (!perfilAtual) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }
  if (perfilAtual.role !== 'proprietario') {
    return { ok: false, error: 'Sem permissão para cadastrar usuários.' }
  }

  const adminClient = await createAdminClient()

  // 2. Cria o usuário no Auth do Supabase
  //    O trigger `on_auth_user_created` vai criar o registro em `profiles`
  //    automaticamente com nome e role vindos de user_metadata.
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email:          input.email.trim().toLowerCase(),
    password:       input.senha,
    email_confirm:  true,           // pula confirmação de e-mail
    user_metadata: {
      nome: input.nome.trim(),
      role: input.role,
      telefone: input.telefone.trim() || null,
    },
  })

  if (authError || !authData.user) {
    // Traduz erros comuns do Supabase Auth para português
    if (authError?.message?.includes('already registered')) {
      return { ok: false, error: 'Este e-mail já está cadastrado no sistema.' }
    }
    if (authError?.message?.includes('password')) {
      return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' }
    }
    return { ok: false, error: 'Erro ao criar acesso. Tente novamente.' }
  }

  const novoUserId = authData.user.id

  // 3. Insere em profiles_credencial
  //    Usamos o adminClient pois o RLS de profiles_credencial
  //    só permite inserção por service_role (protegido de usuários comuns).
  const { error: credError } = await adminClient
    .from('profiles_credencial')
    .insert({
      profile_id: novoUserId,
      email:      input.email.trim().toLowerCase(),
      ativo:      true,
      criado_por: perfilAtual.id,
    })

  if (credError) {
    // Rollback manual: remove o usuário do Auth se profiles_credencial falhar
    await adminClient.auth.admin.deleteUser(novoUserId)
    return { ok: false, error: 'Erro ao salvar credenciais. Tente novamente.' }
  }

  return { ok: true, data: { id: novoUserId } }
}

/**
 * Ativa ou desativa o acesso de um usuário.
 * Quando desativado, o usuário não consegue fazer login
 * (a Server Action de login verifica profiles_credencial.ativo).
 */
export async function alterarStatusAcesso(
  profileId: string,
  ativo: boolean
): Promise<ActionResult> {
  const perfilAtual = await getProfile()
  if (!perfilAtual || perfilAtual.role !== 'proprietario') {
    return { ok: false, error: 'Sem permissão.' }
  }

  // Não permite desativar a si mesmo
  if (profileId === perfilAtual.id) {
    return { ok: false, error: 'Você não pode desativar seu próprio acesso.' }
  }

  const adminClient = await createAdminClient()

  const { error } = await adminClient
    .from('profiles_credencial')
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq('profile_id', profileId)

  if (error) return { ok: false, error: 'Erro ao alterar status.' }
  return { ok: true, data: undefined }
}

/**
 * Redefine a senha de um usuário.
 * Só o proprietario pode fazer isso — e nunca da própria conta.
 */
export async function redefinirSenha(
  profileId: string,
  novaSenha: string
): Promise<ActionResult> {
  const perfilAtual = await getProfile()
  if (!perfilAtual || perfilAtual.role !== 'proprietario') {
    return { ok: false, error: 'Sem permissão.' }
  }
  if (profileId === perfilAtual.id) {
    return { ok: false, error: 'Use as configurações do seu perfil para alterar sua senha.' }
  }
  if (novaSenha.length < 6) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' }
  }

  const adminClient = await createAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(profileId, {
    password: novaSenha,
  })

  if (error) return { ok: false, error: 'Erro ao redefinir senha.' }
  return { ok: true, data: undefined }
}

/**
 * Busca todos os usuários com seus dados de credencial.
 * Usada na listagem da tela Perfil > Acessos.
 */
export async function listarUsuariosComCredencial() {
  const perfilAtual = await getProfile()
  if (!perfilAtual || perfilAtual.role !== 'proprietario') {
    return { ok: false as const, error: 'Sem permissão.', data: [] }
  }

  const supabase = await createClient()

  // Join entre profiles e profiles_credencial
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nome,
      role,
      telefone,
      created_at,
      profiles_credencial (
        email,
        ativo,
        ultimo_acesso,
        criado_por,
        updated_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return { ok: false as const, error: 'Erro ao buscar usuários.', data: [] }

  // Normaliza para um array plano
  const usuarios = (data ?? []).map((p) => {
    const cred = Array.isArray(p.profiles_credencial)
      ? p.profiles_credencial[0]
      : p.profiles_credencial

    return {
      id:           p.id,
      nome:         p.nome,
      role:         p.role,
      telefone:     p.telefone,
      createdAt:    p.created_at,
      email:        cred?.email ?? '—',
      ativo:        cred?.ativo ?? false,
      ultimoAcesso: cred?.ultimo_acesso ?? null,
      criadoPor:    cred?.criado_por ?? null,
    }
  })

  return { ok: true as const, data: usuarios, error: null }
}
