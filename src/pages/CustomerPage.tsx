import {
  ExternalLink,
  IdCard,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Menu,
  Phone,
  Search,
  Trash2,
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
  subscribeApplicationEvents,
  type AuthSession,
  type MemberApplicationEvent,
  type MemberApplication,
  type RealtimeStatus,
} from '../services/api'
import { numberFormatter } from '../utils/formatters'

type CustomerPageProps = {
  onLogout: () => void
  onOpenDashboard: () => void
  onOpenMessages: () => void
  session: AuthSession
}

const getApplicationFullName = (application: MemberApplication) =>
  `${application.firstName} ${application.lastName}`.trim()

const getStorefrontImageUrl = (application: MemberApplication) =>
  application.storefrontImageUrl || application.storefrontImage || ''

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

export function CustomerPage({
  onLogout,
  onOpenDashboard,
  onOpenMessages,
  session,
}: CustomerPageProps) {
  const [customers, setCustomers] = useState<MemberApplication[]>([])
  const [query, setQuery] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [pendingApplicationCount, setPendingApplicationCount] = useState(0)
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>('connecting')

  const loadCustomers = useCallback(async () => {
    try {
      const data = isApiConfigured ? await applicationApi.list() : []
      const approvedCustomers = data.filter(
        (application) => application.status === 'approved',
      )
      setCustomers(approvedCustomers)
      setPendingApplicationCount(
        data.filter((application) => application.status === 'pending').length,
      )
    } catch {
      setNotice('โหลดข้อมูลลูกค้าจาก API ไม่สำเร็จ')
    } finally {
      setIsLoadingCustomers(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadCustomers()
    }, 0)

    return () => window.clearTimeout(initialLoadTimer)
  }, [loadCustomers])

  useEffect(() => {
    return subscribeApplicationEvents({
      onStatus: setRealtimeStatus,
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

        if (
          event.type === 'member_application.deleted' ||
          event.data.status !== 'approved'
        ) {
          setCustomers((current) =>
            current.filter((customer) => customer.id !== event.data.id),
          )
          setPendingApplicationCount((current) =>
            event.data.status === 'pending' || event.data.status === 'rejected'
              ? Math.max(current - 1, 0)
              : current,
          )
          return
        }

        if (event.type === 'member_application.created') {
          setPendingApplicationCount((current) => current + 1)
        }
      } catch {
        setNotice('รับข้อมูล realtime ไม่สำเร็จ')
      }
      },
    })
  }, [])

  useEffect(() => {
    if (realtimeStatus === 'connected') {
      return
    }

    const fallbackTimer = window.setInterval(() => {
      loadCustomers()
    }, 10000)

    return () => window.clearInterval(fallbackTimer)
  }, [loadCustomers, realtimeStatus])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return customers
    }

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

  const storefrontImageCount = useMemo(
    () => customers.filter((customer) => getStorefrontImageUrl(customer)).length,
    [customers],
  )

  const handleDeleteCustomer = async (customer: MemberApplication) => {
    const confirmed = window.confirm(
      `ลบข้อมูลของ ${getApplicationFullName(customer)} หรือไม่? Rich Menu ของลูกค้าจะเปลี่ยนกลับเป็น Register`,
    )

    if (!confirmed) {
      return
    }

    setNotice('')

    try {
      if (isApiConfigured) {
        await applicationApi.remove(customer.id)
      }

      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id),
      )
      setNotice('ลบข้อมูลลูกค้าแล้ว และเปลี่ยน Rich Menu กลับเป็น Register')
    } catch {
      setNotice('ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf6f0] text-slate-900">
      <Snackbar message={notice} onClose={() => setNotice('')} />

      <MobileAdminMenu
        activePage="customers"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenCustomers={() => setIsMobileMenuOpen(false)}
        onOpenDashboard={onOpenDashboard}
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
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#f5dfc8] transition hover:bg-white/10 hover:text-white"
            onClick={onOpenDashboard}
            type="button"
          >
            <LayoutDashboard size={18} />
            แดชบอร์ด
          </button>
          <button className="flex h-11 w-full items-center gap-3 rounded-lg bg-[#f7eadc]/18 px-3 text-left text-sm font-medium text-white">
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
                  ลูกค้าที่ผ่านการยืนยัน
                </p>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                  จัดการข้อมูลลูกค้า
                </h1>
              </div>
            </div>

          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="ลูกค้าที่เป็น Member"
              value={numberFormatter.format(customers.length)}
            />
            <SummaryCard
              label="มีรูปหน้าร้าน"
              value={numberFormatter.format(storefrontImageCount)}
            />
            <SummaryCard
              label="รายการที่แสดง"
              value={numberFormatter.format(filteredCustomers.length)}
            />
          </section>

          <section className="mt-6 rounded-lg border border-[#ead8c7] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#ead8c7] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  รายชื่อลูกค้า
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  แสดงเฉพาะลูกค้าที่ผ่านการยืนยันการสมัครแล้ว
                </p>
              </div>

              <label className="relative block min-w-0 xl:w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  className="h-11 w-full rounded-lg border border-[#dbc6b2] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#9a7655] focus:ring-4 focus:ring-[#f1dfcd]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาชื่อ เบอร์โทร เลขบัตร"
                  value={query}
                />
              </label>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
              {isLoadingCustomers ? (
                <p className="rounded-lg border border-[#ead8c7] bg-[#fff8f1] p-6 text-center text-sm text-slate-500 xl:col-span-2">
                  กำลังโหลดข้อมูลลูกค้า
                </p>
              ) : null}

              {!isLoadingCustomers && filteredCustomers.length === 0 ? (
                <p className="rounded-lg border border-[#ead8c7] bg-[#fff8f1] p-6 text-center text-sm text-slate-500 xl:col-span-2">
                  ไม่พบข้อมูลลูกค้าที่ผ่านการยืนยัน
                </p>
              ) : null}

              {!isLoadingCustomers &&
                filteredCustomers.map((customer) => (
                  <article
                    className="overflow-hidden rounded-lg border border-[#ead8c7] bg-white shadow-sm"
                    key={customer.id}
                  >
                    {getStorefrontImageUrl(customer) ? (
                      <img
                        alt={`รูปหน้าร้านของ ${getApplicationFullName(customer)}`}
                        className="h-48 w-full object-cover"
                        src={getStorefrontImageUrl(customer)}
                      />
                    ) : (
                      <div className="grid h-48 place-items-center bg-[#fff8f1] px-5 text-center text-sm text-slate-500">
                        ไม่มีรูปหน้าร้าน
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#f3e8dd] text-slate-600">
                            <UserRound size={22} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-950">
                              {getApplicationFullName(customer)}
                            </h3>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {customer.nickname}
                            </p>
                          </div>
                        </div>

                        <button
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d8b8a7] bg-white px-3 text-sm font-semibold text-[#9a5f45] transition hover:bg-[#f8eee8]"
                          onClick={() => handleDeleteCustomer(customer)}
                          type="button"
                        >
                          <Trash2 size={17} />
                          ลบข้อมูล
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                        <CustomerDetail
                          icon={UserRound}
                          label="ชื่อ"
                          value={customer.firstName}
                        />
                        <CustomerDetail
                          icon={UserRound}
                          label="นามสกุล"
                          value={customer.lastName}
                        />
                        <CustomerDetail
                          icon={Phone}
                          label="เบอร์โทร"
                          value={customer.phone}
                        />
                        <CustomerDetail
                          icon={IdCard}
                          label="เลขบัตรประชาชน"
                          value={customer.citizenId}
                        />
                        <CustomerLinkDetail
                          icon={Link2}
                          label="ลิงก์ร้าน"
                          value={customer.shopPageUrl}
                        />
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[#ead8c7] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </article>
  )
}

function CustomerDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-[#fff8f1] px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon size={15} />
        {label}
      </div>
      <p className="mt-1 break-words font-medium text-slate-800">{value}</p>
    </div>
  )
}

function CustomerLinkDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-[#fff8f1] px-3 py-2 sm:col-span-2">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon size={15} />
        {label}
      </div>
      <a
        className="mt-1 inline-flex max-w-full items-center gap-2 break-all font-medium text-[#8f6847] hover:text-[#6f5238]"
        href={value}
        rel="noreferrer"
        target="_blank"
      >
        <span>{value}</span>
        <ExternalLink className="shrink-0" size={14} />
      </a>
    </div>
  )
}
