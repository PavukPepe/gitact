const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// --- Token management ---

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

export function clearTokens() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

// --- Fetch wrapper ---

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return null
    const data = await res.json()
    setTokens(data.access, data.refresh || refresh)
    return data.access
  } catch {
    return null
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`
  let token = getAccessToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res = await fetch(url, { ...options, headers })

  // Token expired — try refresh
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      res = await fetch(url, { ...options, headers })
    } else {
      clearTokens()
      window.location.href = "/login"
      throw new Error("Session expired")
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw { status: res.status, ...errorBody }
  }

  // 204 No Content
  if (res.status === 204) return {} as T

  return res.json()
}

// --- Auth API ---

export interface LoginResponse {
  access: string
  refresh: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  setTokens(data.access, data.refresh)
  return data
}

export async function register(params: {
  email: string
  password: string
  first_name: string
  organization_name?: string
}) {
  return apiFetch("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export async function getProfile() {
  return apiFetch<UserProfile>("/api/auth/me/")
}

export async function updateProfile(data: Partial<UserProfile>) {
  return apiFetch<UserProfile>("/api/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return apiFetch("/api/auth/change-password/", {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  })
}

// --- Types ---

export interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  role: "admin" | "rop" | "manager"
  organization_name: string
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiChat {
  id: number
  client_name: string
  client_email: string
  telegram_username: string
  status: "new" | "in_progress" | "replied" | "closed"
  channel: "widget" | "telegram"
  site: number
  site_name: string
  assigned_manager: number | null
  manager_name: string | null
  last_message: { content: string; timestamp: string; sender_type: string } | null
  unread_count: number
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface ApiMessage {
  id: number
  chat: number
  sender_type: "client" | "manager" | "system"
  sender: number | null
  content: string
  timestamp: string
  files: ApiFile[]
}

export interface ApiFile {
  id: number
  file: string
  filename: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export interface ApiSite {
  id: number
  name: string
  url: string
  site_uuid: string
  widget_settings: Record<string, any>
  working_hours: Record<string, any>
  auto_reply_enabled: boolean
  auto_reply_message: string
  telegram_bot_token: string
  telegram_referral_code: string
  created_at: string
}

export interface ApiManager extends UserProfile {
  is_active: boolean
}

export interface ApiTemplate {
  id: number
  user: number | null
  title: string
  content: string
  hotkey: string
  created_at: string
}

export interface StatsOverview {
  total_chats: number
  active_chats: number
  new_today: number
  closed_total: number
  avg_rating: number | null
  by_channel: Record<string, number>
  by_status: Record<string, number>
}

export interface ManagerStats {
  id: number
  name: string
  email: string
  role: string
  status: string
  total_chats: number
  active_chats: number
  closed_chats: number
  avg_rating: number | null
  ratings_count: number
}

// --- Chats API ---

export async function fetchChats(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : ""
  return apiFetch<PaginatedResponse<ApiChat>>(`/api/chats/${query}`)
}

export async function fetchChat(id: number) {
  return apiFetch<ApiChat & { messages: ApiMessage[] }>(`/api/chats/${id}/`)
}

export async function createChat(data: {
  site: number
  client_name?: string
  client_email?: string
  telegram_username?: string
  channel?: string
  initial_message?: string
}) {
  return apiFetch(`/api/chats/`, { method: "POST", body: JSON.stringify(data) })
}

export async function updateChatStatus(id: number, status: string) {
  return apiFetch(`/api/chats/${id}/status/`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
}

export async function assignChat(id: number, managerId: number) {
  return apiFetch(`/api/chats/${id}/assign/`, {
    method: "PUT",
    body: JSON.stringify({ manager_id: managerId }),
  })
}

export async function mergeChats(chatId: number, targetChatId: number) {
  return apiFetch(`/api/chats/${chatId}/merge/`, {
    method: "POST",
    body: JSON.stringify({ target_chat_id: targetChatId }),
  })
}

// --- Messages API ---

export async function fetchMessages(chatId: number) {
  return apiFetch<PaginatedResponse<ApiMessage>>(`/api/chats/${chatId}/messages/`)
}

export async function sendMessage(chatId: number, content: string) {
  return apiFetch<ApiMessage>(`/api/chats/${chatId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
}

// --- Sites API ---

export async function fetchSites() {
  return apiFetch<PaginatedResponse<ApiSite>>("/api/sites/")
}

export async function fetchSite(id: number) {
  return apiFetch<ApiSite>(`/api/sites/${id}/`)
}

export async function createSite(data: { name: string; url: string }) {
  return apiFetch<ApiSite>("/api/sites/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateSite(id: number, data: Partial<ApiSite>) {
  return apiFetch<ApiSite>(`/api/sites/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteSite(id: number) {
  return apiFetch(`/api/sites/${id}/`, { method: "DELETE" })
}

export async function fetchWidgetCode(siteId: number) {
  return apiFetch<{ embed_code: string }>(`/api/sites/${siteId}/widget-code/`)
}

export async function setupTelegram(siteId: number) {
  return apiFetch<{ ok: boolean; webhook_url: string; bot_username: string; referral_link: string }>(
    `/api/sites/${siteId}/setup-telegram/`,
    { method: "POST" },
  )
}

// --- Users/Managers API ---

export async function fetchUsers() {
  return apiFetch<PaginatedResponse<ApiManager>>("/api/users/")
}

export async function createUser(data: {
  email: string
  password: string
  first_name: string
  last_name?: string
  role: string
}) {
  return apiFetch<ApiManager>("/api/users/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateUser(id: number, data: Partial<ApiManager>) {
  return apiFetch<ApiManager>(`/api/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: number) {
  return apiFetch(`/api/users/${id}/`, { method: "DELETE" })
}

// --- Templates API ---

export async function fetchTemplates() {
  return apiFetch<PaginatedResponse<ApiTemplate>>("/api/chats/templates/")
}

export async function createTemplate(data: { title: string; content: string; hotkey?: string }) {
  return apiFetch<ApiTemplate>("/api/chats/templates/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// --- Stats API ---

export async function fetchStatsOverview(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : ""
  return apiFetch<StatsOverview>(`/api/stats/overview/${query}`)
}

export async function fetchManagerStats(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : ""
  return apiFetch<ManagerStats[]>(`/api/stats/managers/${query}`)
}

export interface TimelineItem {
  date: string
  count: number
}

export async function fetchStatsTimeline(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : ""
  return apiFetch<{ timeline: TimelineItem[] }>(`/api/stats/timeline/${query}`)
}

export interface RatingsStats {
  distribution: Record<string, number>
  avg_rating: number | null
  total_ratings: number
}

export async function fetchRatingsStats() {
  return apiFetch<RatingsStats>("/api/stats/ratings/")
}

// --- WebSocket ---

export function connectChatWS(chatId: number): WebSocket | null {
  const token = getAccessToken()
  if (!token) return null
  const wsBase = API_BASE.replace(/^http/, "ws")
  return new WebSocket(`${wsBase}/ws/chat/${chatId}/?token=${token}`)
}

export function connectNotificationsWS(): WebSocket | null {
  const token = getAccessToken()
  if (!token) return null
  const wsBase = API_BASE.replace(/^http/, "ws")
  return new WebSocket(`${wsBase}/ws/notifications/?token=${token}`)
}
