import { useCallback, useEffect, useState } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { AppSnackbar } from './components/AppSnackbar'
import { LoginPage } from './pages/LoginPage'
import { MemberApplicationsPage } from './pages/MemberApplicationsPage'
import { MemberManagementPage } from './pages/MemberManagementPage'
import { PushNotificationPrompt } from './components/PushNotificationPrompt'
import { StartupSplash } from './components/StartupSplash'
import {
  adminAuthExpiredEvent,
  applicationApi,
  clearAdminAuthStorage,
  isApiConfigured,
  storeAdminSession,
  subscribeApplicationEvents,
  type AuthSession,
} from './services/api'
import { useAppResumeRefresh } from './hooks/useAppResumeRefresh'
import { browserStorage } from './utils/browserStorage'

type AdminPage = 'dashboard' | 'customers' | 'messages'

const activePageStorageKey = 'admin_active_page'
const pendingApplicationCountStorageKey = 'admin_pending_application_count'
const pendingApplicationLastSyncedAtStorageKey =
  'admin_pending_application_last_synced_at'
const appBuildStorageKey = 'admin_app_build_id'
const adminPages: AdminPage[] = ['dashboard', 'customers', 'messages']
let didExpireStoredSession = false

const clearStoredAdminSession = () => {
  clearAdminAuthStorage()
}

const isJwtExpired = (token: string) => {
  try {
    const payload = token.split('.')[1]
    if (!payload) {
      return true
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    )
    const decodedPayload = JSON.parse(window.atob(paddedPayload)) as {
      exp?: number
    }

    return Boolean(decodedPayload.exp && decodedPayload.exp * 1000 <= Date.now())
  } catch {
    return true
  }
}

const getStoredSession = () => {
  const stored = browserStorage.get('admin_session')
  const token = browserStorage.get('admin_token')
  const storedRefreshToken = browserStorage.get('admin_refresh_token')

  if (!stored || !token) {
    return null
  }

  try {
    const session = JSON.parse(stored) as AuthSession
    const refreshToken = storedRefreshToken || session.refreshToken

    if (!refreshToken || isJwtExpired(refreshToken)) {
      didExpireStoredSession = true
      clearStoredAdminSession()
      return null
    }

    if (isJwtExpired(token)) {
      return {
        ...session,
        refreshToken,
      }
    }

    return {
      ...session,
      refreshToken,
    }
  } catch {
    clearStoredAdminSession()
    return null
  }
}

const getStoredActivePage = (): AdminPage => {
  const stored = browserStorage.get(activePageStorageKey)
  return adminPages.includes(stored as AdminPage)
    ? (stored as AdminPage)
    : 'dashboard'
}

