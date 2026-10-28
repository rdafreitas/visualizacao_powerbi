import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { NextRequest, NextResponse } = require('next/server')
const { unstable_doesMiddlewareMatch } = require('next/experimental/testing/server')
const fakeEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service',
}

function loadModule(filename, modules = {}, logs = []) {
  const source = readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  })
  const context = {
    exports: {},
    URL,
    Error,
    process: { env: fakeEnv },
    console: { error: (...args) => logs.push(args) },
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected import in ${filename}: ${name}`)
      return modules[name]
    },
  }
  vm.runInNewContext(outputText, context)
  return context.exports
}

const permissions = loadModule('src/lib/permissions.ts')
const constants = loadModule('src/lib/constants.ts')
const cacheHeaders = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  Expires: '0',
  Pragma: 'no-cache',
}
const cookieBatches = [
  [{
    name: 'test-auth.0', value: 'renewed-test-token',
    options: { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 3600 },
  }],
  [{
    name: 'test-auth.1', value: '',
    options: { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0 },
  }],
]

function setupProxy({ role = 'proprietario', user = { id: 'verified-user' } } = {}) {
  const calls = []
  const { updateSession } = loadModule('src/lib/supabase/proxy.ts', {
    'next/server': { NextResponse },
    '@supabase/ssr': {
      createServerClient(url, key, options) {
        assert.equal(url, fakeEnv.NEXT_PUBLIC_SUPABASE_URL)
        assert.equal(key, fakeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        const query = {
          select(columns) { assert.equal(columns, 'role'); return query },
          eq(column, id) { calls.push([column, id]); return query },
          async single() { return { data: role ? { role } : null, error: null } },
        }
        return {
          auth: {
            async getUser() {
              assert.equal(options.cookies.getAll().some((cookie) => cookie.name === 'old-cookie'), true)
              for (const batch of cookieBatches) options.cookies.setAll(batch, cacheHeaders)
              return { data: { user }, error: null }
            },
          },
          from(table) { assert.equal(table, 'profiles'); return query },
        }
      },
    },
  })
  const { proxy, config } = loadModule('src/proxy.ts', {
    'next/server': { NextResponse },
    '@/lib/supabase/proxy': { updateSession },
    '@/lib/permissions': permissions,
    '@/lib/constants': constants,
  })
  return {
    calls, config,
    async run(pathname, method = 'GET') {
      const request = new NextRequest(new URL(pathname, 'https://app.invalid'), {
        method,
        headers: { cookie: 'old-cookie=old-test-value' },
      })
      const response = await proxy(request)
      return { request, response }
    },
  }
}

function assertSessionPreserved(request, response) {
  const cookies = response.cookies.getAll()
  assert.equal(cookies.length, 2)
  for (const batch of cookieBatches) {
    for (const { name, value, options } of batch) {
      assert.equal(request.cookies.get(name)?.value, value)
      const cookie = cookies.find((item) => item.name === name)
      assert.ok(cookie)
      assert.equal(cookie.value, value)
      for (const [option, expected] of Object.entries(options)) {
        assert.equal(cookie[option], expected, `Cookie option ${option}`)
      }
    }
  }
  for (const [name, value] of Object.entries(cacheHeaders)) {
    assert.equal(response.headers.get(name), value)
  }
}

test('authenticated GET and HEAD on login redirect with renewed cookies and cache headers', async () => {
  for (const method of ['GET', 'HEAD']) {
    for (const role of ['proprietario', 'funcionario', 'professor', 'aluno']) {
      const app = setupProxy({ role })
      const { request, response } = await app.run('/', method)
      assert.equal(response.status, 307)
      assert.equal(response.headers.get('location'), `https://app.invalid${permissions.ROLE_HOME[role]}`)
      assertSessionPreserved(request, response)
      assert.deepEqual(app.calls, [['id', 'verified-user']])
    }
  }
})

test('login POST reaches the Server Action even after authentication', async () => {
  const app = setupProxy()
  const { request, response } = await app.run('/', 'POST')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('x-middleware-next'), '1')
  assert.match(response.headers.get('x-middleware-request-cookie'), /test-auth\.0=renewed-test-token/)
  assertSessionPreserved(request, response)
})

test('anonymous login remains public but protected GET and POST still require a session', async () => {
  const app = setupProxy({ user: null, role: null })
  const publicResult = await app.run('/')
  assert.equal(publicResult.response.headers.get('location'), null)
  for (const method of ['GET', 'POST']) {
    const { request, response } = await app.run('/pages/admin/home', method)
    const destination = new URL(response.headers.get('location'))
    assert.equal(destination.pathname, '/')
    assert.equal(destination.searchParams.get('redirect'), '/pages/admin/home')
    assertSessionPreserved(request, response)
  }
  assert.equal(app.calls.length, 0)
})

