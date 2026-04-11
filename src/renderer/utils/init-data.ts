export function getInitPayload<T = unknown>(locationState: unknown): T | null {
  if (locationState && typeof locationState === 'object') {
    return locationState as T
  }
  return null
}
