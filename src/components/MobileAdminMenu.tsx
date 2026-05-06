import {
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import type { AuthSession } from '../services/api'

type AdminPageKey = 'dashboard' | 'customers' | 'messages'

type MobileAdminMenuProps = {
  activePage: AdminPageKey
  isOpen: boolean
  onClose: () => void
  onOpenCustomers: () => void
  onOpenDashboard: () => void
  onOpenMessages: () => void
  session: AuthSession
}

const navItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'customers',
    label: 'Customers',
    icon: UsersRound,
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: Mail,
  },
] satisfies Array<{
  key: AdminPageKey
  label: string
  icon: typeof LayoutDashboard
}>

export function MobileAdminMenu({
  activePage,
  isOpen,
  onClose,
  onOpenCustomers,
  onOpenDashboard,
  onOpenMessages,
  session,
}: MobileAdminMenuProps) {
  if (!isOpen) {
    return null
  }

  const actions: Record<AdminPageKey, () => void> = {
    dashboard: onOpenDashboard,
    customers: onOpenCustomers,
    messages: onOpenMessages,
  }

  const handleNavigate = (key: AdminPageKey) => {
    actions[key]()
    onClose()
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#3f2e23]/60 backdrop-blur-sm lg:hidden"
      role="dialog"
    >
      <div className="flex min-h-full">
        <aside className="flex max-h-screen w-[min(20rem,86vw)] flex-col overflow-y-auto bg-[#6f5238] px-5 py-5 text-white shadow-2xl">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-[#f7eadc] text-[#8f6847]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f5dfc8]">
                  MikiJapan
                </p>
                <p className="text-lg font-semibold">Admin</p>
              </div>
            </div>
            <button
              className="grid size-10 place-items-center rounded-lg border border-[#ead8c7]/25 bg-white/10 text-[#f5e7d8] transition hover:bg-white/15"
              onClick={onClose}
              title="Close menu"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.key === activePage

              return (
                <button
                  className={`flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#f7eadc]/18 text-white'
                      : 'text-[#f5dfc8] hover:bg-white/10 hover:text-white'
                  }`}
                  key={item.key}
                  onClick={() => handleNavigate(item.key)}
                  type="button"
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-[#ead8c7]/25 bg-white/10 p-4">
            <p className="text-sm font-medium text-white">
              {session.user.name}
            </p>
            <p className="mt-1 break-all text-xs text-[#f5dfc8]">
              {session.user.email}
            </p>
          </div>
        </aside>
        <button
          aria-label="Close menu"
          className="min-h-full flex-1"
          onClick={onClose}
          type="button"
        />
      </div>
    </div>
  )
}
