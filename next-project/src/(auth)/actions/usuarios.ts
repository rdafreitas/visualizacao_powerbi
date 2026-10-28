'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/usuarios.ts
//
// Server Actions de gestão de usuários do sistema Andorin.
//
// POR QUE 'use server' NO TOPO DO ARQUIVO?
//   Esta diretiva transforma TODAS as funções exportadas em
//   Server Actions. O Next.js gera um endpoint HTTP seguro para
//   cada função. O código nunca vai para o bundle do browser —
//   apenas uma referência opaca ao endpoint é enviada ao cliente.
//   A SUPABASE_SERVICE_ROLE_KEY usada aqui permanece exclusivamente
//   no servidor.
//
// POR QUE EM (auth)/actions/ E NÃO EM lib/actions/?
//   Consistência arquitetural: todo código de identidade e
//   controle de acesso fica em (auth)/. A pasta (auth) não
//   gera nenhuma URL — é puramente organizacional.
//   Isso facilita auditoria: "quem gerencia acessos?" → (auth)/.
//
// IMPORTS DESTA ETAPA E SUAS ORIGENS:
//   createClient      ← lib/supabase/server.ts  (anon key, respeita RLS)
//   createAdminClient ← lib/supabase/admin.ts   (service_role, bypassa RLS)
//   getProfile        ← (auth)/session.ts       (perfil do usuário logado)
// ─────────────────────────────────────────────────────────────

import { createClient }       from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'
import { getProfile }         from '@/(auth)/session'
import { isAuthSessionMissingError } from '@supabase/supabase-js'
import type { Role }          from '@/types/app'

// ── Tipo de retorno padronizado ───────────────────────────────
// Union type discriminado — o TypeScript estreita o tipo
// automaticamente após o if (!result.ok):
//   result.ok === true  → result.data  está disponível
//   result.ok === false → result.error está disponível
export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

export type StatusAcesso = 'ativo' | 'suspenso' | 'ausente' | 'sem_sessao'

// ── Input de cadastro ─────────────────────────────────────────
export interface CadastroUsuarioInput {
  nome:      string
  email:     string
  senha:     string
  role:      Role
  telefone?: string
}

// ── Tipo normalizado de usuário para a tela de Acessos ────────
export interface UsuarioComCredencial {
  id:           string
  nome:         string
  role:         Role
  telefone:     string | null
  createdAt:    string
  email:        string
  ativo:        boolean
  ultimoAcesso: string | null
  criadoPor:    string | null
}

