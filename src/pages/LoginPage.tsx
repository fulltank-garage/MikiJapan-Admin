import { ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { authApi, type AuthSession, type LoginPayload } from '../services/api'

type LoginPageProps = {
  onLogin: (session: AuthSession) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
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
