import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(
  new URL('../src/app/pages/login/LoginForm.tsx', import.meta.url), 'utf8'
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
})

function setup(options = {}) {
  const states = []
  const logs = []
  const destinations = []
  const delays = []
  const calls = { logout: 0, action: 0, refresh: 0, tables: [] }
  let hook = 0
  const supabase = {
    auth: {
      async signInWithPassword(input) {
        assert.deepEqual({ ...input }, { email: 'test@example.invalid', password: 'test-password' })
        if (options.authThrows) throw options.authThrows
        return options.authResult ?? { data: { user: { id: 'test-user' } }, error: null }
      },
      async signOut() {
        calls.logout++
        if (options.logoutThrows) throw options.logoutThrows
        return { error: options.logoutError ?? null }
      },
    },
    from(table) {
      calls.tables.push(table)
      const query = {
        select() { return query },
        eq() { return query },
        async single() {
          if (options.profileThrows) throw options.profileThrows
          return options.profileResult ?? { data: { role: options.role ?? 'proprietario' }, error: null }
        },
      }
      return query
    },
  }
  const jsx = (type, props) => ({ type, props })
  const modules = {
    react: {
      useState(initial) {
        const index = hook++
        states[index] = index === 1 ? ' Test@Example.Invalid ' : index === 2 ? 'test-password' : initial
        return [states[index], (value) => { states[index] = value }]
      },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': {
      useRouter: () => ({
        push(destination) {
          if (options.navigationThrows) throw options.navigationThrows
          destinations.push(destination)
        },
        refresh() { calls.refresh++ },
      }),
      useSearchParams: () => ({ get: () => options.redirect ?? null }),
    },
    '@/lib/supabase/client': {
      createClient() {
        if (options.clientThrows) throw options.clientThrows
        return supabase
      },
    },
    '@/lib/permissions': {
      ROLE_HOME: { proprietario: '/pages/admin/home', professor: '/pages/professor/home' },
      ROLE_LABELS: { proprietario: 'Proprietario', professor: 'Professor' },
    },
    '@/(auth)/actions/usuarios': {
      async verificarAcessoAtivo(...args) {
        assert.equal(args.length, 0)
        calls.action++
        if (options.actionThrows) throw options.actionThrows
        return options.actionResult ?? { ok: true, data: { status: 'ativo' } }
      },
    },
    '@/components/ui/Input': { Input: 'input' },
    '@/components/ui/Button': { Button: 'button' },
  }
  const context = {
    exports: {},
    Error,
    TypeError,
    console: { error: (...args) => logs.push(args) },
    setTimeout(callback, delay) { delays.push(delay); callback() },
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
      return modules[name]
    },
  }
  vm.runInNewContext(outputText, context)
  const tree = context.exports.LoginForm()
  function findForm(node) {
    if (!node || typeof node !== 'object') return undefined
    if (node.type === 'form') return node
    const children = node.props?.children
    for (const child of Array.isArray(children) ? children : [children]) {
      const form = findForm(child)
      if (form) return form
    }
  }
  const form = findForm(tree)
  assert.ok(form)
  return {
    states, logs, destinations, delays, calls,
    submit: () => form.props.onSubmit({ preventDefault() {} }),
  }
}

test('expected authentication refusals are not reported as technical failures', async () => {
  for (const [code, message] of [
    ['invalid_credentials', /senha incorretos/],
    ['email_not_confirmed', /confirmado/],
  ]) {
    const app = setup({ authResult: { data: { user: null }, error: { code } } })
    await app.submit()
    assert.match(app.states[4], message)
    assert.equal(app.states[3], false)
    assert.equal(app.logs.length, 0)
    assert.equal(app.calls.action, 0)
  }
})

test('technical failures identify their stage and always release loading', async () => {
  const cases = [
    [{ clientThrows: new Error('private configuration') }, 'cliente', /iniciar/],
    [{ authThrows: new TypeError('private network URL') }, 'autenticacao', /autenticar/],
    [{ authResult: { data: { user: null }, error: { code: 'request_timeout', status: 504 } } },
      'autenticacao', /autenticar/],
    [{ authResult: { data: { user: null }, error: null } }, 'autenticacao', /autenticar/],
    [{ profileResult: { data: null, error: { code: '42501', status: 403 } } }, 'perfil', /consultar/],
    [{ profileThrows: new Error('private database error') }, 'perfil', /consultar/],
    [{ profileResult: { data: null, error: null } }, 'perfil', /consultar/],
    [{ actionThrows: new Error('An unexpected response was received from the server.') },
      'credencial', /verificar/],
    [{ navigationThrows: new Error('private destination') }, 'redirecionamento', /abrir/],
  ]
  for (const [options, stage, message] of cases) {
    const app = setup(options)
    await app.submit()
    assert.match(app.states[4], message)
    assert.equal(app.states[3], false)
    assert.equal(app.logs[0][1].etapa, stage)
    assert.equal(app.destinations.length, 0)
    assert.equal(app.calls.logout, ['perfil', 'credencial', 'redirecionamento'].includes(stage) ? 1 : 0)
  }
})

