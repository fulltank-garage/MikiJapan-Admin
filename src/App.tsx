import { useState } from 'react'
import { CustomerPage } from './pages/CustomerPage'
import { CustomerDashboardPage } from './pages/CustomerDashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MessagesPage } from './pages/MessagesPage'
import type { AuthSession } from './services/api'

type AdminPage = 'dashboard' | 'customers' | 'messages'

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

  return (
    <>
      <div className={activePage === 'customers' ? 'block' : 'hidden'}>
      <CustomerPage
        onLogout={handleLogout}
        onOpenDashboard={() => setActivePage('dashboard')}
        onOpenMessages={() => setActivePage('messages')}
        session={session}
      />
      </div>
      <div className={activePage === 'messages' ? 'block' : 'hidden'}>
      <MessagesPage
        onBackToDashboard={() => setActivePage('dashboard')}
        onLogout={handleLogout}
        onOpenCustomers={() => setActivePage('customers')}
        session={session}
      />
      </div>
      <div className={activePage === 'dashboard' ? 'block' : 'hidden'}>
        <CustomerDashboardPage
          onLogout={handleLogout}
          onOpenMessages={() => setActivePage('messages')}
          onOpenCustomers={() => setActivePage('customers')}
          session={session}
        />
      </div>
    </>
  )
}

export default App
