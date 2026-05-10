import { useCallback, useEffect, useState } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { AppSnackbar } from './components/AppSnackbar'
import { LoginPage } from './pages/LoginPage'
import { MemberApplicationsPage } from './pages/MemberApplicationsPage'
import { MemberManagementPage } from './pages/MemberManagementPage'
import { PushNotificationPrompt } from './components/PushNotificationPrompt'
import { StartupSplash } from './components/StartupSplash'
import {
  applicationApi,
  isApiConfigured,
  subscribeApplicationEvents,
  type AuthSession,
} from './services/api'
import { useAppResumeRefresh } from './hooks/useAppResumeRefresh'
import { browserStorage } from './utils/browserStorage'

type AdminPage = 'dashboard' | 'customers' | 'messages'

const activePageStorageKey = 'admin_active_page'
const pendingApplicationCountStorageKey = 'admin_pending_application_count'
const appBuildStorageKey = 'admin_app_build_id'
const adminPages: AdminPage[] = ['dashboard', 'customers', 'messages']

const getStoredSession = () => {
  const stored = browserStorage.get('admin_session')

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AuthSession
  } catch {
    browserStorage.remove('admin_session')
    browserStorage.remove('admin_token')
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
  const [isStarting, setIsStarting] = useState(Boolean(initialSession))
  const [startupProgress, setStartupProgress] = useState(0)
  const [isUpdatedStartup] = useState(hasAppUpdate)
  const [notice, setNotice] = useState('')

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
    } catch {
      // Keep the cached count visible; the websocket or next refresh can correct it.
    }
  }, [session, setPendingApplicationCount])

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
          return
        }

        if (
          event.type === 'member_application.updated' &&
          event.data.status !== 'pending'
        ) {
          setPendingApplicationCount((current) => current - 1)
          return
        }

        if (
          event.type === 'member_application.deleted' &&
          event.data.status === 'pending'
        ) {
          setPendingApplicationCount((current) => current - 1)
        }
      },
    })

    return () => {
      window.clearTimeout(initialLoadTimer)
      unsubscribe()
    }
  }, [loadPendingApplicationCount, session, setPendingApplicationCount])

  const openPage = (page: AdminPage) => {
    browserStorage.set(activePageStorageKey, page)
    setActivePage(page)
  }

  const handleLogin = (nextSession: AuthSession) => {
    browserStorage.set('admin_token', nextSession.token)
    browserStorage.set('admin_session', JSON.stringify(nextSession))
    browserStorage.set(appBuildStorageKey, __APP_BUILD_ID__)
    setSession(nextSession)
  }

  const handleLogout = () => {
    browserStorage.remove('admin_token')
    browserStorage.remove('admin_session')
    browserStorage.remove(activePageStorageKey)
    browserStorage.remove(pendingApplicationCountStorageKey)
    browserStorage.remove(appBuildStorageKey)
    setPendingApplicationCountState(0)
    setSession(null)
    setActivePage('dashboard')
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
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
        pendingApplicationCount={pendingApplicationCount}
        session={session}
      />
    </>
  )
}

export default App