test('missing profile, granular permissions and cross-area restrictions preserve cookies', async () => {
  for (const [role, pathname, destination] of [
    [null, '/pages/admin/home', '/?redirect=%2Fpages%2Fadmin%2Fhome'],
    ['funcionario', '/pages/admin/financeiro', '/pages/admin/home'],
    ['aluno', '/pages/admin/unknown', '/pages/aluno/home'],
    ['aluno', '/pages/professor/home', '/pages/aluno/home'],
    ['professor', '/pages/aluno/home', '/pages/professor/home'],
  ]) {
    const { request, response } = await setupProxy({ role }).run(pathname)
    assert.equal(response.headers.get('location'), `https://app.invalid${destination}`)
    assertSessionPreserved(request, response)
  }
})

test('authorized areas still pass through with updated session', async () => {
  for (const [role, pathname] of [
    ['proprietario', '/pages/admin/financeiro'],
    ['funcionario', '/pages/admin/home'],
    ['professor', '/pages/professor/home'],
    ['aluno', '/pages/aluno/home'],
  ]) {
    const { request, response } = await setupProxy({ role }).run(pathname)
    assert.equal(response.headers.get('location'), null)
    assert.equal(response.headers.get('x-middleware-next'), '1')
    assertSessionPreserved(request, response)
  }
})

test('Proxy convention replaces Middleware and keeps static asset exclusions', () => {
  assert.equal(existsSync(new URL('../src/middleware.ts', import.meta.url)), false)
  assert.equal(existsSync(new URL('../src/lib/supabase/middleware.ts', import.meta.url)), false)
  const { config } = setupProxy()
  assert.equal(Object.hasOwn(config, 'runtime'), false)
  for (const pathname of ['/', '/pages/admin/home', '/pages/aluno/home']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: pathname }), true)
  }
  for (const pathname of ['/_next/static/chunk.js', '/_next/image', '/favicon.ico', '/file.svg', '/sw.js']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: pathname }), false)
  }
})

function setupAction(options = {}) {
  const logs = []
  const queries = []
  let adminCalls = 0
  const client = {
    auth: {
      async getUser() {
        if (options.authThrows) throw options.authThrows
        return options.authResult ?? { data: { user: { id: 'verified-user' } }, error: null }
      },
    },
    from(table) {
      assert.equal(table, 'profiles_credencial')
      const query = {
        select(columns) { assert.equal(columns, 'ativo'); return query },
        eq(column, value) { queries.push([column, value]); return query },
        async maybeSingle() {
          if (options.queryThrows) throw options.queryThrows
          return options.queryResult ?? { data: { ativo: true }, error: null }
        },
      }
      return query
    },
  }
  const actions = loadModule('src/(auth)/actions/usuarios.ts', {
    '@/lib/supabase/server': {
      async createClient() {
        if (options.clientThrows) throw options.clientThrows
        return client
      },
    },
    '@/lib/supabase/admin': {
      createAdminClient() {
        adminCalls++
        if (!options.adminClient) throw new Error('Unexpected admin call')
        return options.adminClient
      },
    },
    '@/(auth)/session': { getProfile: async () => options.profile ?? null },
    '@supabase/supabase-js': {
      isAuthSessionMissingError: (error) => error.name === 'AuthSessionMissingError',
    },
  }, logs)
  return {
    logs, queries, actions,
    get adminCalls() { return adminCalls },
  }
}

test('access verification uses only verified server identity, with no administrative client', async () => {
  for (const [data, status] of [[{ ativo: true }, 'ativo'], [{ ativo: false }, 'suspenso'], [null, 'ausente']]) {
    const app = setupAction({ queryResult: { data, error: null } })
    const result = await app.actions.verificarAcessoAtivo('untrusted-browser-user')
    assert.equal(result.ok, true)
    assert.equal(result.data.status, status)
    assert.deepEqual(app.queries, [['profile_id', 'verified-user']])
    assert.equal(app.adminCalls, 0)
    assert.equal(app.logs.length, 0)
  }
})

test('missing or expired server session is explicit and prevents credential queries', async () => {
  for (const error of [null, { name: 'AuthSessionMissingError' }, { code: 'session_expired' }]) {
    const app = setupAction({ authResult: { data: { user: null }, error } })
    const result = await app.actions.verificarAcessoAtivo()
    assert.equal(result.ok, true)
    assert.equal(result.data.status, 'sem_sessao')
    assert.equal(app.queries.length, 0)
    assert.equal(app.logs.length, 0)
  }
})

