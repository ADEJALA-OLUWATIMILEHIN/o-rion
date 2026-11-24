import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

/** Minimal data loader: runs `fn` when deps change, exposes data/error/loading and a reload(). */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const callId = useRef(0)

  const run = useCallback(async () => {
    const id = ++callId.current
    setLoading(true)
    try {
      const result = await fnRef.current()
      if (id === callId.current) {
        setData(result)
        setError(null)
      }
    } catch (e) {
      if (id === callId.current) setError(e as Error)
    } finally {
      if (id === callId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, setData, error, loading, reload: run }
}
