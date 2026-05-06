import {
  Bell,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  authApi,
  customerApi,
  isApiConfigured,
  type AuthSession,
  type Customer,
  type CustomerSegment,
  type CustomerStatus,
  type LoginPayload,
} from './services/api'

type CustomerDraft = Omit<Customer, 'id'>
type StatusFilter = CustomerStatus | 'all'

const customerSeed: Customer[] = [
  {
    id: 'cus-1001',
    name: 'Sakura Tanaka',
    email: 'sakura.t@example.com',
    phone: '+81 90 1122 4588',
    country: 'Japan',
    segment: 'VIP',
    status: 'active',
    totalOrders: 28,
    totalSpent: 245000,
    lastContact: '2026-04-29',
    note: 'สนใจแพ็กเกจดูแลรายเดือน',
  },
  {
    id: 'cus-1002',
    name: 'Nattapong S.',
    email: 'nattapong@example.com',
    phone: '+66 81 445 9081',
    country: 'Thailand',
    segment: 'Regular',
    status: 'pending',
    totalOrders: 11,
    totalSpent: 88500,
    lastContact: '2026-05-02',
    note: 'รอเอกสารยืนยันจากลูกค้า',
  },
  {
    id: 'cus-1003',
    name: 'Mika Kobayashi',
    email: 'mika.k@example.com',
    phone: '+81 80 7720 1190',
    country: 'Japan',
    segment: 'New',
    status: 'active',
    totalOrders: 4,
    totalSpent: 31200,
    lastContact: '2026-05-04',
    note: 'เริ่มใช้งานจากแคมเปญล่าสุด',
  },
  {
    id: 'cus-1004',
    name: 'Chanita P.',
    email: 'chanita@example.com',
    phone: '+66 92 780 4412',
    country: 'Thailand',
    segment: 'Regular',
    status: 'inactive',
    totalOrders: 7,
    totalSpent: 53900,
    lastContact: '2026-03-18',
    note: 'ควรติดตามใหม่ในไตรมาสหน้า',
  },
  {
    id: 'cus-1005',
    name: 'Daichi Mori',
    email: 'daichi.m@example.com',
    phone: '+81 70 6234 0198',
    country: 'Japan',
    segment: 'VIP',
    status: 'pending',
    totalOrders: 19,
    totalSpent: 174200,
    lastContact: '2026-05-01',
    note: 'กำลังพิจารณาขยายสัญญา',
  },
]

const statusMeta: Record<
  CustomerStatus,
  { label: string; className: string; dotClassName: string }
> = {
  active: {
    label: 'ใช้งาน',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  },
  pending: {
    label: 'รอติดตาม',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
  },
  inactive: {
    label: 'พักการใช้งาน',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    dotClassName: 'bg-slate-400',
  },
}

const segmentMeta: Record<CustomerSegment, string> = {
  VIP: 'border-teal-200 bg-teal-50 text-teal-700',
  Regular: 'border-sky-200 bg-sky-50 text-sky-700',
  New: 'border-rose-200 bg-rose-50 text-rose-700',
}

const moneyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('th-TH')

const emptyCustomer = (): CustomerDraft => ({
  name: '',
  email: '',
  phone: '',
  country: 'Thailand',
  segment: 'New',
  status: 'active',
  totalOrders: 0,
  totalSpent: 0,
  lastContact: new Date().toISOString().slice(0, 10),
  note: '',
})

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

  const handleLogin = (nextSession: AuthSession) => {
    localStorage.setItem('admin_token', nextSession.token)
    localStorage.setItem('admin_session', JSON.stringify(nextSession))
    setSession(nextSession)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_session')
    setSession(null)
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return <Dashboard onLogout={handleLogout} session={session} />
}