test('database, network, invalid-data and configuration errors deny access as technical failures', async () => {
  for (const [options, stage] of [
    [{ clientThrows: new Error('private configuration') }, 'sessao'],
    [{ authThrows: new TypeError('private URL') }, 'sessao'],
    [{ authResult: { data: { user: null }, error: { status: 503 } } }, 'sessao'],
    [{ queryResult: { data: null, error: { code: '42501', status: 403 } } }, 'credencial'],
    [{ queryResult: { data: null, error: { code: 'PGRST116', status: 406 } } }, 'credencial'],
    [{ queryThrows: new TypeError('private network') }, 'credencial'],
    [{ queryResult: { data: { ativo: null }, error: null } }, 'credencial'],
  ]) {
    const app = setupAction(options)
    const result = await app.actions.verificarAcessoAtivo()
    assert.equal(result.ok, false)
    assert.match(result.error, /verificar seu acesso/)
    assert.equal(Object.hasOwn(result, 'data'), false)
    assert.equal(app.logs[0][1].etapa, stage)
    assert.equal(app.adminCalls, 0)
  }
})

test('server diagnostics never include arbitrary error messages or credentials', async () => {
  const app = setupAction({
    queryResult: {
      data: null,
      error: { message: 'secret-message', code: 'secret-code', status: 'secret-status', token: 'secret-token' },
    },
  })
  await app.actions.verificarAcessoAtivo()
  assert.doesNotMatch(JSON.stringify(app.logs), /secret-/)
  assert.equal(app.logs[0][1].codigo, undefined)
  assert.equal(app.logs[0][1].status, undefined)
})

test('administrative client is server-only and has no user-cookie or session storage', () => {
  const calls = []
  const client = {}
  const { createAdminClient } = loadModule('src/lib/supabase/admin.ts', {
    'server-only': {},
    '@supabase/supabase-js': {
      createClient(...args) { calls.push(args); return client },
    },
  })
  assert.equal(createAdminClient(), client)
  assert.equal(calls.length, 1)
  const [url, key, options] = calls[0]
  assert.equal(url, fakeEnv.NEXT_PUBLIC_SUPABASE_URL)
  assert.equal(key, fakeEnv.SUPABASE_SERVICE_ROLE_KEY)
  assert.equal(Object.hasOwn(options, 'cookies'), false)
  assert.equal(Object.hasOwn(options.auth, 'storage'), false)
  assert.equal(options.auth.persistSession, false)
  assert.equal(options.auth.autoRefreshToken, false)
  assert.equal(options.auth.detectSessionInUrl, false)
})

test('administrative actions still require a proprietor before creating the privileged client', async () => {
  for (const profile of [null, { id: 'caller', role: 'aluno' }, { id: 'caller', role: 'funcionario' }]) {
    const app = setupAction({ profile })
    const createResult = await app.actions.cadastrarUsuario({
      nome: 'Test', email: 'test@example.invalid', senha: 'test-password', role: 'aluno',
    })
    const resetResult = await app.actions.redefinirSenha('other-user', 'test-password')
    assert.equal(createResult.ok, false)
    assert.equal(resetResult.ok, false)
    assert.equal(app.adminCalls, 0)
  }
})

test('proprietor creates and resets another user through the isolated administrative client', async () => {
  const operations = []
  const profile = { id: 'proprietor-id', role: 'proprietario' }
  const adminClient = {
    auth: {
      admin: {
        async createUser(input) {
          operations.push(['create', input.email, input.email_confirm])
          return { data: { user: { id: 'new-user' } }, error: null }
        },
        async updateUserById(id, input) {
          operations.push(['reset', id, input.password])
          return { error: null }
        },
      },
    },
    from(table) {
      assert.equal(table, 'profiles_credencial')
      return {
        async insert(row) {
          operations.push(['credential', row.profile_id, row.criado_por, row.ativo])
          return { error: null }
        },
      }
    },
  }
  const app = setupAction({ profile, adminClient })
  const result = await app.actions.cadastrarUsuario({
    nome: 'Test', email: ' Test@Example.Invalid ', senha: 'test-password', role: 'aluno',
  })
  assert.equal(result.ok, true)
  assert.equal(result.data.id, 'new-user')
  const reset = await app.actions.redefinirSenha('new-user', 'new-test-password')
  assert.equal(reset.ok, true)
  assert.deepEqual(operations, [
    ['create', 'test@example.invalid', true],
    ['credential', 'new-user', 'proprietor-id', true],
    ['reset', 'new-user', 'new-test-password'],
  ])
  assert.equal(app.adminCalls, 2)
  assert.equal(profile.id, 'proprietor-id')
  assert.equal(profile.role, 'proprietario')
  assert.equal(app.queries.length, 0)
})