// ─────────────────────────────────────────────────────────────
// HELPER INTERNO: exigirProprietario
//
// Sem export — só este arquivo pode usar.
// Concentra a verificação de autenticação + autorização em
// um único ponto. Toda action que modifica acessos chama isso.
//
// Por que lança exceção em vez de retornar ActionResult?
//   Para ser usado com try/catch nas actions, evitando repetir
//   o padrão if (!ok) return { ok: false, ... } em cada uma.
//
// Por que usa getProfile() e não getCurrentRole()?
//   getProfile() valida o token JWT com o servidor Supabase (getUser).
//   É a verificação mais segura. getCurrentRole() é uma versão
//   leve para casos onde não precisamos do perfil completo.
// ─────────────────────────────────────────────────────────────
async function exigirProprietario() {
  const profile = await getProfile()

  if (!profile) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (profile.role !== 'proprietario') {
    throw new Error('Sem permissão. Apenas o proprietário pode executar esta ação.')
  }

  // Retorna o profile para actions que precisam registrar
  // quem executou a operação (campo criado_por, por exemplo).
  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: cadastrarUsuario
//
// Cria um usuário no sistema em dois passos sequenciais:
//   1. auth.admin.createUser → cria em auth.users
//      O trigger handle_new_user cria profiles automaticamente.
//   2. INSERT em profiles_credencial com metadados de acesso.
//
// Por que auth.admin.createUser e não auth.signUp?
//   auth.signUp() cria uma sessão para o NOVO usuário —
//   isso derrubaria a sessão do proprietário que está cadastrando.
//   auth.admin.createUser() é puramente administrativo:
//   cria o usuário no servidor sem afetar nenhuma sessão existente.
//   Requer service_role key — nunca funciona com anon key.
// ─────────────────────────────────────────────────────────────
export async function cadastrarUsuario(
  input: CadastroUsuarioInput
): Promise<ActionResult<{ id: string; nome: string }>> {

  // Verifica autorização antes de qualquer operação
  let quemChamou
  try {
    quemChamou = await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  // ── Validações no servidor ───────────────────────────────────
  // Obrigatórias mesmo que o formulário já valide no browser.
  // Formulários podem ser contornados via DevTools ou requisições
  // diretas ao endpoint. O servidor é a fonte de verdade.
  const nomeLimpo  = input.nome.trim()
  const emailLimpo = input.email.trim().toLowerCase()

  if (!nomeLimpo)                return { ok: false, error: 'Nome é obrigatório.' }
  if (!emailLimpo)               return { ok: false, error: 'E-mail é obrigatório.' }
  if (!emailLimpo.includes('@')) return { ok: false, error: 'E-mail inválido.' }
  if (input.senha.length < 6)    return { ok: false, error: 'Senha deve ter pelo menos 6 caracteres.' }
  if (!input.role)               return { ok: false, error: 'Tipo de acesso é obrigatório.' }

  // Cliente admin — bypassa RLS para criar usuário no Auth
  const adminClient = createAdminClient()

  // ── Passo 1: cria em auth.users ─────────────────────────────
  // email_confirm: true → usuário pode logar imediatamente.
  // O admin está cadastrando — não faz sentido exigir confirmação
  // de um e-mail que o próprio admin digitou.
  //
  // user_metadata → JSON lido pelo trigger handle_new_user
  // para preencher a tabela profiles automaticamente.
  // Os campos aqui devem corresponder ao que o trigger espera:
  //   NEW.raw_user_meta_data->>'nome'
  //   NEW.raw_user_meta_data->>'role'
  //   NEW.raw_user_meta_data->>'telefone'
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email:         emailLimpo,
      password:      input.senha,
      email_confirm: true,
      user_metadata: {
        nome:     nomeLimpo,
        role:     input.role,
        telefone: input.telefone?.trim() || null,
      },
    })

  if (authError || !authData.user) {
    // Traduz erros internos do Supabase Auth para português
    if (authError?.message?.includes('already registered'))
      return { ok: false, error: 'Este e-mail já está cadastrado no sistema.' }
    if (authError?.message?.includes('password'))
      return { ok: false, error: 'A senha não atende aos requisitos mínimos.' }
    return { ok: false, error: 'Erro ao criar acesso. Tente novamente.' }
  }

  const novoId = authData.user.id

  // ── Passo 2: cria em profiles_credencial ────────────────────
  // O trigger já criou profiles. profiles_credencial precisa
  // ser inserida manualmente — o trigger não a cobre.
  //
  // Usamos adminClient aqui também porque o RLS de
  // profiles_credencial não tem policy de INSERT para usuários
  // comuns — isso é intencional, protege a tabela de escritas
  // diretas pelo browser.
  //
  // criado_por → audit trail permanente: sabe-se qual proprietário
  // cadastrou cada usuário e quando.
  const { error: credError } = await adminClient
    .from('profiles_credencial')
    .insert({
      profile_id: novoId,
      email:      emailLimpo,
      ativo:      true,
      criado_por: quemChamou.id,
    })

  if (credError) {
    // ── Rollback manual ───────────────────────────────────────
    // profiles_credencial falhou. Estado atual do banco:
    //   auth.users     → criado ✓
    //   profiles       → criado pelo trigger ✓
    //   profiles_credencial → falhou ✗
    //
    // Esse estado inconsistente impediria o login do usuário
    // (verificarAcessoAtivo retornaria o status ausente).
    // Deletamos o usuário do Auth para limpar o estado completamente.
    // O ON DELETE CASCADE em profiles garante que o profile também
    // é removido automaticamente junto com o auth.users.
    await adminClient.auth.admin.deleteUser(novoId)
    return { ok: false, error: 'Erro ao salvar credenciais. Tente novamente.' }
  }

  return { ok: true, data: { id: novoId, nome: nomeLimpo } }
}

// ─────────────────────────────────────────────────────────────
// ACTION: atualizarUsuario
//
// Proprietário edita nome, telefone e role de um usuário.
// O e-mail NÃO é editável: não faz parte do input e o UPDATE
// monta explicitamente apenas as colunas permitidas, então campos
// extras enviados por uma requisição forjada são ignorados.
//
// Usa o cliente admin porque as policies de UPDATE em profiles não
// estão versionadas; a autorização é garantida por exigirProprietario()
// e o UPDATE é restrito ao id informado.
// ─────────────────────────────────────────────────────────────
const ROLES_VALIDOS: readonly Role[] = ['proprietario', 'funcionario', 'professor', 'aluno']

