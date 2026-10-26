'use client'
// ─────────────────────────────────────────────────────────────
// src/components/ui/Input.tsx
//
// Componente de input reutilizável com suporte opcional a
// botão de visibilidade de senha (showPasswordToggle).
//
// COMO FUNCIONA O TOGGLE DE SENHA:
//   O campo <input> alterna entre type="password" (oculto)
//   e type="text" (visível). O estado senhaVisivel é interno
//   ao componente — o pai não precisa gerenciá-lo.
//   Isso é encapsulamento: o LoginForm passa showPasswordToggle={true}
//   e o componente cuida do resto.
//
// ACESSIBILIDADE:
//   • type="button" evita submit acidental dentro de <form>
//   • aria-label descreve a ação para leitores de tela
//   • tabIndex={-1} remove o botão da navegação por Tab —
//     o campo de senha já é acessível; o toggle é auxiliar visual
// ─────────────────────────────────────────────────────────────

import { useState }                from 'react'
import { InputHTMLAttributes }     from 'react'
import { cn }                      from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:               string
  error?:               string
  // Quando true, exibe o botão de olho no campo type="password"
  showPasswordToggle?:  boolean
}

// ── Ícone: olho aberto (senha visível) ───────────────────────
// SVG do padrão Heroicons (outline) — zero dependência externa.
// strokeLinecap e strokeLinejoin arredondados para visual suave.
function IconOlhoAberto() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={18}
      height={18}
      aria-hidden="true"
    >
      {/* Arco superior do olho */}
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      {/* Pupila */}
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// ── Ícone: olho fechado (senha oculta — estado padrão) ────────
// Linha diagonal representa o olho "riscado" (fechado/bloqueado).
function IconOlhoFechado() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={18}
      height={18}
      aria-hidden="true"
    >
      {/* Arco do olho (parcial — cortado pela linha diagonal) */}
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.42-4.042" />
      {/* Linha do olho no canto superior */}
      <path d="M9.88 9.88A3 3 0 0115 12" />
      {/* Linha diagonal que "risca" o olho */}
      <line x1="3" y1="3" x2="21" y2="21" />
      {/* Parte superior do arco */}
      <path d="M6.71 6.71A10.06 10.06 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.929 3.458" />
    </svg>
  )
}

// ── Componente principal ──────────────────────────────────────

export function Input({
  label,
  error,
  className,
  id,
  type,
  showPasswordToggle = false,
  disabled,
  ...props
}: InputProps) {

  // Estado interno de visibilidade — só usado quando
  // showPasswordToggle={true} e type="password"
  const [senhaVisivel, setSenhaVisivel] = useState(false)

  // Determina o type real do <input>:
  // • Se não é toggle de senha: usa o type passado pelo pai
  // • Se é toggle e senha visível: type="text"
  // • Se é toggle e senha oculta: type="password"
  const tipoEfetivo =
    showPasswordToggle && type === 'password'
      ? senhaVisivel ? 'text' : 'password'
      : type

  return (
    <div className="flex flex-col gap-1.5">

      {/* Label acessível — associado ao input pelo htmlFor/id */}
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-gray-mid uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      {/* Wrapper relativo — permite posicionar o botão de olho
          absolutamente dentro do campo sem afetar o layout externo */}
      <div className="relative">

        <input
          id={id}
          type={tipoEfetivo}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 rounded-xl border border-[#E8E8F0]',
            'text-sm font-medium text-gray-dark bg-white',
            'outline-none transition-colors placeholder:text-gray-mid',
            'focus:border-purple focus:ring-2 focus:ring-purple/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red focus:border-red focus:ring-red/10',
            // Padding direito extra quando há botão de olho,
            // para o texto não ficar por baixo do ícone
            showPasswordToggle && type === 'password' && 'pr-11',
            className,
          )}
          {...props}
        />

        {/* Botão de toggle — renderizado apenas para campos de senha */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            // tabIndex={-1}: remove da navegação por Tab.
            // O campo de senha já recebe foco — o botão é auxiliar visual.
            tabIndex={-1}
            onClick={() => setSenhaVisivel((v) => !v)}
            disabled={disabled}
            aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
            className={cn(
              // Posicionamento absoluto centralizado verticalmente
              'absolute right-3 top-1/2 -translate-y-1/2',
              // Visual neutro — não chama atenção, mas é clicável
              'text-gray-mid hover:text-gray-dark',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Foco via teclado (caso o usuário queira acessá-lo)
              'focus-visible:outline-none focus-visible:text-gray-dark',
            )}
          >
            {/* Olho fechado = estado padrão (senha oculta)
                Olho aberto  = senha visível */}
            {senhaVisivel ? <IconOlhoAberto /> : <IconOlhoFechado />}
          </button>
        )}

      </div>

      {/* Mensagem de erro abaixo do campo */}
      {error && (
        <p className="text-xs text-red font-medium">{error}</p>
      )}

    </div>
  )
}
