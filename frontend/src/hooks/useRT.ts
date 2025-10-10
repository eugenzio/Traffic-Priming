import { useRef } from 'react'

export function useRT() {
  const t0 = useRef<number | null>(null)
  
  return {
    start: () => { 
      t0.current = performance.now() 
    },
    stop: () => t0.current ? Math.round(performance.now() - t0.current) : 0,
    reset: () => { 
      t0.current = null 
    }
  }
}
