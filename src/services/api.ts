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

const defaultApiBaseUrl = 'https://mikijapan-api-production.up.railway.app/api'
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

export const applicationApi = {
  async list() {
    const { data } = await api.get<MemberApplication[]>('/members')
    return data
  },

  async updateStatus(id: string, status: ApplicationStatus) {
    const { data } = await api.patch<MemberApplication>(
      `/members/${id}/status`,
      { status },
    )
    return data
  },
}
