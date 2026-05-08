import { useState } from 'react'
import { CustomerPage } from './pages/CustomerPage'
import { CustomerDashboardPage } from './pages/CustomerDashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MessagesPage } from './pages/MessagesPage'
import type { AuthSession } from './services/api'

type AdminPage = 'dashboard' | 'customers' | 'messages'

const activePageStorageKey = 'admin_active_page'
const adminPages: AdminPage[] = ['dashboard', 'customers', 'messages']

const getStoredSession = () => {
  const stored = localStorage.getItem('admin_session')

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AuthSession
  } catch {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_token')
    return null
  }
}

const getStoredActivePage = (): AdminPage => {
  const stored = localStorage.getItem(activePageStorageKey)
  return adminPages.includes(stored as AdminPage)
    ? (stored as AdminPage)
    : 'dashboard'
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  )
  const [activePage, setActivePage] = useState<AdminPage>(() =>
    getStoredActivePage(),
  )

  const openPage = (page: AdminPage) => {
    localStorage.setItem(activePageStorageKey, page)
    setActivePage(page)
  }

  const handleLogin = (nextSession: AuthSession) => {
    localStorage.setItem('admin_token', nextSession.token)
    localStorage.setItem('admin_session', JSON.stringify(nextSession))
    setSession(nextSession)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_session')
    localStorage.removeItem(activePageStorageKey)
    setSession(null)
    setActivePage('dashboard')
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (activePage === 'customers') {
    return (
      <CustomerPage
        onLogout={handleLogout}
        onOpenDashboard={() => openPage('dashboard')}
        onOpenMessages={() => openPage('messages')}
        session={session}
      />
    )
  }

  if (activePage === 'messages') {
    return (
      <MessagesPage
        onBackToDashboard={() => openPage('dashboard')}
        onLogout={handleLogout}
        onOpenCustomers={() => openPage('customers')}
        session={session}
      />
    )
  }

  return (
    <CustomerDashboardPage
      onLogout={handleLogout}
      onOpenMessages={() => openPage('messages')}
      onOpenCustomers={() => openPage('customers')}
      session={session}
    />
  )
}

export default App
