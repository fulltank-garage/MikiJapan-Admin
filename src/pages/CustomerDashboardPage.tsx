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
        className: 'bg-teal-50 text-teal-700',
      },
      {
        label: 'คำสั่งซื้อ',
        value: numberFormatter.format(totalOrders),
        helper: 'สะสมทุกลูกค้า',
        icon: ClipboardList,
        className: 'bg-sky-50 text-sky-700',
      },
      {
        label: 'ยอดใช้จ่าย',
        value: moneyFormatter.format(totalSpent),
        helper: 'มูลค่ารวม',
        icon: CircleDollarSign,
        className: 'bg-emerald-50 text-emerald-700',
      },
    ]
  }, [customers])

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-[#18202b] px-5 py-6 text-white lg:flex">
        <div className="mb-9 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-teal-400 text-[#18202b]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-100">MikiJapan</p>
            <p className="text-lg font-semibold">Admin</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button className="flex h-11 w-full items-center gap-3 rounded-lg bg-white/12 px-3 text-left text-sm font-medium text-white">
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
            onClick={onOpenCustomers}
            type="button"
          >
            <UsersRound size={18} />
            Customers
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
            onClick={onOpenMessages}
            type="button"
          >
            <Mail size={18} />
            Messages
          </button>
        </nav>

        <div className="mt-auto rounded-lg border border-white/12 bg-white/8 p-4">
          <p className="text-sm font-medium text-white">{session.user.name}</p>
          <p className="mt-1 break-all text-xs text-slate-300">
            {session.user.email}
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
                title="เมนู"
                type="button"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm font-medium text-teal-700">
                  Customer Management
                </p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  แดชบอร์ดจัดการลูกค้า
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                <CheckCircle2
                  className={
                    isApiConfigured ? 'text-emerald-600' : 'text-amber-600'
                  }
                  size={17}
                />
                {isApiConfigured ? 'API พร้อมใช้งาน' : 'ข้อมูลตัวอย่าง'}
              </span>
              <button
                className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
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
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
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

          <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
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
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ค้นหาลูกค้า"
                    value={query}
                  />
                </label>
              </div>
            </div>

            {notice ? (
              <div className="border-b border-slate-200 bg-teal-50 px-5 py-3 text-sm text-teal-800">
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
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3">ลูกค้า</th>
            <th className="px-5 py-3">ติดต่อ</th>
            <th className="px-5 py-3 text-right">คำสั่งซื้อ</th>
            <th className="px-5 py-3 text-right">ยอดใช้จ่าย</th>
            <th className="px-5 py-3">ติดต่อล่าสุด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
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
                className="align-top transition hover:bg-slate-50"
                key={customer.id}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
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
