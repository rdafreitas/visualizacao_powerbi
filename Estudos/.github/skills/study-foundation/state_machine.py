"""
state_machine.py — Máquina de estados do pipeline (Template Method).

Responsabilidade única: definir o ESQUELETO de execução de qualquer fase do pipeline.
Toda fase segue a mesma sequência: verificar → executar → persistir → registrar log.
Cada feature (003-007) passa apenas sua lógica específica — o esqueleto cuida do resto.

Padrão aplicado: Template Method — o esqueleto é definido UMA VEZ aqui, e reutilizado
por todas as features downstream. Nenhuma feature precisa lembrar de salvar progresso
ou registrar log — o Template Method garante.

Conceitos de programação presentes neste arquivo:
- callable: Tipo que representa "qualquer coisa que pode ser chamada" (funções, lambdas)
- try/except/finally: Tratamento de exceções com garantia de execução final
- Composição: Este módulo compõe (usa) memory_manager, logger e confirmation
- Separação de preocupações: Cada módulo faz UMA coisa; state_machine os orquestra
"""

import memory_manager
import logger
from confirmation import confirmar_sobrescrita


def executar_fase(
    numero_fase: int,
    descricao: str,
    funcao_fase: callable,
    pdf_hash: str,
    memoria: dict,
    workspace_dir: str,
    artifacts_esperados: list[str] | None = None,
) -> dict:
    """
    Implementa o Template Method para execução de fases do pipeline.

    Sequência garantida (o "esqueleto"):
      1. Verifica se fase já foi concluída (consulta memória)
      2. Verifica artefatos existentes (confirmação de sobrescrita)
      3. Registra log de início (phase_start)
      4. Executa funcao_fase() — pode lançar qualquer exceção
      5. Registra progresso (registrar_fase_concluida)
      6. Registra log de conclusão (phase_end)

    Parâmetros:
        numero_fase: Número da fase (0 a 6)
        descricao: Texto descritivo da fase (ex: "Geração de tópicos")
        funcao_fase: Função a executar — recebe (workspace_dir, memoria) e retorna dict
        pdf_hash: Hash SHA-256 do PDF sendo processado
        memoria: Dicionário com o estado atual de study-memory.json
        workspace_dir: Caminho raiz do workspace
        artifacts_esperados: Lista de caminhos de artefatos que serão gerados

    Retorna: Resultado retornado por funcao_fase().
    Lança: Re-lança qualquer exceção de funcao_fase() após registrar log ERROR.

    💡 Conceito: Template Method (Método Template)
       A SEQUÊNCIA é fixa (verificar → executar → persistir → log).
       O que VARIA é a funcao_fase (cada feature passa a sua).
       É como um formulário com campos fixos e espaços para preencher.

       Benefício prático: se no futuro quisermos adicionar um passo (ex: notificar
       por email após cada fase), alteramos APENAS este arquivo — todas as features
       ganham o comportamento automaticamente.
    """
    # ─── Passo 1: Verificar se fase já concluída ─────────────────────────
    sessao = memoria.get("current_session")
    if sessao and numero_fase in sessao.get("completed_phases", []):
        logger.log(
            logger.INFO,
            "fase_ja_concluida",
            phase=numero_fase,
            input_data={"descricao": descricao},
            decision=f"Fase {numero_fase} já concluída anteriormente — pulando.",
        )
        return {"status": "ja_concluida", "fase": numero_fase}

    # ─── Passo 2: Verificar artefatos existentes (confirmação) ───────────
    if artifacts_esperados:
        for artefato in artifacts_esperados:
            if not confirmar_sobrescrita(artefato):
                logger.log(
                    logger.INFO,
                    "confirmacao_solicitada",
                    phase=numero_fase,
                    decision=f"Usuário recusou sobrescrever: {artefato}",
                )
                return {"status": "cancelado_pelo_usuario", "fase": numero_fase}

    # ─── Passo 3: Log de início ──────────────────────────────────────────
    logger.log(
        logger.INFO,
        "phase_start",
        phase=numero_fase,
        input_data={"descricao": descricao, "pdf_hash": pdf_hash},
    )

    # ─── Passo 4: Executar a função da fase ──────────────────────────────
    try:
        resultado = funcao_fase(workspace_dir, memoria)

    except Exception as e:
        # Registrar erro no log antes de re-lançar
        logger.log(
            logger.ERROR,
            "phase_error",
            phase=numero_fase,
            input_data={"descricao": descricao},
            output_data={"erro": str(e), "tipo": type(e).__name__},
        )
        raise  # Re-lança a exceção original para o chamador tratar

    # ─── Passo 5: Registrar progresso ────────────────────────────────────
    # Extrai artefatos do resultado (se a função retornar dicionário com artefatos)
    artefatos_gerados = None
    if isinstance(resultado, dict) and "artifacts" in resultado:
        artefatos_gerados = resultado["artifacts"]

    memoria = memory_manager.registrar_fase_concluida(
        fase=numero_fase,
        pdf_hash=pdf_hash,
        variaveis_intermediarias=artefatos_gerados,
        memoria=memoria,
    )

    # Persistir no disco
    memory_manager.salvar(workspace_dir, memoria)

    # ─── Passo 6: Log de conclusão ───────────────────────────────────────
    logger.log(
        logger.INFO,
        "phase_end",
        phase=numero_fase,
        input_data={"descricao": descricao},
        output_data=resultado if isinstance(resultado, dict) else {"resultado": str(resultado)},
    )

    return resultado


def verificar_retomada(pdf_hash: str, memoria: dict) -> tuple[bool, int | None]:
    """
    Verifica se há sessão em andamento para o hash informado.
    Retorna (True, proxima_fase) se retomada disponível, (False, None) caso contrário.

    💡 Conceito: Tuple como retorno múltiplo
       Python permite retornar múltiplos valores como tupla.
       O chamador pode "desempacotar" (unpack) assim:
         disponivel, proxima = verificar_retomada(hash, mem)
       Isso evita criar uma classe ou dict só para retornar 2 valores.
    """
    sessao = memory_manager.detectar_progresso(pdf_hash, memoria)

    if sessao is None:
        return (False, None)

    fases_concluidas = sessao.get("completed_phases", [])

    if not fases_concluidas:
        return (True, 0)

    proxima_fase = max(fases_concluidas) + 1
    return (True, proxima_fase)
