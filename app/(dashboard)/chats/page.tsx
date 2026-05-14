"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from "@/components/kanban-board"
import { ChatsList } from "@/components/chats-list"
import { ChatDetail } from "@/components/chat-detail"
import { type Chat } from "@/lib/chat-types"
import { fetchChats, fetchChat, updateChatStatus, connectNotificationsWS, deleteChat } from "@/lib/api"
import { apiChatToChat, chatStatusToApi } from "@/lib/adapters"

export default function ChatsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedChatId = searchParams.get("id")

  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadChats = useCallback(async () => {
    try {
      const res = await fetchChats({ page_size: "100" })
      const newChats = res.results.map(apiChatToChat)
      setChats(newChats)
      // Если открыт чат — обновляем его данные (статус, менеджер могли измениться)
      setSelectedChat((prev) => prev ? (newChats.find((c) => c.id === prev.id) ?? prev) : null)
    } catch {
      // ошибка загрузки
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Авто-открытие чата по ?id=... из URL (например, при переходе с карточки клиента)
  useEffect(() => {
    if (!requestedChatId) return
    const fromList = chats.find((c) => c.id === requestedChatId)
    if (fromList) {
      setSelectedChat(fromList)
      setDetailOpen(true)
      return
    }
    // Чат не в списке (закрыт + paginated/другой статус) — догружаем напрямую
    fetchChat(Number(requestedChatId))
      .then((api) => {
        setSelectedChat(apiChatToChat(api))
        setDetailOpen(true)
      })
      .catch(() => {})
  }, [requestedChatId, chats])

  useEffect(() => {
    const ws = connectNotificationsWS()
    if (!ws) return

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "new_chat" || data.type === "chat_assigned" || data.type === "chat_reassigned") {
        loadChats()
      }
    }

    return () => ws.close()
  }, [loadChats])

  const handleChatsChange = async (updatedChats: Chat[]) => {
    const changedChat = updatedChats.find((uc) => {
      const original = chats.find((c) => c.id === uc.id)
      return original && original.status !== uc.status
    })

    setChats(updatedChats)

    if (changedChat) {
      try {
        await updateChatStatus(
          Number(changedChat.id),
          chatStatusToApi(changedChat.status)
        )
      } catch {
        loadChats()
      }
    }
  }

  const handleOpenChat = (chat: Chat) => {
    setSelectedChat(chat)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedChat(null)
    if (requestedChatId) {
      router.replace("/chats", { scroll: false })
    }
  }

  const handleChatUpdate = (chatId: string, updates: Partial<Chat>) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, ...updates } : c))
    )
    setSelectedChat((prev) => (prev?.id === chatId ? { ...prev, ...updates } : prev))
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Чаты</h1>
        <p className="text-muted-foreground">
          Управляйте входящими сообщениями с сайтов
        </p>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="size-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="size-4" />
            Список
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard
            chats={chats}
            onChatsChange={handleChatsChange}
            onOpenChat={handleOpenChat}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <ChatsList chats={chats} onOpenChat={handleOpenChat} onChatsChange={setChats} />
        </TabsContent>
      </Tabs>

      <ChatDetail
        chat={selectedChat}
        open={detailOpen}
        onClose={handleCloseDetail}
        onChatUpdate={handleChatUpdate}
      />
    </div>
  )
}
