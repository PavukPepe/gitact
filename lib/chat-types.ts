export type ChatStatus = "new" | "in-progress" | "replied" | "closed"
export type ChatSource = "website" | "email"
export type ChatTag = "urgent" | "question" | "sale"

export interface Chat {
  id: string
  clientName: string
  clientPhone?: string
  clientAvatar?: string
  source: ChatSource
  status: ChatStatus
  lastMessage: string
  lastMessageTime: Date
  tags: ChatTag[]
  messages: Message[]
  // API-backed fields
  assignedManagerId?: number | null
  assignedManagerName?: string | null
  siteName?: string | null
  siteId?: number | null
  contactId?: number | null
}

export interface MessageFile {
  id: string
  url: string
  filename: string
  mimeType: string
  fileSize: number
}

export interface Message {
  id: string
  content: string
  sender: "client" | "manager"
  timestamp: Date
  files?: MessageFile[]
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "только что"
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн назад`
  return date.toLocaleDateString("ru-RU")
}

export function getStatusLabel(status: ChatStatus): string {
  const labels: Record<ChatStatus, string> = {
    new: "Новые",
    "in-progress": "В обработке",
    replied: "Ответ дан",
    closed: "Закрытые",
  }
  return labels[status]
}

export function getTagLabel(tag: ChatTag): string {
  const labels: Record<ChatTag, string> = {
    urgent: "Срочно",
    question: "Вопрос",
    sale: "Продажа",
  }
  return labels[tag]
}
