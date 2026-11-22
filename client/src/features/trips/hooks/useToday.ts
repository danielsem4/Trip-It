import { useEffect, useState } from 'react'
import { todayISO } from '../lib/tripDates'

/** Today's local date (YYYY-MM-DD); updates at local midnight and when the tab becomes visible. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayISO())

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function sync() {
      setToday(todayISO())
    }
    function schedule() {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(() => {
        sync()
        schedule()
      }, next.getTime() - now.getTime() + 1000)
    }
    function onVisibility() {
      if (document.visibilityState !== 'visible') return
      sync()
      clearTimeout(timer)
      schedule()
    }
    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return today
}
