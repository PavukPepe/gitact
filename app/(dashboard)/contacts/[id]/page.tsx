"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Mail, Phone, MessageSquare, Save, Loader2,
  Globe, FileText, Clock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useRoleGuard } from "@/hooks/use-role-guard"
import {
  fetchContact, updateContact, fetchChats,
  type ApiContact, type ApiChat,
} from "@/lib/api"

const STATUS_LABEL: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  replied: "Ответ дан",
  closed: "Закрыта",
}

const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-500",
  in_progress: "bg-amber-500",
  replied: "bg-emerald-500",
  closed: "bg-slate-400",
}

const CHANNEL_ICON = {
  widget: Globe,
  email: Mail,
} as const

export default function ContactDetailPage() {
  useRoleGuard(["admin", "rop", "manager"])
  const params = useParams()
  const router = useRouter()
  const contactId = Number(params.id)

  const [contact, setContact] = useState<ApiContact | null>(null)
  const [chats, setChats] = useState<ApiChat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: "", phone: "", notes: "" })

  useEffect(() => {
    if (!contactId || isNaN(contactId)) return
    setLoading(true)
    Promise.all([
      fetchContact(contactId),
      fetchChats({ contact: String(contactId), page_size: "100" }),
    ])
      .then(([c, chatsRes]) => {
        setContact(c)
        setDraft({ name: c.name, phone: c.phone, notes: c.notes })
        setChats(chatsRes.results)
      })
      .catch(() => setError("Не удалось загрузить данные клиента."))
      .finally(() => setLoading(false))
  }, [contactId])

  const handleSave = async () => {
    if (!contact) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateContact(contact.id, draft)
      setContact(updated)
    } catch {
      setError("Не удалось сохранить.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        Загрузка...
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="size-4" />
          Назад
        </Button>
        <p className="text-sm text-muted-foreground">Клиент не найден.</p>
      </div>
    )
  }

  const initials = (contact.name || contact.email || "?")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="size-4" />
          Назад
        </Button>
      </div>

      <div className="flex items-start gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {contact.name || "Без имени"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Клиент с {new Date(contact.created_at).toLocaleDateString("ru-RU")}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {contact.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                {contact.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              {contact.chats_count} {contact.chats_count === 1 ? "обращение" : "обращений"}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Заметки и контакты
            </CardTitle>
            <CardDescription>
              Вся информация по клиенту в одном месте — её увидит каждый менеджер.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Имя</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Иван Петров"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Телефон</Label>
              <Input
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                placeholder="+7 ..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Заметки</Label>
              <Textarea
                rows={5}
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Что важно знать о клиенте..."
              />
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              История обращений
            </CardTitle>
            <CardDescription>
              Все чаты этого клиента — открытые и закрытые.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {chats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                У клиента пока нет обращений.
              </p>
            ) : (
              <div className="divide-y">
                {chats.map((c) => {
                  const Icon = CHANNEL_ICON[c.channel] || Globe
                  return (
                    <Link
                      key={c.id}
                      href={`/chats?id=${c.id}`}
                      className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            Чат #{c.id}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                            <span className={`size-1.5 rounded-full ${STATUS_COLOR[c.status] || "bg-slate-400"}`} />
                            {STATUS_LABEL[c.status] || c.status}
                          </Badge>
                          {c.site_name && (
                            <span className="text-[11px] text-muted-foreground">
                              {c.site_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {c.last_message?.content || "Нет сообщений"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(c.updated_at).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
