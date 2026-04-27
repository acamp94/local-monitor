interface Props {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className = '' }: Props) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-elevated rounded-sm h-3 ${i === 0 ? 'w-3/4' : i % 3 === 0 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
