"use client"

import { useEffect, useState, useCallback } from "react"
import { LayoutGrid, List } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from "@/components/kanban-board"
import { ChatsList } from "@/components/chats-list"
import { ChatDetail } from "@/components/chat-detail"
import { type Chat } from "@/lib/mock-data"
import { fetchChats, updateChatStatus, connectNotificationsWS } from "@/lib/api"
import { apiChatToChat, chatStatusToApi } from "@/lib/adapters"

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadChats = useCallback(async () => {
    try {
      const res = await fetchChats({ page_size: "100" })
      setChats(res.results.map(apiChatToChat))
    } catch {
      // ошибка загрузки
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  // WebSocket для уведомлений о новых чатах
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
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Чаты</h1>
        <p className="text-muted-foreground">
          Управляйте входящими сообщениями с сайта и Telegram
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
          <ChatsList chats={chats} onOpenChat={handleOpenChat} />
        </TabsContent>
      </Tabs>

      <ChatDetail
        chat={selectedChat}
        open={detailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
