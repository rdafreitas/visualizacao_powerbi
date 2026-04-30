# Quickstart: Study Foundation

**Feature**: `002-study-foundation` | **Date**: 2026-04-30

> Este guia mostra como testar cada User Story manualmente, passo a passo.
> Como esta é a spec 002 (a fundação), os testes são mais básicos — você vai verificar
> que os arquivos são criados corretamente e que o sistema reage como esperado a cada
> situação. Não há interface gráfica — os testes são feitos no terminal.

---

## Pré-requisitos (verificar antes de começar)

- [ ] Python 3.11+ instalado (`python --version` no terminal)
- [ ] Diretório do workspace existe e você tem permissão de escrita
- [ ] Os arquivos `.github/skills/study-foundation/*.py` estão presentes

**Verificar o Python:**
```bash
python --version
# Deve retornar: Python 3.11.x ou superior
```

**Verificar que os módulos estão presentes:**
```bash
ls .github/skills/study-foundation/
# Deve listar: memory_manager.py  logger.py  state_machine.py  data_contracts.py  confirmation.py
```

---

## User Story 1 — Memória Persistente e Retomada

**Objetivo**: Verificar que o sistema salva progresso de pipeline e oferece retomada após
interrupção.

**O que estamos testando**: O `memory_manager.py` detecta pelo hash do PDF que uma sessão
anterior existe e pergunta se o usuário quer retomar ou recomeçar.

### Passo 1 — Criar um estado simulado de sessão interrompida

Execute no terminal Python (interativo):

```python
# Abrir terminal Python no diretório raiz do workspace
python

# Dentro do Python interativo:
import sys
sys.path.insert(0, '.github/skills/study-foundation')
import memory_manager

# Inicializar (cria study-memory.json se não existir)
estado = memory_manager.inicializar('.')
print("study-memory.json criado:", 'study-memory.json' in __import__('os').listdir('.'))
```

**Saída esperada**:
```
study-memory.json criado: True
```

### Passo 2 — Simular uma sessão interrompida na fase 2

```python
# Ainda no Python interativo
import json, datetime

# Simular que o usuário processou um PDF até a fase 2 e o sistema foi interrompido
hash_simulado = "sha256:aaabbbccc111222333444555666777888999000aaabbbccc111222333444555666"

estado['current_session'] = {
    "pdf_hash": hash_simulado,
    "pdf_filename": "edital_teste.pdf",
    "current_phase": 2,
    "completed_phases": [0, 1],
    "started_at": "2026-04-30T09:00:00",
    "last_checkpoint": "2026-04-30T09:30:00",
    "artifacts": {
        "edital_md": "data/editais_md/edital_teste.md",
        "topicos_json": None,
        "relevancia_json": None,
        "gdoc_url": None,
        "anki_result_json": None
    }
}
memory_manager.salvar(estado)
print("Sessão interrompida simulada com sucesso.")
```

**Saída esperada**:
```
Sessão interrompida simulada com sucesso.
```

### Passo 3 — Verificar que o sistema detecta a sessão ao reinvocar

```python
# Simular reinvocação: detectar progresso para o mesmo hash
resultado = memory_manager.detectar_progresso(hash_simulado)

if resultado:
    fases = resultado['completed_phases']
    proxima = max(fases) + 1
    print(f"Progresso encontrado: fases {fases} concluídas.")
    print(f"Retomar da fase {proxima} ou recomeçar?")
else:
    print("Nenhum progresso encontrado para este PDF.")
```

**Saída esperada**:
```
Progresso encontrado: fases [0, 1] concluídas.
Retomar da fase 2 ou recomeçar?
```

### Passo 4 — Verificar criação automática de diretórios

```python
import data_contracts, os

criados = data_contracts.criar_diretorios_workspace('.')
print("Diretórios verificados/criados:")
for d in ['data', 'logs', 'input/editais']:
    existe = os.path.isdir(d)
    print(f"  {d}/  -> {'OK' if existe else 'FALTANDO'}")
```

**Saída esperada**:
```
Diretórios verificados/criados:
  data/  -> OK
  logs/  -> OK
  input/editais/  -> OK
```

**Cenários para verificar**:
- [ ] `study-memory.json` foi criado na raiz com estrutura correta (abrir e verificar JSON)
- [ ] Após simular interrupção, o sistema detecta a sessão pelo hash
- [ ] Todos os diretórios foram criados automaticamente

---

## User Story 2 — Logging Estruturado

**Objetivo**: Verificar que toda fase do pipeline gera ao menos uma entrada no log com
todos os campos obrigatórios.

**O que estamos testando**: O `logger.py` grava entradas estruturadas em
`/logs/execution_log.json` e o arquivo pode ser inspecionado.

### Passo 1 — Configurar e usar o logger

