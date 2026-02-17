"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import type { Chat, ChatStatus } from "@/lib/mock-data"
import { KanbanColumn } from "./kanban-column"
import { ChatCard } from "./chat-card"

interface KanbanBoardProps {
  chats: Chat[]
  onChatsChange: (chats: Chat[]) => void
  onOpenChat: (chat: Chat) => void
}

const statuses: ChatStatus[] = ["new", "in-progress", "replied", "closed"]

export function KanbanBoard({
  chats,
  onChatsChange,
  onOpenChat,
}: KanbanBoardProps) {
  const [activeChat, setActiveChat] = useState<Chat | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const chat = chats.find((c) => c.id === active.id)
    if (chat) {
      setActiveChat(chat)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveChat(null)

    if (!over) return

    const chatId = active.id as string
    const newStatus = over.id as ChatStatus

    if (statuses.includes(newStatus)) {
      const updatedChats = chats.map((chat) =>
        chat.id === chatId ? { ...chat, status: newStatus } : chat
      )
      onChatsChange(updatedChats)
    }
  }

  const chatsByStatus = statuses.reduce(
    (acc, status) => {
      acc[status] = chats.filter((c) => c.status === status)
      return acc
    },
    {} as Record<ChatStatus, Chat[]>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            chats={chatsByStatus[status]}
            onOpenChat={onOpenChat}
          />
        ))}
      </div>
      <DragOverlay>
        {activeChat && (
          <div className="opacity-80">
            <ChatCard chat={activeChat} onOpen={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
