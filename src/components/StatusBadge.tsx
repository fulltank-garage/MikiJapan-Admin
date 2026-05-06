import type { CustomerStatus } from '../services/api'

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

export function StatusBadge({ status }: { status: CustomerStatus }) {
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
