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
  UserRound,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { MobileAdminMenu } from '../components/MobileAdminMenu'
import {
  applicationApi,
  isApiConfigured,
  subscribeApplicationEvents,
  type ApplicationStatus,
  type AuthSession,
  type MemberApplicationEvent,
  type MemberApplication,
  type RealtimeStatus,
} from '../services/api'

type MessagesPageProps = {
  onBackToDashboard: () => void
  onLogout: () => void
  onOpenCustomers: () => void
  session: AuthSession
}

const statusMeta: Record<
  ApplicationStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: 'รอตรวจสอบ',
    className: 'border-[#e6d0b8] bg-[#fff8f1] text-[#9a7655]',
    icon: Clock3,
  },
  approved: {
    label: 'ยืนยันแล้ว',
    className: 'border-[#d8c1a8] bg-[#fbf1e7] text-[#8f6847]',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'ปฏิเสธแล้ว',
    className: 'border-[#d8b8a7] bg-[#f8eee8] text-[#9a5f45]',
    icon: XCircle,
  },
}

const getApplicationFullName = (application: MemberApplication) =>
  `${application.firstName} ${application.lastName}`.trim()

const getStorefrontImageUrl = (application: MemberApplication) =>
  application.storefrontImageUrl || application.storefrontImage || ''

const upsertApplication = (
  applications: MemberApplication[],
  nextApplication: MemberApplication,
) => {
  const existingIndex = applications.findIndex(
    (application) => application.id === nextApplication.id,
  )

  if (existingIndex === -1) {
    return [nextApplication, ...applications]
  }

  return applications.map((application) =>
    application.id === nextApplication.id ? nextApplication : application,
  )
}