test('diagnostics exclude sensitive fields and raw messages', async () => {
  const error = Object.assign(new Error('unexpected response: secret-token test@example.invalid'), {
    code: 'secret-code',
    status: 'secret-status',
    token: 'secret-token',
    stack: 'secret-stack',
    name: 'secret-name',
  })
  const app = setup({ actionThrows: error })
  await app.submit()
  const output = JSON.stringify(app.logs)
  assert.doesNotMatch(output, /secret-|example\.invalid|test-password/)
  assert.equal(app.logs[0][1].respostaInesperada, true)
  assert.equal(app.logs[0][1].codigo, undefined)
  assert.equal(app.logs[0][1].status, undefined)
})

test('allowlisted diagnostic codes and HTTP status are preserved', async () => {
  const app = setup({ profileResult: { data: null, error: { code: '42501', status: 403 } } })
  await app.submit()
  assert.equal(app.logs[0][1].codigo, '42501')
  assert.equal(app.logs[0][1].status, 403)
})

test('logout rejection or returned error never replaces the original failure', async () => {
  for (const options of [
    { logoutThrows: new Error('private logout error') },
    { logoutError: { code: 'unexpected_failure', status: 500 } },
  ]) {
    const app = setup({ ...options, actionThrows: new Error('unexpected response') })
    await app.submit()
    assert.match(app.states[4], /verificar/)
    assert.match(app.states[5], /encerrar a sess/)
    assert.equal(app.states[3], false)
    assert.deepEqual(app.logs.map((entry) => entry[1].etapa), ['credencial', 'logout'])
  }
})

test('action technical errors are not presented as a missing or suspended credential', async () => {
  const app = setup({
    actionResult: { ok: false, error: 'Não foi possível verificar seu acesso.' },
  })
  await app.submit()
  assert.match(app.states[4], /verificar/)
  assert.equal(app.logs[0][1].etapa, 'credencial')
  assert.equal(app.states[3], false)
  assert.equal(app.destinations.length, 0)
  assert.equal(app.calls.logout, 1)
  assert.deepEqual(app.calls.tables, ['profiles'])
})

test('denied access still signs out without navigating', async () => {
  for (const [status, message] of [
    ['ausente', /não encontrada/], ['suspenso', /suspenso/], ['sem_sessao', /expirada/],
  ]) {
    const app = setup({ actionResult: { ok: true, data: { status } } })
    await app.submit()
    assert.match(app.states[4], message)
    assert.equal(app.states[3], false)
    assert.equal(app.calls.logout, 1)
    assert.equal(app.destinations.length, 0)
    assert.deepEqual(app.calls.tables, ['profiles'])
    assert.equal(app.logs.length, 0)
  }
})

test('logout failure preserves the denied-access reason', async () => {
  const app = setup({
    actionResult: { ok: true, data: { status: 'suspenso' } },
    logoutError: { code: 'unexpected_failure', status: 500 },
  })
  await app.submit()
  assert.match(app.states[4], /suspenso/)
  assert.match(app.states[5], /encerrar a sess/)
  assert.equal(app.states[3], false)
  assert.equal(app.calls.logout, 1)
  assert.equal(app.destinations.length, 0)
  assert.equal(app.logs[0][1].etapa, 'logout')
})
test('successful login preserves destinations, delay and loading during navigation', async () => {
  for (const [options, destination, delays] of [
    [{}, '/pages/admin/home', []],
    [{ redirect: '/pages/admin/agenda' }, '/pages/admin/agenda', []],
    [{ role: 'professor' }, '/pages/professor/home', [2000]],
  ]) {
    const app = setup(options)
    await app.submit()
    assert.deepEqual(app.destinations, [destination])
    assert.deepEqual(app.delays, delays)
    assert.equal(app.calls.refresh, 1)
    assert.equal(app.calls.logout, 0)
    assert.equal(app.states[3], true)
    assert.equal(app.states[4], '')
    assert.equal(app.logs.length, 0)
  }
})
