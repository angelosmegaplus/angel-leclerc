export function reportAngelError(error: unknown, context: Record<string, unknown> = {}) {
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ''}`
      : error instanceof Error
        ? error.message
        : String(error)

  const payload = {
    source: 'angel-os',
    route: typeof window !== 'undefined' ? window.location.pathname : null,
    message,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    at: new Date().toISOString(),
  }

  console.error('[Angel OS]', payload)

  if (typeof window !== 'undefined') {
    try {
      const queue = JSON.parse(localStorage.getItem('angel-os:error-log') || '[]') as unknown[]
      queue.push(payload)
      localStorage.setItem('angel-os:error-log', JSON.stringify(queue.slice(-50)))
    } catch {
      // Error reporting must never break the application.
    }
  }
}
