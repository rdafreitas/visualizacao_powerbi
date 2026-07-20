// apps/web/src/components/planejamento/TarefaForm.tsx
// Componente funcional tipado com FC. Props desestruturadas.
// Usa useCallback para evitar recriação de handlers a cada render.

import { type FC, useState, useCallback } from 'react';
import type { CreateTarefaDTO, TipoAtividade, Acao } from '@rotina/shared-types';
import { useTarefas } from '../../hooks/useTarefas';
import clsx from 'clsx';

// ── Tipos das Props ───────────────────────────────────────

interface TarefaFormProps {
  acoes: Acao[];
  onSucesso?: () => void;
}

const TIPOS_ATIVIDADE: TipoAtividade[] = [
  'Videoaula', 'Resumo/Leitura', 'Exercício/Questões',
  'Revisão', 'Projeto', 'Treino/Prática', 'Reunião', 'Rotineira', 'A definir/Flexível',
];

const FORM_INICIAL: CreateTarefaDTO = {
  acaoId: '',
  descricao: '',
  tipo: 'Rotineira',
  localPlataforma: '',
  prioridade: 1,
  diasParaConcluir: 1,
  vinculadaA: [],
};

// ── Componente ────────────────────────────────────────────

export const TarefaForm: FC<TarefaFormProps> = ({ acoes, onSucesso }) => {
  const { criar, prioridadesEmUso } = useTarefas();
  const [form, setForm] = useState<CreateTarefaDTO>(FORM_INICIAL);

  // useCallback evita recriar o handler a cada render do pai
  const handleChange = useCallback(
    <K extends keyof CreateTarefaDTO>(campo: K, valor: CreateTarefaDTO[K]) => {
      setForm((prev) => ({ ...prev, [campo]: valor }));
    },
    []
  );

  const prioridadesOcupadas = prioridadesEmUso(form.acaoId);
  const prioridadeConflito  = prioridadesOcupadas.includes(form.prioridade);

  const handleSubmit = useCallback(async () => {
    if (!form.acaoId || !form.descricao || prioridadeConflito) return;
    await criar.mutateAsync(form);
    setForm(FORM_INICIAL);
    onSucesso?.();
  }, [form, criar, prioridadeConflito, onSucesso]);

  // ── Render ────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-purple-800 bg-purple-950 p-4 flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-widest text-teal-400">Nova Tarefa</span>

      {/* Ação */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[11px] text-purple-300">Ação</label>
          <select
            value={form.acaoId}
            onChange={(e) => handleChange('acaoId', e.target.value)}
            className="bg-purple-900/60 border border-purple-700 rounded-md text-sm text-purple-100 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="">Selecione a ação...</option>
            {acoes.map(({ id, abreviacao }) => (
              <option key={id} value={id}>{abreviacao}</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-purple-300">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => handleChange('tipo', e.target.value as TipoAtividade)}
            className="bg-purple-900/60 border border-purple-700 rounded-md text-sm text-purple-100 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            {TIPOS_ATIVIDADE.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Local */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-purple-300">Local / Plataforma</label>
          <input
            value={form.localPlataforma}
            onChange={(e) => handleChange('localPlataforma', e.target.value)}
            placeholder="Ex: Udemy, Academia…"
            className="bg-purple-900/60 border border-purple-700 rounded-md text-sm text-purple-100 px-2 py-1.5 placeholder-purple-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>

        {/* Descrição */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[11px] text-purple-300">Descrição da Tarefa</label>
          <input
            value={form.descricao}
            onChange={(e) => handleChange('descricao', e.target.value)}
            placeholder="Ex: Aula 1.1 — Fundamentos de Python"
            className="bg-purple-900/60 border border-purple-700 rounded-md text-sm text-purple-100 px-2 py-1.5 placeholder-purple-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>

        {/* Prioridade */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-purple-300">
            Prioridade
            {form.acaoId && (
              <span className="ml-1 text-purple-500">
                (em uso: {prioridadesOcupadas.join(', ') || 'nenhuma'})
              </span>
            )}
          </label>
          <input
            type="number"
            min={1}
            max={99}
            value={form.prioridade}
            onChange={(e) => handleChange('prioridade', Number(e.target.value))}
            className={clsx(
              'bg-purple-900/60 border rounded-md text-sm px-2 py-1.5 font-mono focus:outline-none focus:ring-1',
              prioridadeConflito
                ? 'border-red-500 text-red-400 focus:ring-red-500'
                : 'border-purple-700 text-teal-400 focus:ring-pink-500'
            )}
          />
          {prioridadeConflito && (
            <span className="text-[10px] text-red-400">
              ⚠️ Prioridade {form.prioridade} já em uso nesta ação
            </span>
          )}
        </div>

        {/* Dias */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-purple-300">Dias para Concluir</label>
          <input
            type="number"
            min={1}
            value={form.diasParaConcluir}
            onChange={(e) => handleChange('diasParaConcluir', Number(e.target.value))}
            className="bg-purple-900/60 border border-purple-700 rounded-md text-sm text-purple-100 px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Ações do form */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => setForm(FORM_INICIAL)}
          className="px-3 py-1.5 text-[11px] rounded-md border border-purple-700 text-purple-400 hover:text-purple-200 hover:border-purple-500 transition-colors"
        >
          ↺ Limpar
        </button>
        <button
          onClick={handleSubmit}
          disabled={criar.isPending || prioridadeConflito || !form.acaoId || !form.descricao}
          className={clsx(
            'px-4 py-1.5 text-[11px] font-medium rounded-md text-white transition-all',
            'bg-gradient-to-r from-pink-600 to-purple-700',
            'hover:opacity-90 active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
          )}
        >
          {criar.isPending ? '⏳ Salvando…' : '＋ Adicionar'}
        </button>
      </div>

      {/* Feedback de erro da mutation */}
      {criar.isError && (
        <p className="text-[11px] text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">
          ⚠️ {criar.error.message}
        </p>
      )}
    </div>
  );
};
