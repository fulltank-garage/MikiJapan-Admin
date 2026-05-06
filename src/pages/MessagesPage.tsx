import {
  Archive,
  Bell,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Star,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AuthSession } from '../services/api'

type MessageStatus = 'open' | 'pending' | 'closed'
type MessagePriority = 'high' | 'normal'

type MessageThread = {
  id: string
  customerName: string
  email: string
  subject: string
  preview: string
  channel: string
  status: MessageStatus
  priority: MessagePriority
  lastMessageAt: string
  unread: number
}

type MessagesPageProps = {
  onBackToDashboard: () => void
  onLogout: () => void
  onOpenCustomers: () => void
  session: AuthSession
}

const messageThreads: MessageThread[] = [
  {
    id: 'msg-1001',
    customerName: 'Sakura Tanaka',
    email: 'sakura.t@example.com',
    subject: 'Monthly care package renewal',
    preview: 'Customer asked for the updated renewal quote and delivery date.',
    channel: 'Email',
    status: 'open',
    priority: 'high',
    lastMessageAt: '2026-05-06 09:42',
    unread: 3,
  },
  {
    id: 'msg-1002',
    customerName: 'Nattapong S.',
    email: 'nattapong@example.com',
    subject: 'Document verification follow-up',
    preview: 'Waiting for confirmation documents before approving the order.',
    channel: 'LINE',
    status: 'pending',
    priority: 'normal',
    lastMessageAt: '2026-05-05 16:18',
    unread: 1,
  },
  {
    id: 'msg-1003',
    customerName: 'Mika Kobayashi',
    email: 'mika.k@example.com',
    subject: 'Campaign onboarding question',
    preview: 'Asked whether the campaign benefit applies to new accounts.',
    channel: 'Email',
    status: 'open',
    priority: 'normal',
    lastMessageAt: '2026-05-05 11:03',
    unread: 0,
  },
  {
    id: 'msg-1004',
    customerName: 'Daichi Mori',
    email: 'daichi.m@example.com',
    subject: 'Contract extension options',
    preview: 'Shared requirements for a larger service contract next quarter.',
    channel: 'Phone',
    status: 'closed',
    priority: 'high',
    lastMessageAt: '2026-05-04 14:25',
    unread: 0,
  },
]

const statusMeta: Record<
  MessageStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  open: {
    label: 'Open',
    className: 'border-teal-200 bg-teal-50 text-teal-700',
    icon: MessageCircle,
  },
  pending: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  closed: {
    label: 'Closed',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    icon: CheckCircle2,
  },
}

export function MessagesPage({
  onBackToDashboard,
  onLogout,
  onOpenCustomers,
  session,
}: MessagesPageProps) {
  const [query, setQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<MessageStatus | 'all'>(
    'all',
  )
  const [selectedThreadId, setSelectedThreadId] = useState(messageThreads[0].id)

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return messageThreads.filter((thread) => {
      const matchesStatus =
        selectedStatus === 'all' || thread.status === selectedStatus
      const matchesQuery =
        !normalizedQuery ||
        [
          thread.customerName,
          thread.email,
          thread.subject,
          thread.preview,
          thread.channel,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [query, selectedStatus])

  const selectedThread =
    filteredThreads.find((thread) => thread.id === selectedThreadId) ||
    filteredThreads[0] ||
    messageThreads[0]

  const stats = [
    {
      label: 'Unread',
      value: messageThreads.reduce((sum, thread) => sum + thread.unread, 0),
      helper: 'Messages needing review',
      icon: Bell,
      className: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Open',
      value: messageThreads.filter((thread) => thread.status === 'open').length,
      helper: 'Active conversations',
      icon: MessageCircle,
      className: 'bg-teal-50 text-teal-700',
    },
    {
      label: 'High Priority',
      value: messageThreads.filter((thread) => thread.priority === 'high')
        .length,
      helper: 'Important follow-ups',
      icon: Star,
      className: 'bg-rose-50 text-rose-700',
    },
    {
      label: 'Closed',
      value: messageThreads.filter((thread) => thread.status === 'closed')
        .length,
      helper: 'Resolved threads',
      icon: Archive,
      className: 'bg-slate-100 text-slate-700',
    },
  ]

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
            onClick={onOpenCustomers}
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
                  Message Center
                </p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  Messages
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

          <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search messages"
                      value={query}
                    />
                  </label>

                  <select
                    className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    onChange={(event) =>
                      setSelectedStatus(
                        event.target.value as MessageStatus | 'all',
                      )
                    }
                    value={selectedStatus}
                  >
                    <option value="all">All status</option>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredThreads.map((thread) => (
                  <button
                    className={`block w-full px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 ${
                      selectedThread.id === thread.id ? 'bg-teal-50/70' : ''
                    }`}
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">
                          {thread.customerName}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {thread.subject}
                        </p>
                      </div>
                      {thread.unread > 0 ? (
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                          {thread.unread}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {thread.preview}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusPill status={thread.status} />
                      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {thread.channel}
                      </span>
                      {thread.priority === 'high' ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          High priority
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}

                {filteredThreads.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    No messages found.
                  </div>
                ) : null}
              </div>
            </div>

            <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-teal-700">
                      {selectedThread.channel}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      {selectedThread.subject}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedThread.customerName} · {selectedThread.email}
                    </p>
                  </div>
                  <StatusPill status={selectedThread.status} />
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="max-w-2xl rounded-lg bg-slate-100 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {selectedThread.customerName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedThread.preview} Please review the account history
                    and prepare the next response for the customer.
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    {selectedThread.lastMessageAt}
                  </p>
                </div>

                <div className="ml-auto max-w-2xl rounded-lg bg-[#18202b] p-4 text-white">
                  <p className="text-sm font-semibold">MikiJapan Admin</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Thanks for the details. We are checking your account and
                    will follow up with the next step shortly.
                  </p>
                  <p className="mt-3 text-xs text-slate-400">Draft response</p>
                </div>
              </div>

              <div className="border-t border-slate-200 p-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Reply
                  </span>
                  <textarea
                    className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    placeholder="Type a reply..."
                  />
                </label>
                <div className="mt-4 flex justify-end">
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18202b] px-4 text-sm font-semibold text-white transition hover:bg-[#273242]"
                    type="button"
                  >
                    <Send size={18} />
                    Send reply
                  </button>
                </div>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: MessageStatus }) {
  const meta = statusMeta[status]
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  )
}