export interface AtualizarUsuarioInput {
  nome:      string
  role:      Role
  telefone?: string | null
}

export async function atualizarUsuario(
  profileId: string,
  input:     AtualizarUsuarioInput
): Promise<ActionResult<{ id: string; nome: string }>> {

  let quemChamou
  try {
    quemChamou = await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  const nomeLimpo     = typeof input?.nome === 'string' ? input.nome.trim() : ''
  const telefoneLimpo = typeof input?.telefone === 'string' ? input.telefone.trim() : ''

  if (!profileId)                              return { ok: false, error: 'Usuário inválido.' }
  if (!nomeLimpo)                              return { ok: false, error: 'Nome é obrigatório.' }
  if (nomeLimpo.length > 120)                  return { ok: false, error: 'Nome muito longo.' }
  if (telefoneLimpo.length > 30)               return { ok: false, error: 'Telefone muito longo.' }
  if (!ROLES_VALIDOS.includes(input?.role))    return { ok: false, error: 'Tipo de acesso inválido.' }

  // Sem isso o proprietário poderia se rebaixar e perder o acesso ao painel.
  if (profileId === quemChamou.id && input.role !== quemChamou.role) {
    return { ok: false, error: 'Você não pode alterar o seu próprio tipo de acesso.' }
  }

  const adminClient = createAdminClient()

  // .select() permite detectar UPDATE que não afetou nenhuma linha.
  const { data, error } = await adminClient
    .from('profiles')
    .update({
      nome:     nomeLimpo,
      role:     input.role,
      telefone: telefoneLimpo || null,
    })
    .eq('id', profileId)
    .select('id')

  if (error) {
    console.error('[Acessos] Falha ao atualizar usuário', {
      codigo:   error.code,
      mensagem: error.message,
    })
    return { ok: false, error: 'Erro ao atualizar usuário.' }
  }
  if (!data || data.length === 0) {
    return { ok: false, error: 'Usuário não encontrado.' }
  }

  return { ok: true, data: { id: profileId, nome: nomeLimpo } }
}

// ─────────────────────────────────────────────────────────────
// ACTION: alterarStatusAcesso
//
// Ativa ou desativa o login de um usuário sem excluí-lo.
// ativo = false → login bloqueado no próximo tentativa.
// Todo o histórico (presenças, habilidades, pagamentos)
// permanece intacto no banco.
// ─────────────────────────────────────────────────────────────
export async function alterarStatusAcesso(
  profileId: string,
  ativo:     boolean
): Promise<ActionResult> {

  let quemChamou
  try {
    quemChamou = await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  // Proteção contra auto-bloqueio:
  // sem isso, o proprietário poderia se trancar para fora
  // do sistema sem nenhuma forma de recuperar o acesso pelo app.
  if (profileId === quemChamou.id) {
    return { ok: false, error: 'Você não pode desativar o seu próprio acesso.' }
  }

  // Aqui usamos createClient (anon key + RLS) porque a policy
  // "proprietario atualiza credencial" permite esta operação
  // para o proprietário autenticado — não precisa de service_role.
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles_credencial')
    .update({
      ativo,
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', profileId)

  if (error) return { ok: false, error: 'Erro ao alterar status de acesso.' }
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: redefinirSenha
//
// Proprietário redefine a senha de outro usuário.
// Usa auth.admin.updateUserById — exclusivo da service_role.
// O usuário-alvo não precisa estar logado nem confirmar a senha atual.
// ─────────────────────────────────────────────────────────────
export async function redefinirSenha(
  profileId: string,
  novaSenha: string
): Promise<ActionResult> {

  let quemChamou
  try {
    quemChamou = await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  if (profileId === quemChamou.id) {
    return {
      ok:    false,
      error: 'Para alterar sua própria senha, use as configurações do seu perfil.',
    }
  }

  if (novaSenha.length < 6) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(profileId, {
    password: novaSenha,
  })

  if (error) return { ok: false, error: 'Erro ao redefinir senha.' }
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarUsuariosComCredencial
//
// Busca todos os profiles com JOIN em profiles_credencial.
// Usada na tela Admin > Perfil > Acessos.
//
// Por que usa createClient (anon key) e não createAdminClient?
//   A policy "proprietario vê credenciais" já permite esta leitura
//   para o proprietário autenticado. Usar service_role seria
//   desnecessário — preferimos sempre a permissão mínima suficiente.
//   Isso é o princípio do "menor privilégio".
// ─────────────────────────────────────────────────────────────
export async function listarUsuariosComCredencial(): Promise<
  ActionResult<UsuarioComCredencial[]>
> {
  try {
    await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  const supabase = await createClient()

  // profiles_credencial tem duas FKs para profiles (profile_id e criado_por).
  // O embed precisa indicar a FK 1:1 explicitamente, senão o PostgREST
  // responde PGRST201 (relação ambígua).
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nome,
      role,
      telefone,
      created_at,
      profiles_credencial!profiles_credencial_profile_id_fkey (
        email,
        ativo,
        ultimo_acesso,
        criado_por,
        updated_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Acessos] Falha ao listar usuários', {
      codigo:   error.code,
      mensagem: error.message,
      detalhes: error.details,
      dica:     error.hint,
    })
    return { ok: false, error: 'Erro ao buscar usuários.' }
  }

  // FK 1:1: o embed vem como objeto (ou null). O Array.isArray cobre
  // tipos gerados que declaram a relação como lista.
  const usuarios: UsuarioComCredencial[] = (data ?? []).map((p) => {
    const cred = Array.isArray(p.profiles_credencial)
      ? p.profiles_credencial[0]
      : p.profiles_credencial

    return {
      id:           p.id,
      nome:         p.nome,
      role:         p.role as Role,
      telefone:     p.telefone,
      createdAt:    p.created_at,
      email:        cred?.email         ?? '—',
      ativo:        cred?.ativo         ?? false,
      ultimoAcesso: cred?.ultimo_acesso ?? null,
      criadoPor:    cred?.criado_por    ?? null,
    }
  })

  return { ok: true, data: usuarios }
}

// ─────────────────────────────────────────────────────────────
// ACTION: verificarAcessoAtivo
//
// Chamada pelo LoginForm após signInWithPassword ter sucesso.
//
// Por que é necessária?
//   O Supabase Auth autentica com base apenas em e-mail + senha.
//   Ele não conhece o campo ativo de profiles_credencial.
//   Um usuário bloqueado (ativo = false) conseguiria passar pela
//   autenticação do Supabase sem esta verificação adicional.
//
// A identidade vem de getUser() no servidor, nunca de um ID enviado
// pelo navegador. O cliente comum preserva o RLS; não usa service_role.
// Uma falha técnica não equivale a uma credencial ausente ou suspensa.
// ─────────────────────────────────────────────────────────────
export async function verificarAcessoAtivo(): Promise<ActionResult<{ status: StatusAcesso }>> {
  let etapa = 'sessao'
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      if (isAuthSessionMissingError(authError) || [
        'session_not_found', 'session_expired', 'bad_jwt',
        'refresh_token_not_found', 'refresh_token_already_used',
      ].includes(authError.code ?? '')) {
        return { ok: true, data: { status: 'sem_sessao' } }
      }
      throw authError
    }
    if (!user) return { ok: true, data: { status: 'sem_sessao' } }

    etapa = 'credencial'
    const { data, error } = await supabase
      .from('profiles_credencial')
      .select('ativo')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!data) return { ok: true, data: { status: 'ausente' } }
    if (typeof data.ativo !== 'boolean') throw new Error('Status de acesso inválido')
    return { ok: true, data: { status: data.ativo ? 'ativo' : 'suspenso' } }
  } catch (erro) {
    const codigo = typeof erro === 'object' && erro !== null && 'code' in erro &&
      typeof erro.code === 'string' && /^(PGRST\d{3}|\d{5})$/.test(erro.code)
      ? erro.code : undefined
    const status = typeof erro === 'object' && erro !== null && 'status' in erro &&
      typeof erro.status === 'number' && Number.isInteger(erro.status) &&
      erro.status >= 100 && erro.status <= 599 ? erro.status : undefined
    console.error('[Acesso] Falha técnica', { etapa, codigo, status })
    return {
      ok: false,
      error: 'Não foi possível verificar seu acesso. Tente novamente ou contate o administrador.',
    }
  }
}
