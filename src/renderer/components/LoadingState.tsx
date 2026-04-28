import { LoaderCircle } from 'lucide-react'

type LoadingStateProps = {
  title?: string
  message?: string
  variant?: 'screen' | 'panel' | 'inline' | 'table'
  className?: string
}

export default function LoadingState({
  title = 'Cargando',
  message = 'Preparando la información...',
  variant = 'panel',
  className = '',
}: LoadingStateProps) {
  const isInline = variant === 'inline'
  const isScreen = variant === 'screen'

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'relative overflow-hidden border border-white/12 bg-slate-950/70 text-white shadow-inner shadow-black/35',
        isScreen ? 'flex min-h-screen items-center justify-center bg-[#0b1016] p-6' : '',
        isInline ? 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm' : 'rounded-xl p-4',
        variant === 'table' ? 'min-h-[260px]' : '',
        className,
      ].join(' ')}
    >
      <div className={isScreen ? 'w-full max-w-sm' : 'w-full'}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{title}</p>
            {!isInline && <p className="mt-1 text-sm text-white/62">{message}</p>}
          </div>
        </div>

        {!isInline && (
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded-full bg-white/8">
              <div className="loading-shimmer h-full w-2/5 rounded-full bg-cyan-200/45" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="h-2 rounded-full bg-white/8" />
              <span className="h-2 rounded-full bg-white/8" />
              <span className="h-2 rounded-full bg-white/8" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function LoadingRows({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className={row % 2 === 0 ? 'bg-gray-950' : 'bg-gray-800'}>
          {Array.from({ length: columns }).map((__, column) => (
            <td key={column} className="border-x-2 px-2 py-2">
              <span className="loading-shimmer mx-auto block h-4 w-4/5 rounded bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
