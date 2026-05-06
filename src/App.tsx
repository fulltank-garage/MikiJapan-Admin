import { useState } from 'react'
import { CustomerDashboardPage } from './pages/CustomerDashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MessagesPage } from './pages/MessagesPage'
import type { AuthSession } from './services/api'

type AdminPage = 'dashboard' | 'messages'

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

function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  )
  const [activePage, setActivePage] = useState<AdminPage>('dashboard')

  const handleLogin = (nextSession: AuthSession) => {
    localStorage.setItem('admin_token', nextSession.token)
    localStorage.setItem('admin_session', JSON.stringify(nextSession))
    setSession(nextSession)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_session')
    setSession(null)
    setActivePage('dashboard')
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (activePage === 'messages') {
    return (
      <MessagesPage
        onBackToDashboard={() => setActivePage('dashboard')}
        onLogout={handleLogout}
        session={session}
      />
    )
  }

  return (
    <CustomerDashboardPage
      onLogout={handleLogout}
      onOpenMessages={() => setActivePage('messages')}
      session={session}
    />
  )
}

export default App
