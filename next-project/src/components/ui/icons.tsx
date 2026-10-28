import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
      {...props}
    />
  )
}

export function IconLapis(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Icon>
  )
}

export function IconChave(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3L21 2" />
      <path d="M17 6l3 3" />
      <path d="M14 9l2 2" />
    </Icon>
  )
}

export function IconCadeado(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </Icon>
  )
}

export function IconCadeadoAberto(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 017.5-2" />
    </Icon>
  )
}
