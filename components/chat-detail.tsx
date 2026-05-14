"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { Globe, Send, Paperclip, Smile, Phone, User, Building2, FileText, X, Download, Mail, ExternalLink } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Chat, Message, MessageFile } from "@/lib/chat-types"
import { formatRelativeTime } from "@/lib/chat-types"
import { cn } from "@/lib/utils"
import {
  fetchMessages,
  sendMessageWithFiles,
  connectChatWS,
  fetchUsers,
  assignChat,
  fetchTemplates,
  type ApiManager,
  type ApiTemplate,
} from "@/lib/api"
import { apiMessageToMessage } from "@/lib/adapters"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function resolveFileUrl(url: string): string {
  if (url.startsWith("http")) return url
  return `${API_BASE}${url}`
}

interface ChatDetailProps {
  chat: Chat | null
  open: boolean
  onClose: () => void
  onChatUpdate?: (chatId: string, updates: Partial<Chat>) => void
}

export function ChatDetail({ chat, open, onClose, onChatUpdate }: ChatDetailProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [managers, setManagers] = useState<ApiManager[]>([])
  const [templates, setTemplates] = useState<ApiTemplate[]>([])
  const [assignedManagerId, setAssignedManagerId] = useState<string>("")
  const [assignedManagerName, setAssignedManagerName] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync manager state when chat changes
  useEffect(() => {
    if (!chat) return
    setAssignedManagerId(chat.assignedManagerId ? String(chat.assignedManagerId) : "unassigned")
    setAssignedManagerName(chat.assignedManagerName ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id])

  // Load managers list once
  useEffect(() => {
    if (!open) return
    fetchUsers()
      .then((res) => setManagers(res.results))
      .catch(() => {})
  }, [open])

  // Load site-specific templates when chat changes
  useEffect(() => {
    if (!chat || !open) {
      setTemplates([])
      return
    }
    const siteId = Number(chat.siteId)
    if (!siteId) {
      setTemplates([])
      return
    }
    fetchTemplates({ site: siteId })
      .then((res) => setTemplates(res.results))
      .catch(() => setTemplates([]))
  }, [chat?.id, chat?.siteId, open])

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
          files: (data.message.files || []).map((f: { id: number; url: string; filename: string; mime_type: string; file_size: number }) => ({
            id: String(f.id),
            url: f.url,
            filename: f.filename,
            mimeType: f.mime_type,
            fileSize: f.file_size,
          })),
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [chat, open])

  // Прокрутка вниз при новых сообщениях
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!message.trim() && pendingFiles.length === 0) return
    if (!chat) return
    const chatId = Number(chat.id)
    const text = message.trim()
    const files = [...pendingFiles]
    setMessage("")
    setPendingFiles([])

    if (isNaN(chatId)) return

    try {
      const apiMsg = await sendMessageWithFiles(chatId, text, files)
      const newMsg = apiMessageToMessage(apiMsg)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    } catch {
      if (text) {
        setMessages((prev) => [
          ...prev,
          { id: String(Date.now()), content: text, sender: "manager", timestamp: new Date() },
        ])
      }
    }
  }, [message, pendingFiles, chat])

  const handleSendTemplate = useCallback(async (text: string) => {
    if (!chat || !text.trim()) return
    const chatId = Number(chat.id)
    if (isNaN(chatId)) return
    try {
      const apiMsg = await sendMessageWithFiles(chatId, text, [])
      const newMsg = apiMessageToMessage(apiMsg)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now()), content: text, sender: "manager", timestamp: new Date() },
      ])
    }
  }, [chat])

  const handleAssignManager = useCallback(async (value: string) => {
    if (!chat) return
    const chatId = Number(chat.id)
    if (isNaN(chatId)) return

    setAssignedManagerId(value)

    if (value === "unassigned") {
      setAssignedManagerName(null)
      onChatUpdate?.(chat.id, { assignedManagerId: null, assignedManagerName: null })
      return
    }

    const managerId = Number(value)
    try {
      await assignChat(chatId, managerId)
      const manager = managers.find((m) => m.id === managerId)
      const name = manager
        ? `${manager.first_name} ${manager.last_name}`.trim() || manager.email
        : null
      setAssignedManagerName(name)
      onChatUpdate?.(chat.id, { assignedManagerId: managerId, assignedManagerName: name })
    } catch {
      setAssignedManagerId(chat.assignedManagerId ? String(chat.assignedManagerId) : "unassigned")
    }
  }, [chat, managers, onChatUpdate])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPendingFiles((prev) => [...prev, ...files].slice(0, 5))
    e.target.value = ""
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (!chat) return null

  const initials = chat.clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
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
              <div className="flex items-center justify-between gap-2 pr-8">
                <SheetTitle className="text-left">{chat.clientName}</SheetTitle>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs gap-1">
                  {chat.source === "email" ? (
                    <Mail className="size-3" />
                  ) : (
                    <Globe className="size-3" />
                  )}
                  {chat.source === "email" ? "Email" : "Виджет"}
                </Badge>
                {chat.contactId && (
                  <Link
                    href={`/contacts/${chat.contactId}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Карточка клиента
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {chat.clientPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {chat.clientPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Site & Manager info */}
          <div className="mt-3 pt-3 border-t space-y-2">
            {chat.siteName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="size-3 shrink-0" />
                <span className="font-medium text-foreground">{chat.siteName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="size-3 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground shrink-0">Менеджер:</span>
              <Select value={assignedManagerId} onValueChange={handleAssignManager}>
                <SelectTrigger className="h-6 text-xs border-dashed flex-1 min-w-0">
                  <SelectValue placeholder="Не назначен">
                    {assignedManagerId === "unassigned" || !assignedManagerId
                      ? "Не назначен"
                      : assignedManagerName || "Менеджер"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Не назначен</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {`${m.first_name} ${m.last_name}`.trim() || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Replies */}
        {templates.length > 0 && (
          <div className="flex gap-2 p-3 border-b overflow-x-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
                  Быстрые ответы
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {templates.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => handleSendTemplate(t.content)}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="text-xs font-medium">{t.title}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {t.content}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex gap-1.5 overflow-x-auto">
              {templates.slice(0, 3).map((t) => (
                <Button
                  key={t.id}
                  variant="secondary"
                  size="sm"
                  className="text-xs whitespace-nowrap shrink-0"
                  onClick={() => handleSendTemplate(t.content)}
                  title={t.content}
                >
                  {t.title.length > 25 ? `${t.title.slice(0, 25)}...` : t.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
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
                  {msg.content && <p className="text-sm">{msg.content}</p>}
                  {msg.files && msg.files.length > 0 && (
                    <div className={cn("flex flex-col gap-1.5", msg.content && "mt-2")}>
                      {msg.files.map((file) => (
                        <FileAttachment key={file.id} file={file} isClient={msg.sender === "client"} />
                      ))}
                    </div>
                  )}
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
            <div ref={messagesEndRef} />
          </div>
        </div>

        <Separator />

        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="flex gap-2 px-4 pt-2 flex-wrap">
            {pendingFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="size-14 object-cover rounded-md border"
                  />
                ) : (
                  <div className="size-14 flex flex-col items-center justify-center rounded-md border bg-muted text-[10px] text-muted-foreground p-1 text-center">
                    <FileText className="size-5 mb-0.5" />
                    <span className="truncate w-full text-center">{file.name.split(".").pop()?.toUpperCase()}</span>
                  </div>
                )}
                <button
                  onClick={() => removePendingFile(index)}
                  className="absolute -top-1.5 -right-1.5 size-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
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
                if (e.key === "Enter" && (message.trim() || pendingFiles.length > 0)) {
                  handleSend()
                }
              }}
            />
            <Button
              size="icon"
              className="shrink-0"
              disabled={!message.trim() && pendingFiles.length === 0}
              onClick={handleSend}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

</>
  )
}

function FileAttachment({ file, isClient }: { file: MessageFile; isClient: boolean }) {
  const url = resolveFileUrl(file.url)
  const isImage = file.mimeType.startsWith("image/")

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={file.filename}
          className="max-w-55 max-h-45 rounded-lg object-cover border"
        />
      </a>
    )
  }

  return (
    <a
      href={url}
      download={file.filename}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs border",
        isClient
          ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          : "border-border text-foreground hover:bg-accent"
      )}
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate max-w-40">{file.filename}</span>
      <Download className="size-3 shrink-0 ml-auto" />
    </a>
  )
}
