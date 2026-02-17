"use client"

import { Globe, Send } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Chat } from "@/lib/mock-data"
import { formatRelativeTime, getTagLabel } from "@/lib/mock-data"

interface ChatCardProps {
  chat: Chat
  onOpen: (chat: Chat) => void
}

export function ChatCard({ chat, onOpen }: ChatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const initials = chat.clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      onClick={() => onOpen(chat)}
    >
      <CardContent className="p-2.5">
        <div className="flex items-start gap-2.5">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{chat.clientName}</h4>
              <Badge
                variant={chat.source === "telegram" ? "default" : "secondary"}
                className="shrink-0 text-[10px] px-1.5 py-0 h-4"
              >
                {chat.source === "telegram" ? (
                  <Send className="size-2.5 mr-1" />
                ) : (
                  <Globe className="size-2.5 mr-1" />
                )}
                {chat.source === "telegram" ? "TG" : "Сайт"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {chat.lastMessage}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex gap-1 flex-wrap">
                {chat.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant={tag === "urgent" ? "destructive" : "outline"}
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {getTagLabel(tag)}
                  </Badge>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatRelativeTime(chat.lastMessageTime)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
