import {
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { MobileAdminMenu } from '../components/MobileAdminMenu'
import { Snackbar } from '../components/Snackbar'
import {
  applicationApi,
  isApiConfigured,
  memberApi,
  subscribeApplicationEvents,
  type AuthSession,
  type MemberApplication,
  type MemberApplicationEvent,
} from '../services/api'
import { numberFormatter } from '../utils/formatters'

type CustomerDashboardPageProps = {
  onLogout: () => void
  onOpenCustomers: () => void
  onOpenMessages: () => void
  session: AuthSession
}

const upsertCustomer = (
  customers: MemberApplication[],
  nextCustomer: MemberApplication,
) => {
  const existingIndex = customers.findIndex(
    (customer) => customer.id === nextCustomer.id,
  )

  if (existingIndex === -1) {
    return [nextCustomer, ...customers]
  }

  return customers.map((customer) =>
    customer.id === nextCustomer.id ? nextCustomer : customer,
  )
}

export function CustomerDashboardPage({
  onLogout,
  onOpenCustomers,
  onOpenMessages,
  session,
}: CustomerDashboardPageProps) {
  const [customers, setCustomers] = useState<MemberApplication[]>([])
  const [query, setQuery] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(isApiConfigured)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [pendingApplicationCount, setPendingApplicationCount] = useState(0)

  const loadPendingApplicationCount = useCallback(async () => {
    try {
      const data = isApiConfigured ? await applicationApi.list() : []
      setPendingApplicationCount(
        data.filter((application) => application.status === 'pending').length,
      )
    } catch {
      setNotice('โหลดจำนวนข้อมูลการสมัครไม่สำเร็จ')
    }
  }, [])

  useEffect(() => {
    if (!isApiConfigured) {
      return
    }

    let isMounted = true

    const loadCustomers = async () => {
      try {
        const data = await memberApi.list()

        if (isMounted) {
          setCustomers(data)
        }
      } catch {
        if (isMounted) {
          setNotice('เชื่อมต่อ API ไม่สำเร็จ')
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

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadPendingApplicationCount()
    }, 0)

    return () => window.clearTimeout(initialLoadTimer)
  }, [loadPendingApplicationCount])

  useEffect(() => {
    return subscribeApplicationEvents({
      onEvent: (event: MemberApplicationEvent) => {
        try {
          if (
            event.type === 'member_application.updated' &&
            event.data.status === 'approved'
          ) {
            setCustomers((current) => upsertCustomer(current, event.data))
            setPendingApplicationCount((current) => Math.max(current - 1, 0))
            return
          }

          if (event.type === 'member_application.created') {
            setPendingApplicationCount((current) => current + 1)
            return
          }

          if (event.type === 'member_application.updated') {
            setPendingApplicationCount((current) => Math.max(current - 1, 0))
            return
          }

          if (event.type === 'member_application.deleted') {
            setCustomers((current) =>
              current.filter((customer) => customer.id !== event.data.id),
            )
            setPendingApplicationCount((current) =>
              event.data.status === 'pending' || event.data.status === 'rejected'
                ? Math.max(current - 1, 0)
                : current,
            )
          }
        } catch {
          setNotice('รับจำนวนข้อมูลการสมัคร realtime ไม่สำเร็จ')
        }
      },
    })
  }, [])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return customers.filter((customer) =>
      [
        customer.firstName,
        customer.lastName,
        customer.nickname,
        customer.phone,
        customer.citizenId,
        customer.shopPageUrl,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [customers, query])

  const stats = useMemo(() => {
    const storefrontImageCount = customers.filter(
      (customer) => customer.storefrontImageUrl || customer.storefrontImage,
    ).length

    return [
      {
        label: 'สมาชิกทั้งหมด',
        value: numberFormatter.format(customers.length),
        helper: 'ผ่านการยืนยันแล้ว',
        icon: UsersRound,
        className: 'bg-[#fbf1e7] text-[#8f6847]',
      },
      {
        label: 'มีรูปหน้าร้าน',
        value: numberFormatter.format(storefrontImageCount),
        helper: 'แนบรูปประกอบข้อมูล',
        icon: UserRound,
        className: 'bg-[#f7eadc] text-[#8f6847]',
      },
      {
        label: 'รอตรวจสอบ',
        value: numberFormatter.format(pendingApplicationCount),
        helper: 'ใบสมัครใหม่',
        icon: Mail,
        className: 'bg-[#f4e7d9] text-[#6f5238]',
      },
    ]
  }, [customers, pendingApplicationCount])

  return (
    <div className="min-h-screen bg-[#fbf6f0] text-slate-900">
      <Snackbar message={notice} onClose={() => setNotice('')} />

      <MobileAdminMenu
        activePage="dashboard"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenCustomers={onOpenCustomers}
        onOpenDashboard={() => setIsMobileMenuOpen(false)}
        onOpenMessages={onOpenMessages}
        pendingApplicationCount={pendingApplicationCount}
        session={session}
      />

      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-[#6f5238] px-5 py-6 text-white lg:flex">
        <div className="mb-9 flex items-center gap-3">
          <BrandLogo className="size-11 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#f5dfc8]">MikiJapan</p>
            <p className="text-lg font-semibold">Admin</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button className="flex h-11 w-full items-center gap-3 rounded-lg bg-[#f7eadc]/18 px-3 text-left text-sm font-medium text-white">
            <LayoutDashboard size={18} />
            แดชบอร์ด
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#f5dfc8] transition hover:bg-white/10 hover:text-white"
            onClick={onOpenCustomers}
            type="button"
          >
            <UsersRound size={18} />
            ข้อมูลลูกค้า
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#f5dfc8] transition hover:bg-white/10 hover:text-white"
            onClick={onOpenMessages}
            type="button"
          >
            <Mail size={18} />
            <span className="min-w-0 flex-1">ข้อมูลการสมัคร</span>
            {pendingApplicationCount > 0 ? (
              <span className="grid min-w-6 place-items-center rounded-full bg-white px-2 py-0.5 text-xs font-bold leading-5 text-[#6f5238]">
                {pendingApplicationCount}
              </span>
            ) : null}
          </button>
        </nav>

        <div className="mt-auto rounded-lg border border-[#ead8c7]/25 bg-white/10 p-4">
          <p className="text-sm font-medium text-white">{session.user.name}</p>
          <p className="mt-1 break-all text-xs text-[#f5dfc8]">
            {session.user.email}
          </p>
          <button
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#ead8c7]/25 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15"
            onClick={onLogout}
            type="button"
          >
            <LogOut size={17} />
            ออกจากระบบ
          </button>
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
                  ภาพรวมลูกค้า
                </p>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                  แดชบอร์ดจัดการลูกค้า
                </h1>
              </div>
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
  customers: MemberApplication[]
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
            <th className="px-5 py-3">เลขบัตรประชาชน</th>
            <th className="px-5 py-3">ลิงก์ร้าน</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ead8c7]">
          {isLoading ? (
            <tr>
              <td
                className="px-5 py-10 text-center text-sm text-slate-500"
                colSpan={4}
              >
                กำลังโหลดข้อมูลลูกค้า
              </td>
            </tr>
          ) : null}

          {!isLoading && customers.length === 0 ? (
            <tr>
              <td
                className="px-5 py-10 text-center text-sm text-slate-500"
                colSpan={4}
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
                        {`${customer.firstName} ${customer.lastName}`.trim()}
                      </p>
                      <p className="mt-1 max-w-52 truncate text-sm text-slate-500">
                        {customer.nickname}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-slate-900">{customer.phone}</p>
                  <p className="mt-1 text-sm text-slate-500">สมาชิก</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {customer.citizenId}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  <a
                    className="inline-block max-w-56 truncate font-medium text-[#8f6847] hover:text-[#6f5238]"
                    href={customer.shopPageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {customer.shopPageUrl}
                  </a>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
