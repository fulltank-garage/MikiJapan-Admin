import {
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MobileAdminMenu } from '../components/MobileAdminMenu'
import { customerSeed } from '../data/customerSeed'
import {
  customerApi,
  isApiConfigured,
  type AuthSession,
  type Customer,
} from '../services/api'
import { moneyFormatter, numberFormatter } from '../utils/formatters'

type CustomerDashboardPageProps = {
  onLogout: () => void
  onOpenCustomers: () => void
  onOpenMessages: () => void
  session: AuthSession
}

export function CustomerDashboardPage({
  onLogout,
  onOpenCustomers,
  onOpenMessages,
  session,
}: CustomerDashboardPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(customerSeed)
  const [query, setQuery] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(isApiConfigured)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isApiConfigured) {
      return
    }

    let isMounted = true

    const loadCustomers = async () => {
      try {
        const data = await customerApi.list()

        if (isMounted) {
          setCustomers(data)
        }
      } catch {
        if (isMounted) {
          setNotice('เชื่อมต่อ API ไม่สำเร็จ แสดงข้อมูลตัวอย่างชั่วคราว')
        }
      } finally {
        if (isMounted) {
          setIsLoadingCustomers(false)
        }
      }
    }

    loadCustomers()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.country,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [customers, query])

  const stats = useMemo(() => {
    const totalSpent = customers.reduce(
      (sum, customer) => sum + customer.totalSpent,
      0,
    )
    const totalOrders = customers.reduce(
      (sum, customer) => sum + customer.totalOrders,
      0,
    )
    return [
      {
        label: 'ลูกค้าทั้งหมด',
        value: numberFormatter.format(customers.length),
        helper: 'รายการในระบบ',
        icon: UsersRound,
        className: 'bg-[#fbf1e7] text-[#8f6847]',
      },
      {
        label: 'คำสั่งซื้อ',
        value: numberFormatter.format(totalOrders),
        helper: 'สะสมทุกลูกค้า',
        icon: ClipboardList,
        className: 'bg-[#f7eadc] text-[#8f6847]',
      },
      {
        label: 'ยอดใช้จ่าย',
        value: moneyFormatter.format(totalSpent),
        helper: 'มูลค่ารวม',
        icon: CircleDollarSign,
        className: 'bg-[#f4e7d9] text-[#6f5238]',
      },
    ]
  }, [customers])

  return (
    <div className="min-h-screen bg-[#fbf6f0] text-slate-900">
      <MobileAdminMenu
        activePage="dashboard"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenCustomers={onOpenCustomers}
        onOpenDashboard={() => setIsMobileMenuOpen(false)}
        onOpenMessages={onOpenMessages}
        session={session}
      />

      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-[#6f5238] px-5 py-6 text-white lg:flex">
        <div className="mb-9 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-[#f7eadc] text-[#6f5238]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f5dfc8]">MikiJapan</p>
            <p className="text-lg font-semibold">Admin</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button className="flex h-11 w-full items-center gap-3 rounded-lg bg-[#f7eadc]/18 px-3 text-left text-sm font-medium text-white">
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#f5dfc8] transition hover:bg-white/10 hover:text-white"
            onClick={onOpenCustomers}
            type="button"
          >
            <UsersRound size={18} />
            Customers
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#f5dfc8] transition hover:bg-white/10 hover:text-white"
            onClick={onOpenMessages}
            type="button"
          >
            <Mail size={18} />
            Messages
          </button>
        </nav>

        <div className="mt-auto rounded-lg border border-[#ead8c7]/25 bg-white/10 p-4">
          <p className="text-sm font-medium text-white">{session.user.name}</p>
          <p className="mt-1 break-all text-xs text-[#f5dfc8]">
            {session.user.email}
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#ead8c7] bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                aria-expanded={isMobileMenuOpen}
                aria-label="เปิดเมนูหมวด"
                className="grid size-10 place-items-center rounded-lg border border-[#ead8c7] bg-white text-slate-700 lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                title="เมนู"
                type="button"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm font-medium text-[#8f6847]">
                  Customer Management
                </p>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                  แดชบอร์ดจัดการลูกค้า
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden h-10 items-center gap-2 rounded-lg border border-[#ead8c7] bg-white px-3 text-sm font-medium text-slate-700 sm:inline-flex">
                <CheckCircle2
                  className={
                    isApiConfigured ? 'text-[#8f6847]' : 'text-[#c49a6c]'
                  }
                  size={17}
                />
                {isApiConfigured ? 'API พร้อมใช้งาน' : 'ข้อมูลตัวอย่าง'}
              </span>
              <button
                className="grid size-10 place-items-center rounded-lg border border-[#ead8c7] bg-white text-slate-700 transition hover:bg-[#fff8f1]"
                onClick={onLogout}
                title="ออกจากระบบ"
                type="button"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon

              return (
                <article
                  className="rounded-lg border border-[#ead8c7] bg-white p-5 shadow-sm"
                  key={item.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {item.value}
                      </p>
                    </div>
                    <div
                      className={`grid size-11 place-items-center rounded-lg ${item.className}`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{item.helper}</p>
                </article>
              )
            })}
          </section>

          <section className="mt-6 rounded-lg border border-[#ead8c7] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#ead8c7] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  รายชื่อลูกค้า
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {numberFormatter.format(filteredCustomers.length)} รายการ
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block min-w-0 sm:w-80">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    className="h-11 w-full rounded-lg border border-[#dbc6b2] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#9a7655] focus:ring-4 focus:ring-[#f1dfcd]"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ค้นหาลูกค้า"
                    value={query}
                  />
                </label>
              </div>
            </div>

            {notice ? (
              <div className="border-b border-[#ead8c7] bg-[#fbf1e7] px-5 py-3 text-sm text-[#6f5238]">
                {notice}
              </div>
            ) : null}

            <CustomerTable
              customers={filteredCustomers}
              isLoading={isLoadingCustomers}
            />
          </section>
        </main>
      </div>
    </div>
  )
}

type CustomerTableProps = {
  customers: Customer[]
  isLoading: boolean
}

function CustomerTable({ customers, isLoading }: CustomerTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead className="bg-[#fff8f1] text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3">ลูกค้า</th>
            <th className="px-5 py-3">ติดต่อ</th>
            <th className="px-5 py-3 text-right">คำสั่งซื้อ</th>
            <th className="px-5 py-3 text-right">ยอดใช้จ่าย</th>
            <th className="px-5 py-3">ติดต่อล่าสุด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ead8c7]">
          {isLoading ? (
            <tr>
              <td
                className="px-5 py-10 text-center text-sm text-slate-500"
                colSpan={5}
              >
                กำลังโหลดข้อมูลลูกค้า
              </td>
            </tr>
          ) : null}

          {!isLoading && customers.length === 0 ? (
            <tr>
              <td
                className="px-5 py-10 text-center text-sm text-slate-500"
                colSpan={5}
              >
                ไม่พบข้อมูลที่ค้นหา
              </td>
            </tr>
          ) : null}

          {!isLoading &&
            customers.map((customer) => (
              <tr
                className="align-top transition hover:bg-[#fff8f1]"
                key={customer.id}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f3e8dd] text-slate-600">
                      <UserRound size={19} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-950">
                        {customer.name}
                      </p>
                      <p className="mt-1 max-w-52 truncate text-sm text-slate-500">
                        {customer.note}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-slate-900">{customer.email}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {customer.phone}
                  </p>
                </td>
                <td className="px-5 py-4 text-right text-sm text-slate-700">
                  {numberFormatter.format(customer.totalOrders)}
                </td>
                <td className="px-5 py-4 text-right text-sm font-medium text-slate-950">
                  {moneyFormatter.format(customer.totalSpent)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {customer.lastContact}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