```python
# Novo terminal Python
python

import sys
sys.path.insert(0, '.github/skills/study-foundation')
import logger

# Configurar o logger (sem debug — comportamento padrão)
logger.configurar(log_dir='logs', debug_mode=False)

# Registrar evento de início de fase
logger.log(
    level='INFO',
    event='phase_start',
    phase=1,
    input_data={'pdf_filename': 'edital_teste.pdf'},
    sources=[]
)

# Registrar uma decisão do agente
logger.log(
    level='DECISION',
    event='classificacao_topico',
    phase=1,
    input_data={'topico': 'Princípio da legalidade'},
    output_data={'classificacao': 'alta'},
    decision='Classificado como alta relevância: mencionado explicitamente no edital (pág. 3).',
    sources=['edital', 'ia']
)

# Registrar fim de fase
logger.log(
    level='INFO',
    event='phase_end',
    phase=1,
    output_data={'topicos_gerados': 15, 'arquivo_salvo': 'data/topicos.json'},
    sources=[]
)

print("3 entradas registradas no log.")
```

**Saída esperada**:
```
3 entradas registradas no log.
```
(Em modo normal, INFO e DECISION não são exibidos no chat — apenas gravados no arquivo.)

### Passo 2 — Inspecionar o log gerado

```python
import json

with open('logs/execution_log.json', encoding='utf-8') as f:
    entradas = json.load(f)

print(f"Total de entradas no log: {len(entradas)}")
print("\nÚltimas 3 entradas:")
for entrada in entradas[-3:]:
    print(f"  [{entrada['level']}] phase={entrada['phase']} event={entrada['event']}")
    print(f"    id: {entrada['id'][:8]}...")
    print(f"    timestamp: {entrada['timestamp']}")
```

**Saída esperada**:
```
Total de entradas no log: 3

Últimas 3 entradas:
  [INFO] phase=1 event=phase_start
    id: 550e8400...
    timestamp: 2026-04-30T10:15:32.456789
  [DECISION] phase=1 event=classificacao_topico
    id: 660f9511...
    timestamp: 2026-04-30T10:15:32.512345
  [INFO] phase=1 event=phase_end
    id: 770a0622...
    timestamp: 2026-04-30T10:15:32.601234
```

**Cenários para verificar**:
- [ ] `logs/execution_log.json` existe e contém array JSON válido
- [ ] Cada entrada tem `id`, `timestamp`, `phase`, `level`, `event` preenchidos
- [ ] Entrada com `level: "DECISION"` tem o campo `decision` preenchido
- [ ] Entradas com `level: "INFO"` não aparecem no terminal (modo normal)

---

## User Story 3 — Modo Debug

**Objetivo**: Verificar que `--debug` ativo faz decisões intermediárias aparecerem no chat
sem alterar o resultado do processamento.

**O que estamos testando**: Com `debug_mode=True`, o logger exibe no terminal todos os
níveis (incluindo DEBUG e DECISION); com `debug_mode=False` (padrão), exibe apenas
WARNING e ERROR.

### Passo 1 — Comparar saída com e sem debug

```python
python

import sys
sys.path.insert(0, '.github/skills/study-foundation')
import logger

print("=== MODO NORMAL (sem debug) ===")
logger.configurar(log_dir='logs', debug_mode=False)
logger.log(level='DEBUG', event='detalhe_interno', phase=0,
           input_data={'valor': 42}, sources=[])
logger.log(level='INFO', event='fase_iniciada', phase=0, sources=[])
logger.log(level='WARNING', event='campo_ausente', phase=0,
           input_data={'campo': 'banca'}, sources=[])
# Apenas WARNING deve aparecer no terminal acima

print("\n=== MODO DEBUG (--debug ativo) ===")
logger.configurar(log_dir='logs', debug_mode=True)
logger.log(level='DEBUG', event='detalhe_interno', phase=0,
           input_data={'valor': 42}, sources=[])
logger.log(level='INFO', event='fase_iniciada', phase=0, sources=[])
logger.log(level='DECISION', event='escolha_banca', phase=0,
           decision='Banca CESPE selecionada com base na preferência salva.', sources=['preferences'])
# DEBUG, INFO e DECISION devem aparecer no terminal acima
```

**Saída esperada (modo normal)**:
```
=== MODO NORMAL (sem debug) ===
[WARNING] campo_ausente — Campo 'banca' ausente; usando valor padrão.
```

**Saída esperada (modo debug)**:
```
=== MODO DEBUG (--debug ativo) ===
[DEBUG] detalhe_interno — {'valor': 42}
[INFO] fase_iniciada
[DECISION] escolha_banca — Banca CESPE selecionada com base na preferência salva.
```

### Passo 2 — Verificar persistência da preferência de debug

```python
import memory_manager

estado = memory_manager.carregar()
estado['preferences']['debug_mode'] = True
memory_manager.salvar(estado)

# Verificar que foi salvo
estado_relido = memory_manager.carregar()
print("debug_mode salvo:", estado_relido['preferences']['debug_mode'])
```

**Saída esperada**:
```
debug_mode salvo: True
```