const getStoredPendingApplicationCount = () => {
  const stored = browserStorage.get(pendingApplicationCountStorageKey)
  const parsed = stored ? Number(stored) : 0

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const getStoredPendingApplicationLastSyncedAt = () => {
  const stored = browserStorage.get(pendingApplicationLastSyncedAtStorageKey)
  const parsed = stored ? Number(stored) : 0

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function App() {
  const initialSession = getStoredSession()
  const storedBuildId = browserStorage.get(appBuildStorageKey)
  const hasAppUpdate = Boolean(
    initialSession && storedBuildId && storedBuildId !== __APP_BUILD_ID__,
  )
  const [session, setSession] = useState<AuthSession | null>(() =>
    initialSession,
  )
  const [activePage, setActivePage] = useState<AdminPage>(() =>
    getStoredActivePage(),
  )
  const [pendingApplicationCount, setPendingApplicationCountState] = useState(
    () => getStoredPendingApplicationCount(),
  )
  const [
    pendingApplicationLastSyncedAt,
    setPendingApplicationLastSyncedAtState,
  ] = useState(() => getStoredPendingApplicationLastSyncedAt())
  const [isStarting, setIsStarting] = useState(Boolean(initialSession))
  const [startupProgress, setStartupProgress] = useState(0)
  const [isUpdatedStartup] = useState(hasAppUpdate)
  const [notice, setNotice] = useState('')
  const [loginNotice, setLoginNotice] = useState(
    didExpireStoredSession ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง' : '',
  )

  useEffect(() => {
    if (!session || !isStarting) {
      return
    }

    let nextProgress = 0
    const progressTimer = window.setInterval(() => {
      nextProgress = Math.min(100, nextProgress + 12)
      setStartupProgress(nextProgress)

      if (nextProgress >= 100) {
        window.clearInterval(progressTimer)
        browserStorage.set(appBuildStorageKey, __APP_BUILD_ID__)
        window.setTimeout(() => setIsStarting(false), 120)
      }
    }, 90)

    return () => window.clearInterval(progressTimer)
  }, [isStarting, session])

  const setPendingApplicationCount = useCallback(
    (nextValue: number | ((current: number) => number)) => {
      setPendingApplicationCountState((current) => {
        const resolvedValue =
          typeof nextValue === 'function' ? nextValue(current) : nextValue
        const normalizedValue = Math.max(0, resolvedValue)

        browserStorage.set(
          pendingApplicationCountStorageKey,
          String(normalizedValue),
        )

        return normalizedValue
      })
    },
    [],
  )

  const markPendingApplicationSynced = useCallback(() => {
    const nextSyncedAt = Date.now()
    browserStorage.set(
      pendingApplicationLastSyncedAtStorageKey,
      String(nextSyncedAt),
    )
    setPendingApplicationLastSyncedAtState(nextSyncedAt)
  }, [])

  const loadPendingApplicationCount = useCallback(async () => {
    if (!session || !isApiConfigured) {
      return
    }

    try {
      const applications = await applicationApi.list()
      setPendingApplicationCount(
        applications.filter((application) => application.status === 'pending')
          .length,
      )
      markPendingApplicationSynced()
    } catch {
      // Keep the cached count visible; the websocket or next refresh can correct it.
    }
  }, [markPendingApplicationSynced, session, setPendingApplicationCount])

  useAppResumeRefresh({
    enabled: Boolean(session),
    onRefresh: () => {
      void loadPendingApplicationCount()
    },
  })

  useEffect(() => {
    if (!session || isStarting) {
      return
    }

    const fallbackTimer = window.setInterval(() => {
      void loadPendingApplicationCount()
    }, 10000)

    return () => window.clearInterval(fallbackTimer)
  }, [isStarting, loadPendingApplicationCount, session])

  useEffect(() => {
    if (!session) {
      return
    }

    const initialLoadTimer = window.setTimeout(() => {
      void loadPendingApplicationCount()
    }, 0)

    const unsubscribe = subscribeApplicationEvents({
      onEvent: (event) => {
        if (
          event.type === 'member_application.created' &&
          event.data.status === 'pending'
        ) {
          setPendingApplicationCount((current) => current + 1)
          markPendingApplicationSynced()
          return
        }

        if (
          event.type === 'member_application.updated' &&
          event.data.status !== 'pending'
        ) {
          setPendingApplicationCount((current) => current - 1)
          markPendingApplicationSynced()
          return
        }

        if (
          event.type === 'member_application.deleted' &&
          event.data.status === 'pending'
        ) {
          setPendingApplicationCount((current) => current - 1)
          markPendingApplicationSynced()
        }
      },
    })

    return () => {
      window.clearTimeout(initialLoadTimer)
      unsubscribe()
    }
  }, [
    loadPendingApplicationCount,
    markPendingApplicationSynced,
    session,
    setPendingApplicationCount,
  ])

  const openPage = (page: AdminPage) => {
    browserStorage.set(activePageStorageKey, page)
    setActivePage(page)
  }

  const handleLogin = (nextSession: AuthSession) => {
    storeAdminSession(nextSession)
    browserStorage.set(appBuildStorageKey, __APP_BUILD_ID__)
    setLoginNotice('')
    setSession(nextSession)
  }

  const handleLogout = () => {
    clearStoredAdminSession()
    browserStorage.remove(activePageStorageKey)
    browserStorage.remove(pendingApplicationCountStorageKey)
    browserStorage.remove(pendingApplicationLastSyncedAtStorageKey)
    browserStorage.remove(appBuildStorageKey)
    setPendingApplicationCountState(0)
    setPendingApplicationLastSyncedAtState(0)
    setSession(null)
    setActivePage('dashboard')
  }

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStoredAdminSession()
      browserStorage.remove(activePageStorageKey)
      browserStorage.remove(pendingApplicationCountStorageKey)
      browserStorage.remove(pendingApplicationLastSyncedAtStorageKey)
      setPendingApplicationCountState(0)
      setPendingApplicationLastSyncedAtState(0)
      setSession(null)
      setIsStarting(false)
      setStartupProgress(0)
      setActivePage('dashboard')
      setLoginNotice('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง')
    }

    window.addEventListener(adminAuthExpiredEvent, handleAuthExpired)

    return () => {
      window.removeEventListener(adminAuthExpiredEvent, handleAuthExpired)
    }
  }, [])

  if (!session) {
    return <LoginPage initialNotice={loginNotice} onLogin={handleLogin} />
  }

  if (isStarting) {
    return (
      <StartupSplash isUpdated={isUpdatedStartup} progress={startupProgress} />
    )
  }

  if (activePage === 'customers') {
    return (
      <>
        <AppSnackbar message={notice} onClose={() => setNotice('')} />
        <PushNotificationPrompt onNotice={setNotice} />
        <MemberManagementPage
          onLogout={handleLogout}
          onOpenDashboard={() => openPage('dashboard')}
          onOpenMessages={() => openPage('messages')}
          onRefreshPendingApplicationCount={loadPendingApplicationCount}
          pendingApplicationLastSyncedAt={pendingApplicationLastSyncedAt}
          pendingApplicationCount={pendingApplicationCount}
          session={session}
        />
      </>
    )
  }

  if (activePage === 'messages') {
    return (
      <>
        <AppSnackbar message={notice} onClose={() => setNotice('')} />
        <PushNotificationPrompt onNotice={setNotice} />
        <MemberApplicationsPage
          onBackToDashboard={() => openPage('dashboard')}
          onLogout={handleLogout}
          onOpenCustomers={() => openPage('customers')}
          onRefreshPendingApplicationCount={loadPendingApplicationCount}
          pendingApplicationLastSyncedAt={pendingApplicationLastSyncedAt}
          pendingApplicationCount={pendingApplicationCount}
          session={session}
        />
      </>
    )
  }

  return (
    <>
      <AppSnackbar message={notice} onClose={() => setNotice('')} />
      <PushNotificationPrompt onNotice={setNotice} />
      <DashboardPage
        onLogout={handleLogout}
        onOpenMessages={() => openPage('messages')}
        onOpenCustomers={() => openPage('customers')}
        onRefreshPendingApplicationCount={loadPendingApplicationCount}
        pendingApplicationLastSyncedAt={pendingApplicationLastSyncedAt}
        pendingApplicationCount={pendingApplicationCount}
        session={session}
      />
    </>
  )
}

export default App