function LoginScreen({
  onLogin,
}: {
  onLogin: (session: AuthSession) => void
}) {
  const [payload, setPayload] = useState<LoginPayload>({
    email: 'admin@mikijapan.co',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!payload.email || !payload.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    try {
      setIsLoading(true)
      const nextSession = await authApi.login(payload)
      onLogin(nextSession)
    } catch {
      setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f6f8] text-slate-900 lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <section className="flex min-h-[36rem] flex-col justify-between bg-[#18202b] px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-12">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-teal-400 text-[#18202b]">
            <ShieldCheck size={24} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-100">MikiJapan</p>
            <h1 className="text-2xl font-semibold">Admin Console</h1>
          </div>
        </div>

        <div className="max-w-xl py-14">
          <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-teal-50">
            Customer Operations
          </p>
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
            จัดการข้อมูลลูกค้าได้ในที่เดียว
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['1,248', 'ลูกค้า'],
              ['94%', 'ติดตามสำเร็จ'],
              ['24 ชม.', 'ตอบกลับเฉลี่ย'],
            ].map(([value, label]) => (
              <div
                className="rounded-lg border border-white/12 bg-white/8 p-4"
                key={label}
              >
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-sm text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-400">
          Secured workspace for MikiJapan admin team
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <form
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="mb-8">
            <p className="text-sm font-medium text-teal-700">เข้าสู่ระบบ</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Admin Login
            </h2>
          </div>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              อีเมล
            </span>
            <input
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="admin@mikijapan.co"
              type="email"
              value={payload.email}
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              รหัสผ่าน
            </span>
            <input
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="กรอกรหัสผ่าน"
              type="password"
              value={payload.password}
            />
          </label>

          {error ? (
            <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#18202b] px-4 font-semibold text-white transition hover:bg-[#273242] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            <ShieldCheck size={18} />
            {isLoading ? 'กำลังเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </section>
    </main>
  )
}

function Dashboard({
  onLogout,
  session,
}: {
  onLogout: () => void
  session: AuthSession
}) {
  const [customers, setCustomers] = useState<Customer[]>(customerSeed)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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

    return customers.filter((customer) => {
      const matchesStatus =
        statusFilter === 'all' || customer.status === statusFilter
      const matchesQuery =
        !normalizedQuery ||
        [
          customer.name,
          customer.email,
          customer.phone,
          customer.country,
          customer.segment,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [customers, query, statusFilter])

  const stats = useMemo(() => {
    const totalSpent = customers.reduce(
      (sum, customer) => sum + customer.totalSpent,
      0,
    )
    const totalOrders = customers.reduce(
      (sum, customer) => sum + customer.totalOrders,
      0,
    )
    const pending = customers.filter(
      (customer) => customer.status === 'pending',
    ).length

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
      {
        label: 'รอติดตาม',
        value: numberFormatter.format(pending),
        helper: 'ต้องดำเนินการ',
        icon: Bell,
        className: 'bg-amber-50 text-amber-700',
      },
    ]
  }, [customers])

  const openCreateForm = () => {
    setEditingCustomer(null)
    setIsFormOpen(true)
  }

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsFormOpen(true)
  }

  const handleSaveCustomer = async (draft: CustomerDraft) => {
    setIsSaving(true)
    setNotice('')

    try {
      if (editingCustomer) {
        const updatedCustomer = isApiConfigured
          ? await customerApi.update(editingCustomer.id, draft)
          : { ...draft, id: editingCustomer.id }

        setCustomers((current) =>
          current.map((customer) =>
            customer.id === editingCustomer.id ? updatedCustomer : customer,
          ),
        )
        setNotice('อัปเดตข้อมูลลูกค้าแล้ว')
      } else {
        const createdCustomer = isApiConfigured
          ? await customerApi.create(draft)
          : { ...draft, id: crypto.randomUUID() }

        setCustomers((current) => [createdCustomer, ...current])
        setNotice('เพิ่มลูกค้าใหม่แล้ว')
      }

      setIsFormOpen(false)
      setEditingCustomer(null)
    } catch {
      setNotice('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmed = window.confirm(`ลบข้อมูลของ ${customer.name} หรือไม่?`)

    if (!confirmed) {
      return
    }

    setNotice('')

    try {
      if (isApiConfigured) {
        await customerApi.remove(customer.id)
      }

      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id),
      )
      setNotice('ลบข้อมูลลูกค้าแล้ว')
    } catch {
      setNotice('ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
  }

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
          <button className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white">
            <UsersRound size={18} />
            Customers
          </button>
          <button className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white">
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
                  className={isApiConfigured ? 'text-emerald-600' : 'text-amber-600'}
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
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                <label className="relative block min-w-0 sm:w-72">
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

                <select
                  className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  value={statusFilter}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="active">ใช้งาน</option>
                  <option value="pending">รอติดตาม</option>
                  <option value="inactive">พักการใช้งาน</option>
                </select>

                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18202b] px-4 text-sm font-semibold text-white transition hover:bg-[#273242]"
                  onClick={openCreateForm}
                  type="button"
                >
                  <Plus size={18} />
                  เพิ่มลูกค้า
                </button>
              </div>
            </div>

            {notice ? (
              <div className="border-b border-slate-200 bg-teal-50 px-5 py-3 text-sm text-teal-800">
                {notice}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">ลูกค้า</th>
                    <th className="px-5 py-3">ติดต่อ</th>
                    <th className="px-5 py-3">กลุ่ม</th>
                    <th className="px-5 py-3">สถานะ</th>
                    <th className="px-5 py-3 text-right">คำสั่งซื้อ</th>
                    <th className="px-5 py-3 text-right">ยอดใช้จ่าย</th>
                    <th className="px-5 py-3">ติดต่อล่าสุด</th>
                    <th className="px-5 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingCustomers ? (
                    <tr>
                      <td
                        className="px-5 py-10 text-center text-sm text-slate-500"
                        colSpan={8}
                      >
                        กำลังโหลดข้อมูลลูกค้า
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingCustomers && filteredCustomers.length === 0 ? (
                    <tr>
                      <td
                        className="px-5 py-10 text-center text-sm text-slate-500"
                        colSpan={8}
                      >
                        ไม่พบข้อมูลที่ค้นหา
                      </td>
                    </tr>
                  ) : null}

                  {!isLoadingCustomers &&
                    filteredCustomers.map((customer) => (
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
                          <p className="text-sm text-slate-900">
                            {customer.email}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {customer.phone}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${segmentMeta[customer.segment]}`}
                          >
                            {customer.segment}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={customer.status} />
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
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                              onClick={() => openEditForm(customer)}
                              title="แก้ไข"
                              type="button"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => handleDeleteCustomer(customer)}
                              title="ลบ"
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {isFormOpen ? (
        <CustomerFormModal
          customer={editingCustomer}
          isSaving={isSaving}
          onClose={() => {
            setIsFormOpen(false)
            setEditingCustomer(null)
          }}
          onSubmit={handleSaveCustomer}
        />
      ) : null}
    </div>
  )
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  const meta = statusMeta[status]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      <span className={`size-2 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  )
}

function CustomerFormModal({
  customer,
  isSaving,
  onClose,
  onSubmit,
}: {
  customer: Customer | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (draft: CustomerDraft) => Promise<void>
}) {
  const [form, setForm] = useState<CustomerDraft>(() =>
    customer
      ? {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          country: customer.country,
          segment: customer.segment,
          status: customer.status,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          lastContact: customer.lastContact,
          note: customer.note,
        }
      : emptyCustomer(),
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(form)
  }

  const updateField = (
    name: keyof CustomerDraft,
    value: string | number,
  ) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <form
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-teal-700">
              {customer ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล'}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {customer ? customer.name : 'ลูกค้าใหม่'}
            </h2>
          </div>
          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
            title="ปิด"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <TextField
            label="ชื่อลูกค้า"
            name="name"
            onChange={updateField}
            required
            value={form.name}
          />
          <TextField
            label="อีเมล"
            name="email"
            onChange={updateField}
            required
            type="email"
            value={form.email}
          />
          <TextField
            label="เบอร์โทร"
            name="phone"
            onChange={updateField}
            required
            value={form.phone}
          />
          <TextField
            label="ประเทศ"
            name="country"
            onChange={updateField}
            required
            value={form.country}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              กลุ่มลูกค้า
            </span>
            <select
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              onChange={(event) =>
                updateField('segment', event.target.value as CustomerSegment)
              }
              value={form.segment}
            >
              <option value="VIP">VIP</option>
              <option value="Regular">Regular</option>
              <option value="New">New</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              สถานะ
            </span>
            <select
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              onChange={(event) =>
                updateField('status', event.target.value as CustomerStatus)
              }
              value={form.status}
            >
              <option value="active">ใช้งาน</option>
              <option value="pending">รอติดตาม</option>
              <option value="inactive">พักการใช้งาน</option>
            </select>
          </label>

          <TextField
            label="จำนวนคำสั่งซื้อ"
            min={0}
            name="totalOrders"
            onChange={updateField}
            required
            type="number"
            value={form.totalOrders}
          />
          <TextField
            label="ยอดใช้จ่าย"
            min={0}
            name="totalSpent"
            onChange={updateField}
            required
            type="number"
            value={form.totalSpent}
          />
          <TextField
            label="ติดต่อล่าสุด"
            name="lastContact"
            onChange={updateField}
            required
            type="date"
            value={form.lastContact}
          />
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              หมายเหตุ
            </span>
            <textarea
              className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              onChange={(event) => updateField('note', event.target.value)}
              value={form.note}
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18202b] px-4 text-sm font-semibold text-white transition hover:bg-[#273242] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            <CheckCircle2 size={18} />
            {isSaving ? 'กำลังบันทึก' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  )
}

function TextField({
  label,
  min,
  name,
  onChange,
  required,
  type = 'text',
  value,
}: {
  label: string
  min?: number
  name: keyof CustomerDraft
  onChange: (name: keyof CustomerDraft, value: string | number) => void
  required?: boolean
  type?: 'date' | 'email' | 'number' | 'text'
  value: string | number
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        min={min}
        onChange={(event) =>
          onChange(
            name,
            type === 'number'
              ? Number(event.target.value)
              : event.target.value,
          )
        }
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}

export default App