export function MessagesPage({
  onBackToDashboard,
  onLogout,
  onOpenCustomers,
  session,
}: MessagesPageProps) {
  const [customerApplications, setCustomerApplications] =
    useState<MemberApplication[]>([])
  const [query, setQuery] = useState('')
  const [isLoadingApplications, setIsLoadingApplications] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [notice, setNotice] = useState('')
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>('connecting')

  const loadApplications = useCallback(async () => {
    try {
      const data = isApiConfigured ? await applicationApi.list() : []
      const pendingApplications = data.filter(
        (application) => application.status === 'pending',
      )
      setCustomerApplications(data)
      setSelectedApplicationId((current) =>
        pendingApplications.some((application) => application.id === current)
          ? current
          : pendingApplications[0]?.id || '',
      )
    } catch {
      setNotice('โหลดข้อมูลการสมัครจาก API ไม่สำเร็จ')
    } finally {
      setIsLoadingApplications(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadApplications()
    }, 0)

    return () => window.clearTimeout(initialLoadTimer)
  }, [loadApplications])

  useEffect(() => {
    return subscribeApplicationEvents({
      onStatus: setRealtimeStatus,
      onEvent: (event: MemberApplicationEvent) => {
      try {
        if (event.type === 'member_application.created') {
          setCustomerApplications((current) =>
            upsertApplication(current, event.data),
          )
          setSelectedApplicationId((current) => current || event.data.id)
          return
        }

        if (event.type === 'member_application.updated') {
          setCustomerApplications((current) =>
            upsertApplication(current, event.data),
          )
          if (event.data.status !== 'pending') {
            setSelectedApplicationId((current) =>
              current === event.data.id ? '' : current,
            )
          }
          return
        }

        if (event.type === 'member_application.deleted') {
          setCustomerApplications((current) =>
            current.filter((application) => application.id !== event.data.id),
          )
          setSelectedApplicationId((current) =>
            current === event.data.id ? '' : current,
          )
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
      loadApplications()
    }, 10000)

    return () => window.clearInterval(fallbackTimer)
  }, [loadApplications, realtimeStatus])

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const pendingApplications = customerApplications.filter(
      (application) => application.status === 'pending',
    )

    if (!normalizedQuery) {
      return pendingApplications
    }

    return pendingApplications.filter((application) =>
      [
        application.firstName,
        application.lastName,
        application.nickname,
        application.phone,
        application.citizenId,
        application.shopPageUrl,
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
    null

  const updateApplicationStatus = async (status: ApplicationStatus) => {
    if (!selectedApplication) {
      return
    }

    setNotice('')

    try {
      const updatedApplication = isApiConfigured
        ? await applicationApi.updateStatus(selectedApplication.id, status)
        : { ...selectedApplication, status }

      const remainingPendingApplications = customerApplications.filter(
        (application) =>
          application.id !== selectedApplication.id &&
          application.status === 'pending',
      )
      setCustomerApplications((current) =>
        status === 'approved'
          ? current.map((application) =>
              application.id === selectedApplication.id
                ? updatedApplication
                : application,
            )
          : current.filter(
              (application) => application.id !== selectedApplication.id,
            ),
      )
      setSelectedApplicationId(remainingPendingApplications[0]?.id || '')
      setNotice(
        status === 'approved'
          ? 'ยืนยันการสมัครแล้ว ย้ายไปหน้า จัดการข้อมูลลูกค้าแล้ว'
          : 'ปฏิเสธการสมัครแล้ว และลบข้อมูลออกจาก database แล้ว',
      )
    } catch {
      setNotice('อัปเดตสถานะการสมัครไม่สำเร็จ')
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf6f0] text-slate-900">
      <MobileAdminMenu
        activePage="messages"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenCustomers={onOpenCustomers}
        onOpenDashboard={onBackToDashboard}
        onOpenMessages={() => setIsMobileMenuOpen(false)}
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
            onClick={onBackToDashboard}
            type="button"
          >
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
            className="flex h-11 w-full items-center gap-3 rounded-lg bg-[#f7eadc]/18 px-3 text-left text-sm font-medium text-white"
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
                title="Menu"
                type="button"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm font-medium text-[#8f6847]">
                  Customer Applications
                </p>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                  ข้อมูลการสมัครของลูกค้า
                </h1>
              </div>
            </div>

          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-lg border border-[#ead8c7] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#ead8c7] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  รายการสมัคร
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isLoadingApplications
                    ? 'กำลังโหลดข้อมูล'
                    : `${filteredApplications.length} รายการ`}
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
                  placeholder="ค้นหาข้อมูลการสมัคร"
                  value={query}
                />
              </label>
            </div>

            <div className="grid min-h-[34rem] xl:grid-cols-[minmax(360px,0.88fr)_1.12fr]">
              <div className="border-b border-[#ead8c7] xl:border-b-0 xl:border-r">
                <div className="divide-y divide-[#ead8c7]">
                  {filteredApplications.map((application) => (
                    <button
                      className={`block w-full px-4 py-4 text-left transition hover:bg-[#fff8f1] sm:px-5 ${
                        selectedApplication?.id === application.id
                          ? 'bg-[#fbf1e7]/70'
                          : ''
                      }`}
                      key={application.id}
                      onClick={() => setSelectedApplicationId(application.id)}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          alt={`หน้าร้านของ ${getApplicationFullName(application)}`}
                          className="size-12 shrink-0 rounded-lg border border-[#ead8c7] object-cover"
                          src={getStorefrontImageUrl(application)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-950">
                            {getApplicationFullName(application)}
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
                      {isLoadingApplications
                        ? 'กำลังโหลดข้อมูลการสมัคร'
                        : 'ไม่พบข้อมูลการสมัคร'}
                    </div>
                  ) : null}
                </div>
              </div>

              <article className="p-5">
                {selectedApplication ? (
                  <>
                    <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
                        <button
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#9a7655] px-3 text-sm font-semibold text-white transition hover:bg-[#8f6847] disabled:cursor-not-allowed disabled:opacity-55"
                          disabled={selectedApplication.status === 'approved'}
                          onClick={() => updateApplicationStatus('approved')}
                          type="button"
                        >
                          <CheckCircle2 size={17} />
                          ยืนยันการสมัคร
                        </button>
                        <button
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8b8a7] bg-white px-3 text-sm font-semibold text-[#9a5f45] transition hover:bg-[#f8eee8] disabled:cursor-not-allowed disabled:opacity-55"
                          disabled={selectedApplication.status === 'rejected'}
                          onClick={() => updateApplicationStatus('rejected')}
                          type="button"
                        >
                          <XCircle size={17} />
                          ปฏิเสธการสมัคร
                        </button>
                    </div>

                    {notice ? (
                      <p className="mb-4 rounded-lg border border-[#ead8c7] bg-[#fff8f1] px-4 py-3 text-sm font-medium text-[#8f6847]">
                        {notice}
                      </p>
                    ) : null}

                    <div className="mb-5 overflow-hidden rounded-lg border border-[#ead8c7] bg-[#fff8f1]">
                      {getStorefrontImageUrl(selectedApplication) ? (
                        <img
                          alt={`รูปหน้าร้านของ ${getApplicationFullName(selectedApplication)}`}
                          className="h-56 w-full object-cover sm:h-72"
                          src={getStorefrontImageUrl(selectedApplication)}
                        />
                      ) : (
                        <div className="grid h-56 place-items-center px-5 text-center text-sm text-slate-500 sm:h-72">
                          ไม่มีรูปหน้าร้าน
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoItem
                        icon={UserRound}
                        label="ชื่อ"
                        value={selectedApplication.firstName}
                      />
                      <InfoItem
                        icon={UserRound}
                        label="นามสกุล"
                        value={selectedApplication.lastName}
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
                        icon={Link2}
                        label="ลิงก์ร้าน"
                        value={selectedApplication.shopPageUrl}
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid min-h-80 place-items-center rounded-lg border border-[#ead8c7] bg-[#fff8f1] px-5 text-center text-sm text-slate-500">
                    {notice || 'เลือกข้อมูลการสมัครเพื่อดูรายละเอียด'}
                  </div>
                )}
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
    <div className="rounded-lg border border-[#ead8c7] bg-[#fff8f1] p-4">
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
    <div className="rounded-lg border border-[#ead8c7] bg-[#fff8f1] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon size={17} />
        {label}
      </div>
      <a
        className="inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-[#8f6847] hover:text-[#6f5238]"
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
