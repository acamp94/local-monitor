export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export function withTimeout(signal: AbortSignal, timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  const abort = () => {
    window.clearTimeout(timeoutId)
    controller.abort()
  }

  if (signal.aborted) abort()
  else signal.addEventListener('abort', abort, { once: true })

  return controller.signal
}
