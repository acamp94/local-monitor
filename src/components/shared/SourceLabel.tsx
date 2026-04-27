import { formatRelativeTime } from '@/utils/formatters'

interface Props {
  source: string
  fetchedAt?: Date
}

export function SourceLabel({ source, fetchedAt }: Props) {
  return (
    <span className="font-mono text-[10px] text-muted tracking-wider uppercase">
      {fetchedAt ? (
        <>SRC: {source.toUpperCase()} · {formatRelativeTime(fetchedAt)}</>
      ) : (
        <>SRC: {source.toUpperCase()}</>
      )}
    </span>
  )
}
