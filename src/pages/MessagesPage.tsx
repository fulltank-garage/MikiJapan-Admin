import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  IdCard,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AuthSession } from '../services/api'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'

type CustomerApplication = {
  id: string
  fullName: string
  nickname: string
  phone: string
  citizenId: string
  shopLink: string
  pageLink: string
  status: ApplicationStatus
}

type MessagesPageProps = {
  onBackToDashboard: () => void
  onLogout: () => void
  session: AuthSession
}

const applications: CustomerApplication[] = [
  {
    id: 'app-1001',
    fullName: 'Sakura Tanaka',
    nickname: 'Sakura',
    phone: '+81 90 1122 4588',
    citizenId: '1101700458899',
    shopLink: 'https://shop.example.com/sakura-store',
    pageLink: 'https://facebook.com/sakura.store',
    status: 'pending',
  },
  {
    id: 'app-1002',
    fullName: 'Nattapong Srisawat',
    nickname: 'Pong',
    phone: '+66 81 445 9081',
    citizenId: '1103700459081',
    shopLink: 'https://shop.example.com/pong-market',
    pageLink: 'https://facebook.com/pong.market',
    status: 'pending',
  },
  {
    id: 'app-1003',
    fullName: 'Mika Kobayashi',
    nickname: 'Mika',
    phone: '+81 80 7720 1190',
    citizenId: '1105700772119',
    shopLink: 'https://shop.example.com/mika-select',
    pageLink: 'https://facebook.com/mika.select',
    status: 'approved',
  },
  {
    id: 'app-1004',
    fullName: 'Chanita Prasert',
    nickname: 'Nan',
    phone: '+66 92 780 4412',
    citizenId: '1109700784412',
    shopLink: 'https://shop.example.com/nan-beauty',
    pageLink: 'https://facebook.com/nan.beauty',
    status: 'rejected',
  },
]

const statusMeta: Record<
  ApplicationStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: 'รอตรวจสอบ',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  approved: {
    label: 'ยืนยันแล้ว',
    className: 'border-teal-200 bg-teal-50 text-teal-700',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'ปฏิเสธแล้ว',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: XCircle,
  },
}

export function MessagesPage({
  onBackToDashboard,
  onLogout,
  session,
}: MessagesPageProps) {
  const [customerApplications, setCustomerApplications] =
    useState(applications)
  const [query, setQuery] = useState('')
  const [selectedApplicationId, setSelectedApplicationId] = useState(
    customerApplications[0].id,
  )

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return customerApplications
    }

    return customerApplications.filter((application) =>
      [
        application.fullName,
        application.nickname,
        application.phone,
        application.citizenId,
        application.shopLink,
        application.pageLink,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [customerApplications, query])

  const selectedApplication =
    filteredApplications.find(
      (application) => application.id === selectedApplicationId,
    ) ||
    filteredApplications[0] ||
    customerApplications[0]

  const updateApplicationStatus = (status: ApplicationStatus) => {
    setCustomerApplications((current) =>
      current.map((application) =>
        application.id === selectedApplication.id
          ? { ...application, status }
          : application,
      ),
    )
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
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
            onClick={onBackToDashboard}
            type="button"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
            onClick={onBackToDashboard}
            type="button"
          >
            <UsersRound size={18} />
            Customers
          </button>
          <button
            className="flex h-11 w-full items-center gap-3 rounded-lg bg-white/12 px-3 text-left text-sm font-medium text-white"
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
                title="Menu"
                type="button"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm font-medium text-teal-700">
                  Customer Applications
                </p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  ข้อมูลการสมัครของลูกค้า
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={onBackToDashboard}
                type="button"
              >
                <LayoutDashboard size={17} />
                Dashboard
              </button>
              <button
                className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                onClick={onLogout}
                title="Logout"
                type="button"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  รายการสมัคร
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredApplications.length} รายการ
                </p>
              </div>

              <label className="relative block min-w-0 xl:w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาข้อมูลการสมัคร"
                  value={query}
                />
              </label>
            </div>

            <div className="grid min-h-[34rem] xl:grid-cols-[minmax(360px,0.88fr)_1.12fr]">
              <div className="border-b border-slate-200 xl:border-b-0 xl:border-r">
                <div className="divide-y divide-slate-100">
                  {filteredApplications.map((application) => (
                    <button
                      className={`block w-full px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 ${
                        selectedApplication.id === application.id
                          ? 'bg-teal-50/70'
                          : ''
                      }`}
                      key={application.id}
                      onClick={() => setSelectedApplicationId(application.id)}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                          <UserRound size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-950">
                            {application.fullName}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {application.nickname} · {application.phone}
                          </p>
                        </div>
                        <ApplicationStatusBadge status={application.status} />
                      </div>
                    </button>
                  ))}

                  {filteredApplications.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                      ไม่พบข้อมูลการสมัคร
                    </div>
                  ) : null}
                </div>
              </div>

              <article className="p-5">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-700">
                      Application Detail
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      {selectedApplication.fullName}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ApplicationStatusBadge
                      status={selectedApplication.status}
                    />
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={selectedApplication.status === 'approved'}
                      onClick={() => updateApplicationStatus('approved')}
                      type="button"
                    >
                      <CheckCircle2 size={17} />
                      ยืนยันการสมัคร
                    </button>
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={selectedApplication.status === 'rejected'}
                      onClick={() => updateApplicationStatus('rejected')}
                      type="button"
                    >
                      <XCircle size={17} />
                      ปฏิเสธการสมัคร
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    icon={UserRound}
                    label="ชื่อนามสกุล"
                    value={selectedApplication.fullName}
                  />
                  <InfoItem
                    icon={UserRound}
                    label="ชื่อเล่น"
                    value={selectedApplication.nickname}
                  />
                  <InfoItem
                    icon={Phone}
                    label="เบอร์โทร"
                    value={selectedApplication.phone}
                  />
                  <InfoItem
                    icon={IdCard}
                    label="เลขบัตรประชาชน"
                    value={selectedApplication.citizenId}
                  />
                  <LinkItem
                    icon={Store}
                    label="ลิงก์ร้าน"
                    value={selectedApplication.shopLink}
                  />
                  <LinkItem
                    icon={Link2}
                    label="ลิงก์เพจ"
                    value={selectedApplication.pageLink}
                  />
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

type InfoItemProps = {
  icon: typeof UserRound
  label: string
  value: string
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon size={17} />
        {label}
      </div>
      <p className="break-words text-base font-semibold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function LinkItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon size={17} />
        {label}
      </div>
      <a
        className="inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-teal-700 hover:text-teal-800"
        href={value}
        rel="noreferrer"
        target="_blank"
      >
        <span>{value}</span>
        <ExternalLink className="shrink-0" size={15} />
      </a>
    </div>
  )
}

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = statusMeta[status]
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  )
}
