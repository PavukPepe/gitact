import type { ApiChat, ApiMessage } from "./api"
import type { Chat, ChatStatus, ChatSource, Message } from "./mock-data"

/**
 * Адаптирует ApiChat (backend) к Chat (frontend UI).
 * Это позволяет переиспользовать существующие UI-компоненты без переписывания.
 */
export function apiChatToChat(apiChat: ApiChat): Chat {
  const statusMap: Record<string, ChatStatus> = {
    new: "new",
    in_progress: "in-progress",
    replied: "replied",
    closed: "closed",
  }

  const sourceMap: Record<string, ChatSource> = {
    widget: "website",
    telegram: "telegram",
  }

  return {
    id: String(apiChat.id),
    clientName: apiChat.client_name || "Без имени",
    clientTelegram: apiChat.telegram_username || undefined,
    source: sourceMap[apiChat.channel] || "website",
    status: statusMap[apiChat.status] || "new",
    lastMessage: apiChat.last_message?.content || "",
    lastMessageTime: new Date(apiChat.updated_at),
    tags: [],
    messages: [],
    // Дополнительные поля для API
    _apiId: apiChat.id,
    _managerId: apiChat.assigned_manager,
    _managerName: apiChat.manager_name,
    _siteName: apiChat.site_name,
    _siteId: apiChat.site,
  } as Chat & Record<string, any>
}

/** Обратное преобразование статуса из frontend в backend формат */
export function chatStatusToApi(status: ChatStatus): string {
  const map: Record<ChatStatus, string> = {
    "new": "new",
    "in-progress": "in_progress",
    "replied": "replied",
    "closed": "closed",
  }
  return map[status]
}

/** Адаптирует ApiMessage к Message для chat-detail */
export function apiMessageToMessage(apiMsg: ApiMessage): Message {
  return {
    id: String(apiMsg.id),
    content: apiMsg.content,
    sender: apiMsg.sender_type === "client" ? "client" : "manager",
    timestamp: new Date(apiMsg.timestamp),
  }
}
