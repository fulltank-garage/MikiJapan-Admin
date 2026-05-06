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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

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
    if (!isApiConfigured) {
      return {
        token: 'demo-admin-token',
        user: {
          name: 'MikiJapan Admin',
          email: payload.email,
        },
      } satisfies AuthSession
    }

    const { data } = await api.post<AuthSession>('/auth/login', payload)
    return data
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
