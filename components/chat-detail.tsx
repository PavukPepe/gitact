"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Globe, Send, Paperclip, Smile, Phone, User, X } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Chat, Message } from "@/lib/mock-data"
import { quickReplies, formatRelativeTime } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { fetchMessages, sendMessage as apiSendMessage, connectChatWS } from "@/lib/api"
import { apiMessageToMessage } from "@/lib/adapters"

interface ChatDetailProps {
  chat: Chat | null
  open: boolean
  onClose: () => void
}

export function ChatDetail({ chat, open, onClose }: ChatDetailProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Загружаем сообщения из API при открытии чата
  useEffect(() => {
    if (!chat || !open) return
    const chatId = Number(chat.id)
    if (isNaN(chatId)) {
      setMessages(chat.messages || [])
      return
    }

    fetchMessages(chatId)
      .then((res) => setMessages(res.results.map(apiMessageToMessage)))
      .catch(() => setMessages(chat.messages || []))
  }, [chat, open])

  // WebSocket для real-time сообщений
  useEffect(() => {
    if (!chat || !open) return
    const chatId = Number(chat.id)
    if (isNaN(chatId)) return

    const ws = connectChatWS(chatId)
    if (!ws) return
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "chat.message") {
        const msg: Message = {
          id: String(data.message.id),
          content: data.message.content,
          sender: data.message.sender_type === "client" ? "client" : "manager",
          timestamp: new Date(data.message.timestamp),
        }
        setMessages((prev) => [...prev, msg])
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [chat, open])

  // Прокрутка вниз при новых сообщениях
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!message.trim() || !chat) return
    const chatId = Number(chat.id)
    const text = message.trim()
    setMessage("")

    if (isNaN(chatId)) return

    try {
      await apiSendMessage(chatId, text)
      // Сообщение придёт обратно через WebSocket, не добавляем вручную
    } catch {
      // В случае ошибки — добавляем локально
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now()), content: text, sender: "manager", timestamp: new Date() },
      ])
    }
  }, [message, chat])

  if (!chat) return null

  const initials = chat.clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-start gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left">{chat.clientName}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={chat.source === "telegram" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {chat.source === "telegram" ? (
                    <Send className="size-3 mr-1" />
                  ) : (
                    <Globe className="size-3 mr-1" />
                  )}
                  {chat.source === "telegram" ? "Telegram" : "Сайт"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {chat.clientPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {chat.clientPhone}
                  </span>
                )}
                {chat.clientTelegram && (
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {chat.clientTelegram}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Replies */}
        <div className="flex gap-2 p-3 border-b overflow-x-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
                Быстрые ответы
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {quickReplies.map((reply, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => setMessage(reply)}
                  className="text-xs"
                >
                  {reply}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-1.5 overflow-x-auto">
            {quickReplies.slice(0, 3).map((reply, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                className="text-xs whitespace-nowrap shrink-0"
                onClick={() => setMessage(reply)}
              >
                {reply.length > 25 ? `${reply.slice(0, 25)}...` : reply}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.sender === "client" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    msg.sender === "client"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span
                    className={cn(
                      "text-[10px] mt-1 block",
                      msg.sender === "client"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatRelativeTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Input */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Paperclip className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Smile className="size-4" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  handleSend()
                }
              }}
            />
            <Button size="icon" className="shrink-0" disabled={!message.trim()} onClick={handleSend}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