function profilesUpdateClient({ updated = [{ id: 'target' }], error = null } = {}) {
  const calls = []
  return {
    calls,
    from(table) {
      assert.equal(table, 'profiles')
      const query = {
        update(values) { calls.push(['update', values]); return query },
        eq(column, value) { calls.push(['eq', column, value]); return query },
        async select(columns) { calls.push(['select', columns]); return { data: updated, error } },
      }
      return query
    },
  }
}

test('atualizarUsuario requires a proprietor and never touches the administrative client otherwise', async () => {
  for (const profile of [null, { id: 'caller', role: 'aluno' }, { id: 'caller', role: 'funcionario' }]) {
    const app = setupAction({ profile })
    const result = await app.actions.atualizarUsuario('target', { nome: 'Test', role: 'aluno' })
    assert.equal(result.ok, false)
    assert.equal(app.adminCalls, 0)
  }
})

test('atualizarUsuario validates input before reaching the database', async () => {
  const profile = { id: 'caller', role: 'proprietario' }
  for (const [id, input] of [
    ['target', { nome: '   ', role: 'aluno' }],
    ['target', { nome: 'Test', role: 'admin' }],
    ['target', { nome: 'Test', role: 'aluno', telefone: 'x'.repeat(31) }],
    ['', { nome: 'Test', role: 'aluno' }],
    ['caller', { nome: 'Test', role: 'aluno' }],
  ]) {
    const app = setupAction({ profile })
    const result = await app.actions.atualizarUsuario(id, input)
    assert.equal(result.ok, false)
    assert.equal(app.adminCalls, 0)
  }
})

test('atualizarUsuario writes only name, phone and role, and never the e-mail', async () => {
  const profile = { id: 'caller', role: 'proprietario' }
  const adminClient = profilesUpdateClient()
  const app = setupAction({ profile, adminClient })
  const result = await app.actions.atualizarUsuario('target', {
    nome: '  Maria  ', role: 'professor', telefone: ' ', email: 'hacker@example.invalid',
  })
  assert.equal(result.ok, true)
  assert.equal(result.data.nome, 'Maria')
  assert.equal(JSON.stringify(adminClient.calls), JSON.stringify([
    ['update', { nome: 'Maria', role: 'professor', telefone: null }],
    ['eq', 'id', 'target'],
    ['select', 'id'],
  ]))
})

test('atualizarUsuario lets a proprietor edit own name but not own role, and reports missing rows', async () => {
  const profile = { id: 'caller', role: 'proprietario' }
  const own = setupAction({ profile, adminClient: profilesUpdateClient({ updated: [{ id: 'caller' }] }) })
  assert.equal((await own.actions.atualizarUsuario('caller', { nome: 'Me', role: 'proprietario' })).ok, true)

  const missing = setupAction({ profile, adminClient: profilesUpdateClient({ updated: [] }) })
  const notFound = await missing.actions.atualizarUsuario('ghost', { nome: 'Test', role: 'aluno' })
  assert.equal(notFound.ok, false)
  assert.match(notFound.error, /não encontrado/)

  const failing = setupAction({ profile, adminClient: profilesUpdateClient({ updated: null, error: { code: '42501', message: 'denied' } }) })
  const failed = await failing.actions.atualizarUsuario('target', { nome: 'Test', role: 'aluno' })
  assert.equal(failed.ok, false)
  assert.equal(failing.logs.length, 1)
})

test('filtrarUsuarios filters by role first and then by accent-insensitive name search', () => {
  const { filtrarUsuarios } = loadModule('src/lib/utils.ts')
  const lista = [
    { id: 1, nome: 'João Silva', role: 'aluno' },
    { id: 2, nome: 'Joana Souza', role: 'professor' },
    { id: 3, nome: 'Ana Joao', role: 'aluno' },
  ]
  const ids = (r) => JSON.stringify(r.map((u) => u.id))
  assert.equal(ids(filtrarUsuarios(lista, 'todos', '')), '[1,2,3]')
  assert.equal(ids(filtrarUsuarios(lista, 'aluno', '')), '[1,3]')
  assert.equal(ids(filtrarUsuarios(lista, 'todos', ' JOAO ')), '[1,3]')
  assert.equal(ids(filtrarUsuarios(lista, 'aluno', 'joa')), '[1,3]')
  assert.equal(ids(filtrarUsuarios(lista, 'professor', 'joa')), '[2]')
  assert.equal(ids(filtrarUsuarios(lista, 'professor', 'silva')), '[]')
})
