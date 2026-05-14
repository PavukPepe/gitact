import type { ApiChat, ApiMessage } from "./api"
import type { Chat, ChatStatus, ChatSource, Message } from "./chat-types"

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
    email: "email",
  }

  return {
    id: String(apiChat.id),
    clientName: apiChat.client_name || "Без имени",
    source: sourceMap[apiChat.channel] || "website",
    status: statusMap[apiChat.status] || "new",
    lastMessage: apiChat.last_message?.content || "",
    lastMessageTime: new Date(apiChat.updated_at),
    tags: [],
    messages: [],
    assignedManagerId: apiChat.assigned_manager,
    assignedManagerName: apiChat.manager_name,
    siteName: apiChat.site_name,
    siteId: apiChat.site,
    contactId: apiChat.contact,
  }
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
    files: (apiMsg.files || []).map((f) => ({
      id: String(f.id),
      url: f.file,
      filename: f.filename,
      mimeType: f.mime_type,
      fileSize: f.file_size,
    })),
  }
}
