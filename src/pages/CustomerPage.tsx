import {
  CheckCircle2,
  Edit3,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CustomerFormModal } from '../components/CustomerFormModal'
import { MobileAdminMenu } from '../components/MobileAdminMenu'
import { StatusBadge } from '../components/StatusBadge'
import type { CustomerDraft } from '../components/TextField'
import { customerSeed } from '../data/customerSeed'
import {
  customerApi,
  isApiConfigured,
  type AuthSession,
  type Customer,
  type CustomerSegment,
  type CustomerStatus,
} from '../services/api'
import { moneyFormatter, numberFormatter } from '../utils/formatters'

type StatusFilter = CustomerStatus | 'all'

type CustomerPageProps = {
  onLogout: () => void
  onOpenDashboard: () => void
  onOpenMessages: () => void
  session: AuthSession
}

const segmentMeta: Record<CustomerSegment, string> = {
  VIP: 'border-[#d8c1a8] bg-[#fbf1e7] text-[#8f6847]',
  Regular: 'border-[#dfcbb8] bg-[#f7eadc] text-[#8f6847]',
  New: 'border-[#d8b8a7] bg-[#f8eee8] text-[#9a5f45]',
}

export function CustomerPage({
  onLogout,
  onOpenDashboard,
  onOpenMessages,
  session,
}: CustomerPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(customerSeed)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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

  const customerSummary = useMemo(() => {
    const active = customers.filter(
      (customer) => customer.status === 'active',
    ).length
    const pending = customers.filter(
      (customer) => customer.status === 'pending',
    ).length
    const totalSpent = customers.reduce(
      (sum, customer) => sum + customer.totalSpent,
      0,
    )

    return { active, pending, totalSpent }
  }, [customers])

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCustomer(null)
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

      closeForm()
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
    <div className="min-h-screen bg-[#fbf6f0] text-slate-900">
      <MobileAdminMenu
        activePage="customers"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenCustomers={() => setIsMobileMenuOpen(false)}
        onOpenDashboard={onOpenDashboard}
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
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#f5dfc8] transition hover:bg-white/10 hover:text-white"
            onClick={onOpenDashboard}
            type="button"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button className="flex h-11 w-full items-center gap-3 rounded-lg bg-[#f7eadc]/18 px-3 text-left text-sm font-medium text-white">
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
                  Customer Page
                </p>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                  จัดการข้อมูลลูกค้า
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
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="ลูกค้าทั้งหมด"
              value={numberFormatter.format(customers.length)}
            />
            <SummaryCard
              label="ลูกค้าใช้งาน"
              value={numberFormatter.format(customerSummary.active)}
            />
            <SummaryCard
              label="ยอดใช้จ่ายรวม"
              value={moneyFormatter.format(customerSummary.totalSpent)}
            />
          </section>

          <section className="mt-6 rounded-lg border border-[#ead8c7] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#ead8c7] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Customer List
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  แสดง {numberFormatter.format(filteredCustomers.length)} รายการ
                  และมี {numberFormatter.format(customerSummary.pending)} รายการที่รอติดตาม
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block min-w-0 sm:w-72">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    className="h-11 w-full rounded-lg border border-[#dbc6b2] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#9a7655] focus:ring-4 focus:ring-[#f1dfcd]"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ค้นหาชื่อ อีเมล เบอร์โทร"
                    value={query}
                  />
                </label>

                <select
                  className="h-11 rounded-lg border border-[#dbc6b2] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#9a7655] focus:ring-4 focus:ring-[#f1dfcd]"
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

              </div>
            </div>

            {notice ? (
              <div className="border-b border-[#ead8c7] bg-[#fbf1e7] px-5 py-3 text-sm text-[#6f5238]">
                {notice}
              </div>
            ) : null}

            <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
              {isLoadingCustomers ? (
                <p className="rounded-lg border border-[#ead8c7] bg-[#fff8f1] p-6 text-center text-sm text-slate-500 xl:col-span-2">
                  กำลังโหลดข้อมูลลูกค้า
                </p>
              ) : null}

              {!isLoadingCustomers && filteredCustomers.length === 0 ? (
                <p className="rounded-lg border border-[#ead8c7] bg-[#fff8f1] p-6 text-center text-sm text-slate-500 xl:col-span-2">
                  ไม่พบข้อมูลที่ค้นหา
                </p>
              ) : null}

              {!isLoadingCustomers &&
                filteredCustomers.map((customer) => (
                  <article
                    className="rounded-lg border border-[#ead8c7] bg-white p-5 shadow-sm"
                    key={customer.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#f3e8dd] text-slate-600">
                          <UserRound size={22} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {customer.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={customer.status} />
                    </div>

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <CustomerDetail label="เบอร์โทร" value={customer.phone} />
                      <CustomerDetail label="ประเทศ" value={customer.country} />
                      <CustomerDetail
                        label="คำสั่งซื้อ"
                        value={numberFormatter.format(customer.totalOrders)}
                      />
                      <CustomerDetail
                        label="ยอดใช้จ่าย"
                        value={moneyFormatter.format(customer.totalSpent)}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ead8c7] pt-4">
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${segmentMeta[customer.segment]}`}
                        >
                          {customer.segment}
                        </span>
                        <p className="mt-2 text-sm text-slate-500">
                          ล่าสุด: {customer.lastContact}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="grid size-9 place-items-center rounded-lg border border-[#ead8c7] bg-white text-slate-600 transition hover:border-[#d8c1a8] hover:bg-[#fbf1e7] hover:text-[#8f6847]"
                          onClick={() => openEditForm(customer)}
                          title="แก้ไข"
                          type="button"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="grid size-9 place-items-center rounded-lg border border-[#ead8c7] bg-white text-slate-600 transition hover:border-[#d8b8a7] hover:bg-[#f8eee8] hover:text-[#9a5f45]"
                          onClick={() => handleDeleteCustomer(customer)}
                          title="ลบ"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {customer.note ? (
                      <p className="mt-4 rounded-lg bg-[#fff8f1] px-3 py-2 text-sm text-slate-600">
                        {customer.note}
                      </p>
                    ) : null}
                  </article>
                ))}
            </div>
          </section>
        </main>
      </div>

      {isFormOpen ? (
        <CustomerFormModal
          customer={editingCustomer}
          isSaving={isSaving}
          onClose={closeForm}
          onSubmit={handleSaveCustomer}
        />
      ) : null}
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

function CustomerDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fff8f1] px-3 py-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  )
}
