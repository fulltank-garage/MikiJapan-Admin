import axios from 'axios'

export type CustomerStatus = 'active' | 'pending' | 'inactive'
export type CustomerSegment = 'VIP' | 'Regular' | 'New'

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  country: string
  segment: CustomerSegment
  status: CustomerStatus
  totalOrders: number
  totalSpent: number
  lastContact: string
  note: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export type MemberApplication = {
  id: string
  firstName: string
  lastName: string
  nickname: string
  phone: string
  citizenId: string
  shopPageUrl: string
  storefrontImage?: string
  storefrontImageUrl?: string
  status: ApplicationStatus
}

export type MemberApplicationEvent = {
  type:
    | 'member_application.created'
    | 'member_application.updated'
    | 'member_application.deleted'
  data: MemberApplication
}

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'off'

export type LoginPayload = {
  email: string
  password: string
}

export type AuthSession = {
  token: string
  user: {
    name: string
    email: string
  }
}

export type PushPublicKeyResponse = {
  configured: boolean
  publicKey: string
}

type ApiErrorData = {
  message?: string
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
) => {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    return error.response?.data?.message || fallback
  }

  return error instanceof Error ? error.message : fallback
}

const defaultApiBaseUrl =
  'https://mikijapan-api-production-7e32.up.railway.app/api'
const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || defaultApiBaseUrl

export const isApiConfigured = Boolean(apiBaseUrl)

export const api = axios.create({
  baseURL: apiBaseUrl || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const authApi = {
  async login(payload: LoginPayload) {
    try {
      const { data } = await api.post<AuthSession>('/auth/login', payload)
      return data
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new Error(
          error.response?.data?.message ??
            'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง',
          { cause: error },
        )
      }

      throw error
    }
  },
}

export const customerApi = {
  async list() {
    const { data } = await api.get<Customer[]>('/customers')
    return data
  },

  async create(customer: Omit<Customer, 'id'>) {
    const { data } = await api.post<Customer>('/customers', customer)
    return data
  },

  async update(id: string, customer: Omit<Customer, 'id'>) {
    const { data } = await api.put<Customer>(`/customers/${id}`, customer)
    return data
  },

  async remove(id: string) {
    await api.delete(`/customers/${id}`)
  },
}

export const memberApi = {
  async list() {
    const { data } = await api.get<MemberApplication[]>('/members')
    return data
  },

  async remove(id: string) {
    await api.delete(`/members/${id}`)
  },
}

export const applicationApi = {
  async list() {
    const { data } = await api.get<MemberApplication[]>('/member-applications')
    return data
  },

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    rejectionReasons?: string[],
  ) {
    const { data } = await api.patch<MemberApplication>(
      `/member-applications/${id}/status`,
      { rejectionReasons, status },
    )
    return data
  },

  async remove(id: string) {
    await api.delete(`/member-applications/${id}`)
  },
}

export const pushNotificationApi = {
  async getPublicKey() {
    try {
      const { data } = await api.get<PushPublicKeyResponse>(
        '/push-notifications/public-key',
      )
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'โหลดข้อมูลแจ้งเตือนไม่สำเร็จ'), {
        cause: error,
      })
    }
  },

  async subscribe(subscription: PushSubscription) {
    try {
      await api.post('/push-notifications/subscriptions', subscription.toJSON())
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'บันทึกการแจ้งเตือนไม่สำเร็จ'), {
        cause: error,
      })
    }
  },

  async unsubscribe(subscription: PushSubscription) {
    await api.delete('/push-notifications/subscriptions', {
      data: {
        endpoint: subscription.endpoint,
      },
    })
  },

  async test(subscription: PushSubscription) {
    try {
      await api.post('/push-notifications/test', {
        endpoint: subscription.endpoint,
      })
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'ทดสอบแจ้งเตือนไม่สำเร็จ'), {
        cause: error,
      })
    }
  },
}

const createApplicationEventsSocket = () => {
  if (!isApiConfigured) {
    return null
  }

  const token = localStorage.getItem('admin_token')
  if (!token) {
    return null
  }

  const baseUrl = new URL(apiBaseUrl)
  baseUrl.protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, '')}/members/events`
  baseUrl.search = ''
  baseUrl.searchParams.set('token', token)

  return new WebSocket(baseUrl.toString())
}

export const subscribeApplicationEvents = ({
  onEvent,
  onStatus,
}: {
  onEvent: (event: MemberApplicationEvent) => void
  onStatus?: (status: RealtimeStatus) => void
}) => {
  let socket: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let retryCount = 0
  let isClosed = false

  const clearRetry = () => {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  const connect = () => {
    if (isClosed) {
      return
    }

    socket = createApplicationEventsSocket()
    if (!socket) {
      onStatus?.('off')
      return
    }

    onStatus?.(retryCount === 0 ? 'connecting' : 'reconnecting')

    socket.onopen = () => {
      retryCount = 0
      onStatus?.('connected')
    }

    socket.onmessage = (message) => {
      onEvent(JSON.parse(message.data) as MemberApplicationEvent)
    }

    socket.onerror = () => {
      socket?.close()
    }

    socket.onclose = () => {
      if (isClosed) {
        return
      }

      retryCount += 1
      onStatus?.('reconnecting')
      const retryDelay = Math.min(1000 * retryCount, 10000)
      retryTimer = setTimeout(connect, retryDelay)
    }
  }

  connect()

  return () => {
    isClosed = true
    clearRetry()
    onStatus?.('off')
    socket?.close()
  }
}
