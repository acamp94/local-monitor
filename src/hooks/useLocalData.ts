import { useCallback, useState } from 'react'
import type { LocalReport } from '@/types'

const USER_REPORTS_KEY = 'monitor-user-reports'

function loadUserReports(): LocalReport[] {
  try {
    const raw = localStorage.getItem(USER_REPORTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<LocalReport & { createdAt: string }>
    return parsed.map(r => ({ ...r, createdAt: new Date(r.createdAt), lat: undefined, lon: undefined }))
  } catch {
    return []
  }
}

function saveUserReports(reports: LocalReport[]): void {
  try {
    localStorage.setItem(USER_REPORTS_KEY, JSON.stringify(reports))
  } catch { /* storage full or unavailable */ }
}

export function useLocalData() {
  const [userReports, setUserReports] = useState<LocalReport[]>(loadUserReports)

  const addReport = useCallback((title: string, category: string, body: string) => {
    const report: LocalReport = {
      id: `user-${Date.now()}`,
      title,
      category,
      body,
      createdAt: new Date(),
    }

    setUserReports(prev => {
      const updated = [report, ...prev]
      saveUserReports(updated)
      return updated
    })
  }, [])

  const deleteUserReport = useCallback((id: string) => {
    setUserReports(prev => {
      const updated = prev.filter(r => r.id !== id)
      saveUserReports(updated)
      return updated
    })
  }, [])

  return { userReports, addReport, deleteUserReport }
}
