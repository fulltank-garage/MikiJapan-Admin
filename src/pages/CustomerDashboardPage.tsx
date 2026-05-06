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
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CustomerFormModal } from '../components/CustomerFormModal'
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

const segmentMeta: Record<CustomerSegment, string> = {
  VIP: 'border-teal-200 bg-teal-50 text-teal-700',
  Regular: 'border-sky-200 bg-sky-50 text-sky-700',
  New: 'border-rose-200 bg-rose-50 text-rose-700',
}

type CustomerDashboardPageProps = {
  onLogout: () => void
  onOpenMessages: () => void
  session: AuthSession
}

export function CustomerDashboardPage({
  onLogout,
  onOpenMessages,
  session,
}: CustomerDashboardPageProps) {
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

            <CustomerTable
              customers={filteredCustomers}
              isLoading={isLoadingCustomers}
              onDelete={handleDeleteCustomer}
              onEdit={openEditForm}
            />
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

type CustomerTableProps = {
  customers: Customer[]
  isLoading: boolean
  onDelete: (customer: Customer) => void
  onEdit: (customer: Customer) => void
}

function CustomerTable({
  customers,
  isLoading,
  onDelete,
  onEdit,
}: CustomerTableProps) {
  return (
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
          {isLoading ? (
            <tr>
              <td
                className="px-5 py-10 text-center text-sm text-slate-500"
                colSpan={8}
              >
                กำลังโหลดข้อมูลลูกค้า
              </td>
            </tr>
          ) : null}

          {!isLoading && customers.length === 0 ? (
            <tr>
              <td
                className="px-5 py-10 text-center text-sm text-slate-500"
                colSpan={8}
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
                      onClick={() => onEdit(customer)}
                      title="แก้ไข"
                      type="button"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onDelete(customer)}
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
  )
}
