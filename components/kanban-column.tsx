"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { cn } from "@/lib/utils"
import type { Chat, ChatStatus } from "@/lib/mock-data"
import { getStatusLabel } from "@/lib/mock-data"
import { ChatCard } from "./chat-card"

interface KanbanColumnProps {
  status: ChatStatus
  chats: Chat[]
  onOpenChat: (chat: Chat) => void
}

const statusColors: Record<ChatStatus, string> = {
  new: "bg-blue-500",
  "in-progress": "bg-amber-500",
  replied: "bg-emerald-500",
  closed: "bg-slate-400",
}

export function KanbanColumn({ status, chats, onOpenChat }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg bg-muted/40 p-2 min-h-[500px] transition-colors",
        isOver && "bg-muted/70"
      )}
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={cn("size-2 rounded-full", statusColors[status])} />
        <h3 className="font-medium text-sm">{getStatusLabel(status)}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {chats.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-1.5 overflow-auto"
      >
        <SortableContext
          items={chats.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {chats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} onOpen={onOpenChat} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
