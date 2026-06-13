export interface Permission {
  id: number
  name: string
  label: string
  guard_name: string
}

export interface Customer {
  id: number
  name: string
  email: string
  phone: string | null
  address: string | null
  points: number
  created_at: string | null
}

export interface User {
  id: number
  role_id: number | null
  role_name: string | null
  role_code: string | null
  name: string
  username: string | null
  email: string
  phone: string | null
  address: string | null
  nrc: string | null
  profile_photo: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  permissions?: Permission[]
  customer?: Customer | null
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  address: string
  password: string
  password_confirmation: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  token_type: string
}