**Cenários para verificar**:
- [ ] Com debug inativo: apenas WARNING e ERROR aparecem no terminal
- [ ] Com debug ativo: DEBUG, INFO e DECISION também aparecem
- [ ] O resultado no `execution_log.json` é idêntico nos dois modos (tudo é sempre gravado)
- [ ] A preferência de debug é persistida em `study-memory.json`

---

## User Story 4 — Confirmação de Ações Destrutivas

**Objetivo**: Verificar que o sistema solicita confirmação antes de sobrescrever arquivos
existentes ou executar ações destrutivas.

**O que estamos testando**: O `confirmation.py` detecta que um arquivo já existe e aguarda
a resposta do usuário antes de prosseguir.

### Passo 1 — Criar arquivo de teste e tentar sobrescrever

```bash
# No terminal (bash ou PowerShell), criar um arquivo de dados de teste
echo '{"meta": {}, "data": []}' > data/topicos.json
```

```python
# No Python
python

import sys
sys.path.insert(0, '.github/skills/study-foundation')
import confirmation

# Tentar sobrescrever arquivo existente
# O sistema DEVE perguntar antes de prosseguir
pode_sobrescrever = confirmation.confirmar_sobrescrita('data/topicos.json')
print("Usuário permitiu sobrescrita:", pode_sobrescrever)
```

**Saída esperada no terminal (sistema aguarda input do usuário)**:
```
Arquivo já existe: data/topicos.json
Deseja sobrescrever? [S/n]: 
```

- Digite `S` (ou `s`) → `Usuário permitiu sobrescrita: True`
- Digite `n` (ou `N`) → `Usuário permitiu sobrescrita: False`

### Passo 2 — Verificar confirmação de ação genérica

```python
# Simular confirmação antes de publicar em Google Docs
resposta = confirmation.confirmar_acao(
    mensagem='Publicar resumo no Google Docs?',
    detalhe='Será criado/atualizado o documento "Resumo - Direito Constitucional".'
)
print("Usuário confirmou:", resposta)
```

**Saída esperada**:
```
Será criado/atualizado o documento "Resumo - Direito Constitucional".
Publicar resumo no Google Docs? [S/n]: 
```

### Passo 3 — Verificar confirmação de reprocessamento

```python
# Simular situação onde topicos.json já existe para o mesmo PDF
hash_pdf = "sha256:aaabbbccc111222333444555666777888999000aaabbbccc111222333444555666"

decisao = confirmation.confirmar_reprocessamento(
    artefato='data/topicos.json',
    pdf_hash_atual=hash_pdf,
    meta_hash_existente=hash_pdf  # mesmo hash = mesmo PDF
)
print("Decisão do usuário:", decisao)
# Espera: "reutilizar", "reprocessar" ou "cancelar"
```

**Saída esperada**:
```
Arquivo 'data/topicos.json' já existe e foi gerado a partir do mesmo PDF.
Opções:
  [1] Reutilizar arquivo existente (mais rápido)
  [2] Reprocessar (substitui o arquivo existente)
  [3] Cancelar
Escolha [1/2/3]: 
```

**Cenários para verificar**:
- [ ] Arquivo existente: sistema pergunta antes de prosseguir
- [ ] Arquivo inexistente: `confirmar_sobrescrita()` retorna `True` sem interação
- [ ] Digitando `n`: sistema para sem sobrescrever (retorna `False`)
- [ ] Confirmação de reprocessamento oferece 3 opções e respeita a escolha

---

## Verificação Cruzada (após todos os testes)

### Verificar estrutura completa do `study-memory.json`

```python
import json

with open('study-memory.json', encoding='utf-8') as f:
    memoria = json.load(f)

print("Campos raiz:", list(memoria.keys()))
print("version:", memoria['version'])
print("Preferências:")
for k, v in memoria['preferences'].items():
    print(f"  {k}: {v}")
```

**Saída esperada**:
```
Campos raiz: ['version', 'created_at', 'updated_at', 'current_session', 'preferences', 'history']
version: 1.0
Preferências:
  banca_padrao: CESPE
  deck_anki_padrao: Concurso::Direito Constitucional
  debug_mode: True
  output_dir: data
  rag_level: basico
```

### Verificar integridade do log

```python
import json

with open('logs/execution_log.json', encoding='utf-8') as f:
    log = json.load(f)

campos_obrigatorios = {'id', 'timestamp', 'phase', 'level', 'event', 'sources'}
erros = []
for i, entrada in enumerate(log):
    ausentes = campos_obrigatorios - set(entrada.keys())
    if ausentes:
        erros.append(f"Entrada {i}: campos ausentes {ausentes}")

if erros:
    print("ERROS encontrados:")
    for e in erros: print(f"  {e}")
else:
    print(f"OK — {len(log)} entradas, todas com campos obrigatórios.")
```

**Saída esperada**:
```
OK — N entradas, todas com campos obrigatórios.
```
