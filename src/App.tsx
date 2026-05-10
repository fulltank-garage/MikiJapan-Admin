import { useCallback, useEffect, useState } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { AppSnackbar } from './components/AppSnackbar'
import { LoginPage } from './pages/LoginPage'
import { MemberApplicationsPage } from './pages/MemberApplicationsPage'
import { MemberManagementPage } from './pages/MemberManagementPage'
import { PushNotificationPrompt } from './components/PushNotificationPrompt'
import {
  applicationApi,
  isApiConfigured,
  subscribeApplicationEvents,
  type AuthSession,
} from './services/api'
import { browserStorage } from './utils/browserStorage'

type AdminPage = 'dashboard' | 'customers' | 'messages'

const activePageStorageKey = 'admin_active_page'
const pendingApplicationCountStorageKey = 'admin_pending_application_count'
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
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  )
  const [activePage, setActivePage] = useState<AdminPage>(() =>
    getStoredActivePage(),
  )
  const [pendingApplicationCount, setPendingApplicationCountState] = useState(
    () => getStoredPendingApplicationCount(),
  )
  const [notice, setNotice] = useState('')

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
    setSession(nextSession)
  }

  const handleLogout = () => {
    browserStorage.remove('admin_token')
    browserStorage.remove('admin_session')
    browserStorage.remove(activePageStorageKey)
    browserStorage.remove(pendingApplicationCountStorageKey)
    setPendingApplicationCountState(0)
    setSession(null)
    setActivePage('dashboard')
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
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
        pendingApplicationCount={pendingApplicationCount}
        session={session}
      />
    </>
  )
}

export default App
