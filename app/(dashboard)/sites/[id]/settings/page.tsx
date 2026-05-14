"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Save, Palette, MessageSquare,
  Smartphone, Monitor, GripVertical, Clock, Reply, Link2, Copy, Check,
  Plus, Trash2, Pencil, X,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  fetchSite, updateSite, fetchWidgetCode,
  fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
  type ApiSite, type ApiTemplate,
} from "@/lib/api"

const defaultDesktop = {
  primaryColor: "#3b82f6",
  textColor: "#ffffff",
  welcomeMessage: "Здравствуйте! Чем могу помочь?",
  buttonText: "Написать нам",
  position: "right" as "left" | "right",
  offsetX: 2,
  offsetY: 2,
  autoOpen: false,
  autoOpenDelay: 5,
  soundEnabled: true,
}

const defaultMobile = {
  show: true,
  position: "right" as "left" | "right",
  offsetX: 2,
  offsetY: 2,
  buttonSize: "medium" as "small" | "medium" | "large",
  fullscreenChat: true,
}

export default function SiteSettingsPage() {
  const params = useParams()
  const siteId = Number(params.id)
  const previewRef = useRef<HTMLDivElement>(null)

  const [site, setSite] = useState<ApiSite | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // General site info
  const [siteName, setSiteName] = useState("")
  const [siteUrl, setSiteUrl] = useState("")

  // Widget settings — desktop
  const [desktop, setDesktop] = useState(defaultDesktop)
  // Widget settings — mobile
  const [mobile, setMobile] = useState(defaultMobile)

  // Working hours
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "18:00",
    timezone: "Europe/Moscow",
  })

  // Auto-reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState("")

  // Email channel
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailImapHost, setEmailImapHost] = useState("imap.mail.ru")
  const [emailImapPort, setEmailImapPort] = useState(993)
  const [emailImapUser, setEmailImapUser] = useState("")
  const [emailImapPassword, setEmailImapPassword] = useState("")
  const [emailSmtpHost, setEmailSmtpHost] = useState("smtp.mail.ru")
  const [emailSmtpPort, setEmailSmtpPort] = useState(465)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [embedCode, setEmbedCode] = useState("")
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  useEffect(() => {
    if (isNaN(siteId)) return
    loadSite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  async function loadSite() {
    try {
      const data = await fetchSite(siteId)
      setSite(data)
      setSiteName(data.name || "")
      setSiteUrl(data.url || "")

      // Инициализация из widget_settings
      const sanitizeOffset = (v: unknown, def: number) => {
        const n = parseFloat(String(v))
        return isNaN(n) || n > 45 ? def : n
      }
      const ws = data.widget_settings || {}
      if (ws.desktop) {
        setDesktop({
          ...defaultDesktop,
          ...ws.desktop,
          offsetX: sanitizeOffset(ws.desktop.offsetX, defaultDesktop.offsetX),
          offsetY: sanitizeOffset(ws.desktop.offsetY, defaultDesktop.offsetY),
        })
      }
      if (ws.mobile) {
        setMobile({
          ...defaultMobile,
          ...ws.mobile,
          offsetX: sanitizeOffset(ws.mobile.offsetX, defaultMobile.offsetX),
          offsetY: sanitizeOffset(ws.mobile.offsetY, defaultMobile.offsetY),
        })
      }
      // Working hours
      const wh = data.working_hours || {}
      if (wh.start || wh.end) {
        setWorkingHours({
          start: wh.start || "09:00",
          end: wh.end || "18:00",
          timezone: wh.timezone || "Europe/Moscow",
        })
      }

      // Auto-reply
      setAutoReplyEnabled(data.auto_reply_enabled)
      setAutoReplyMessage(data.auto_reply_message || "")

      // Email
      setEmailEnabled(data.email_enabled ?? false)
      setEmailImapHost(data.email_imap_host || "imap.mail.ru")
      setEmailImapPort(data.email_imap_port || 993)
      setEmailImapUser(data.email_imap_user || "")
      setEmailSmtpHost(data.email_smtp_host || "smtp.mail.ru")
      setEmailSmtpPort(data.email_smtp_port || 465)

      // Embed code
      try {
        const wc = await fetchWidgetCode(siteId)
        setEmbedCode(wc.embed_code)
      } catch {
        // не критично
      }
    } catch {
      // ошибка загрузки
    } finally {
      setLoading(false)
    }
  }

  const handleCopyEmbed = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode)
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSite(siteId, {
        name: siteName,
        url: siteUrl,
        widget_settings: {
          desktop,
          mobile,
        } as Record<string, unknown>,
        working_hours: workingHours as Record<string, unknown>,
        auto_reply_enabled: autoReplyEnabled,
        auto_reply_message: autoReplyMessage,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ошибка сохранения
    } finally {
      setSaving(false)
    }
  }

  // Handle widget drag in preview
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewRef.current) return
    setIsDragging(true)

    const rect = previewRef.current.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const isDesktopPreview = previewMode === "desktop"
    const startOffsetX = isDesktopPreview ? desktop.offsetX : mobile.offsetX
    const startOffsetY = isDesktopPreview ? desktop.offsetY : mobile.offsetY
    const position = isDesktopPreview ? desktop.position : mobile.position

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      // Конвертируем пиксельную дельту в проценты от размеров контейнера
      const newOffsetX = Math.max(0, Math.min(45, position === "right"
        ? startOffsetX - (deltaX / rect.width) * 100
        : startOffsetX + (deltaX / rect.width) * 100))
      const newOffsetY = Math.max(0, Math.min(45, startOffsetY - (deltaY / rect.height) * 100))

      if (isDesktopPreview) {
        setDesktop(prev => ({ ...prev, offsetX: Math.round(newOffsetX * 2) / 2, offsetY: Math.round(newOffsetY * 2) / 2 }))
      } else {
        setMobile(prev => ({ ...prev, offsetX: Math.round(newOffsetX * 2) / 2, offsetY: Math.round(newOffsetY * 2) / 2 }))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sites">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Настройки сайта</h1>
          <p className="text-muted-foreground">
            {site?.name || "Загрузка..."} — {site?.url || ""}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-2" />
          {saved ? "Сохранено!" : saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <Tabs defaultValue="widget" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="widget" className="gap-2">
            <Palette className="size-4" />
            Виджет
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Link2 className="size-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Reply className="size-4" />
            Шаблоны
          </TabsTrigger>
        </TabsList>

        {/* Widget Settings Tab */}
        <TabsContent value="widget" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* General Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Название и адрес вашего сайта</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Название сайта</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Мой магазин"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Адрес сайта (URL)</Label>
                  <Input
                    id="siteUrl"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="size-5" />
                  Внешний вид
                </CardTitle>
                <CardDescription>Настройте цвета и стиль виджета</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Основной цвет</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={desktop.primaryColor}
                      onChange={(e) => setDesktop({ ...desktop, primaryColor: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={desktop.primaryColor}
                      onChange={(e) => setDesktop({ ...desktop, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textColor">Цвет текста кнопки</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="textColor"
                      type="color"
                      value={desktop.textColor}
                      onChange={(e) => setDesktop({ ...desktop, textColor: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={desktop.textColor}
                      onChange={(e) => setDesktop({ ...desktop, textColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="size-5" />
                  Сообщения
                </CardTitle>
                <CardDescription>Настройте тексты в виджете</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Приветственное сообщение</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={desktop.welcomeMessage}
                    onChange={(e) => setDesktop({ ...desktop, welcomeMessage: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Текст кнопки</Label>
                  <Input
                    id="buttonText"
                    value={desktop.buttonText}
                    onChange={(e) => setDesktop({ ...desktop, buttonText: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Embed Code */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="size-5" />
                  Код для вставки на сайт
                </CardTitle>
                <CardDescription>
                  Скопируйте этот код и вставьте перед закрывающим тегом &lt;/body&gt; на вашем сайте
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 block bg-muted rounded-lg px-4 py-3 text-sm font-mono break-all select-all">
                    {embedCode || "Загрузка..."}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyEmbed} disabled={!embedCode}>
                    {copiedEmbed ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  UUID сайта: <span className="font-mono font-medium">{site?.site_uuid}</span>
                </p>
              </CardContent>
            </Card>

            {/* Desktop Position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="size-5" />
                  Позиция на десктопе
                </CardTitle>
                <CardDescription>Настройте расположение виджета на экране</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Сторона экрана</Label>
                  <Select
                    value={desktop.position}
                    onValueChange={(value: "left" | "right") => setDesktop({ ...desktop, position: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Справа</SelectItem>
                      <SelectItem value="left">Слева</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Отступ по горизонтали</Label>
                    <span className="text-sm text-muted-foreground">{desktop.offsetX}%</span>
                  </div>
                  <Slider
                    value={[desktop.offsetX]}
                    onValueChange={([value]) => setDesktop({ ...desktop, offsetX: value })}
                    min={0} max={45} step={0.5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Отступ по вертикали</Label>
                    <span className="text-sm text-muted-foreground">{desktop.offsetY}%</span>
                  </div>
                  <Slider
                    value={[desktop.offsetY]}
                    onValueChange={([value]) => setDesktop({ ...desktop, offsetY: value })}
                    min={0} max={45} step={0.5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mobile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="size-5" />
                  Настройки для мобильных
                </CardTitle>
                <CardDescription>Отдельные настройки для смартфонов и планшетов</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Показывать на мобильных</Label>
                    <p className="text-sm text-muted-foreground">Виджет будет виден на устройствах</p>
                  </div>
                  <Switch
                    checked={mobile.show}
                    onCheckedChange={(checked) => setMobile({ ...mobile, show: checked })}
                  />
                </div>
                {mobile.show && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Сторона экрана</Label>
                      <Select
                        value={mobile.position}
                        onValueChange={(value: "left" | "right") => setMobile({ ...mobile, position: value })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right">Справа</SelectItem>
                          <SelectItem value="left">Слева</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Размер кнопки</Label>
                      <Select
                        value={mobile.buttonSize}
                        onValueChange={(value: "small" | "medium" | "large") => setMobile({ ...mobile, buttonSize: value })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Маленькая</SelectItem>
                          <SelectItem value="medium">Средняя</SelectItem>
                          <SelectItem value="large">Большая</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Отступ по горизонтали</Label>
                        <span className="text-sm text-muted-foreground">{mobile.offsetX}%</span>
                      </div>
                      <Slider
                        value={[mobile.offsetX]}
                        onValueChange={([value]) => setMobile({ ...mobile, offsetX: value })}
                        min={0} max={45} step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Отступ по вертикали</Label>
                        <span className="text-sm text-muted-foreground">{mobile.offsetY}%</span>
                      </div>
                      <Slider
                        value={[mobile.offsetY]}
                        onValueChange={([value]) => setMobile({ ...mobile, offsetY: value })}
                        min={0} max={45} step={0.5}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Полноэкранный чат</Label>
                        <p className="text-sm text-muted-foreground">Открывать чат на весь экран</p>
                      </div>
                      <Switch
                        checked={mobile.fullscreenChat}
                        onCheckedChange={(checked) => setMobile({ ...mobile, fullscreenChat: checked })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  Рабочие часы
                </CardTitle>
                <CardDescription>Часы работы поддержки на этом сайте</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workStart">Начало</Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={workingHours.start}
                      onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workEnd">Конец</Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={workingHours.end}
                      onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Часовой пояс</Label>
                  <Select
                    value={workingHours.timezone}
                    onValueChange={(value) => setWorkingHours({ ...workingHours, timezone: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Moscow">Москва (GMT+3)</SelectItem>
                      <SelectItem value="Europe/Kaliningrad">Калининград (GMT+2)</SelectItem>
                      <SelectItem value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</SelectItem>
                      <SelectItem value="Asia/Novosibirsk">Новосибирск (GMT+7)</SelectItem>
                      <SelectItem value="Asia/Vladivostok">Владивосток (GMT+10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Auto-Reply */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Reply className="size-5" />
                  Автоответ
                </CardTitle>
                <CardDescription>Автоматический ответ вне рабочих часов</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Включить автоответ</Label>
                    <p className="text-sm text-muted-foreground">
                      Отвечать клиентам автоматически вне рабочих часов
                    </p>
                  </div>
                  <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
                </div>
                {autoReplyEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="autoReplyMessage">Текст автоответа</Label>
                    <Textarea
                      id="autoReplyMessage"
                      value={autoReplyMessage}
                      onChange={(e) => setAutoReplyMessage(e.target.value)}
                      rows={3}
                      placeholder="Спасибо за обращение! Мы ответим в рабочее время."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Behavior */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Поведение виджета</CardTitle>
                <CardDescription>Настройте автоматические действия виджета</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Автоматически открывать виджет</Label>
                    <p className="text-sm text-muted-foreground">
                      Открывать чат автоматически после загрузки страницы
                    </p>
                  </div>
                  <Switch
                    checked={desktop.autoOpen}
                    onCheckedChange={(checked) => setDesktop({ ...desktop, autoOpen: checked })}
                  />
                </div>
                {desktop.autoOpen && (
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label htmlFor="autoOpenDelay">Задержка (секунды)</Label>
                    <Input
                      id="autoOpenDelay"
                      type="number"
                      min="1" max="60"
                      value={desktop.autoOpenDelay}
                      onChange={(e) => setDesktop({ ...desktop, autoOpenDelay: Number(e.target.value) })}
                      className="w-24"
                    />
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Звук уведомлений</Label>
                    <p className="text-sm text-muted-foreground">Воспроизводить звук при новых сообщениях</p>
                  </div>
                  <Switch
                    checked={desktop.soundEnabled}
                    onCheckedChange={(checked) => setDesktop({ ...desktop, soundEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Предпросмотр</CardTitle>
                    <CardDescription>Перетаскивайте виджет мышкой для настройки позиции</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={previewMode === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("desktop")}
                      className={previewMode === "desktop" ? "" : "bg-transparent"}
                    >
                      <Monitor className="size-4 mr-1" />
                      Десктоп
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("mobile")}
                      className={previewMode === "mobile" ? "" : "bg-transparent"}
                    >
                      <Smartphone className="size-4 mr-1" />
                      Мобильный
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div
                    ref={previewRef}
                    className={`relative bg-muted/50 rounded-lg overflow-hidden transition-all ${
                      previewMode === "desktop"
                        ? "w-full aspect-video"
                        : "w-[320px] h-140 border-8 border-foreground/20 rounded-4xl"
                    }`}
                  >
                    {previewMode === "desktop" ? (
                      <div className="absolute top-0 left-0 right-0 h-8 bg-muted flex items-center gap-2 px-3">
                        <div className="flex gap-1.5">
                          <div className="size-2.5 rounded-full bg-red-400" />
                          <div className="size-2.5 rounded-full bg-yellow-400" />
                          <div className="size-2.5 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="bg-background rounded-md h-4 flex items-center px-2">
                            <span className="text-[10px] text-muted-foreground truncate">{site?.url}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-0 left-0 right-0 h-6 bg-muted flex items-center justify-center">
                        <div className="w-20 h-1 bg-foreground/20 rounded-full" />
                      </div>
                    )}
                    {(previewMode === "desktop" || mobile.show) && (
                      <div
                        className={`absolute flex items-center gap-2 px-4 py-3 rounded-full shadow-lg cursor-move transition-transform select-none ${
                          isDragging ? "scale-105" : "hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: desktop.primaryColor,
                          color: desktop.textColor,
                          ...(previewMode === "desktop" ? {
                            [desktop.position]: `${desktop.offsetX}%`,
                            bottom: `${desktop.offsetY}%`,
                          } : {
                            [mobile.position]: `${mobile.offsetX}%`,
                            bottom: `calc(${mobile.offsetY}% + 24px)`,
                          }),
                        }}
                        onMouseDown={handleMouseDown}
                      >
                        <GripVertical className="size-4 opacity-50" />
                        <MessageSquare className="size-5" />
                        {previewMode === "desktop" && (
                          <span className="font-medium whitespace-nowrap">{desktop.buttonText}</span>
                        )}
                      </div>
                    )}
                    {previewMode === "mobile" && !mobile.show && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Виджет скрыт на мобильных</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="size-5" />
                  Email-канал
                </CardTitle>
                <CardDescription>
                  Подключите почтовый ящик (mail.ru или другой) для получения писем от клиентов.
                  Входящие письма будут автоматически создавать лиды в системе.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Включить email-канал</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Опрос ящика каждую минуту</p>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>

                <Separator />

                <p className="text-sm font-medium">IMAP (входящие)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Хост</Label>
                    <Input value={emailImapHost} onChange={e => setEmailImapHost(e.target.value)} placeholder="imap.mail.ru" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Порт</Label>
                    <Input type="number" value={emailImapPort} onChange={e => setEmailImapPort(Number(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Логин (email)</Label>
                  <Input type="email" value={emailImapUser} onChange={e => setEmailImapUser(e.target.value)} placeholder="support@mail.ru" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Пароль приложения</Label>
                  <Input type="password" value={emailImapPassword} onChange={e => setEmailImapPassword(e.target.value)} placeholder="Пароль от внешнего приложения" />
                  <p className="text-xs text-muted-foreground">
                    Для mail.ru: Настройки → Безопасность → Пароль для внешних приложений
                  </p>
                </div>

                <Separator />

                <p className="text-sm font-medium">SMTP (исходящие)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Хост</Label>
                    <Input value={emailSmtpHost} onChange={e => setEmailSmtpHost(e.target.value)} placeholder="smtp.mail.ru" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Порт</Label>
                    <Input type="number" value={emailSmtpPort} onChange={e => setEmailSmtpPort(Number(e.target.value))} />
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={emailSaving}
                  onClick={async () => {
                    setEmailSaving(true)
                    try {
                      const payload: Record<string, unknown> = {
                        email_enabled: emailEnabled,
                        email_imap_host: emailImapHost,
                        email_imap_port: emailImapPort,
                        email_imap_user: emailImapUser,
                        email_smtp_host: emailSmtpHost,
                        email_smtp_port: emailSmtpPort,
                      }
                      if (emailImapPassword) payload.email_imap_password = emailImapPassword
                      await updateSite(siteId, payload)
                      setEmailSaved(true)
                      setTimeout(() => setEmailSaved(false), 2000)
                    } catch { /* ошибка */ } finally { setEmailSaving(false) }
                  }}
                >
                  {emailSaved ? "Сохранено!" : emailSaving ? "Сохранение..." : "Сохранить email-настройки"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Как подключить mail.ru</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Войдите в почту mail.ru</li>
                  <li>Перейдите в <strong>Настройки → Безопасность</strong></li>
                  <li>В разделе «Пароль для внешних приложений» создайте новый пароль</li>
                  <li>Включите IMAP в <strong>Настройки → Все настройки → Почтовые программы</strong></li>
                  <li>Вставьте логин и пароль приложения в поля выше</li>
                  <li>Нажмите «Сохранить» — входящие письма начнут появляться как лиды</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <TemplatesManager siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TemplatesManager({ siteId }: { siteId: number }) {
  const [templates, setTemplates] = useState<ApiTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ApiTemplate | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ title: "", content: "" })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reload = () => {
    setLoading(true)
    fetchTemplates({ site: siteId })
      .then((r) => setTemplates(r.results))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [siteId])

  const startAdd = () => {
    setEditing(null)
    setDraft({ title: "", content: "" })
    setError(null)
    setAdding(true)
  }

  const startEdit = (t: ApiTemplate) => {
    setAdding(false)
    setEditing(t)
    setDraft({ title: t.title, content: t.content })
    setError(null)
  }

  const cancel = () => {
    setAdding(false)
    setEditing(null)
    setError(null)
  }

  const save = async () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      setError("Название и текст обязательны.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (editing) {
        await updateTemplate(editing.id, draft)
      } else {
        await createTemplate({ site: siteId, ...draft })
      }
      cancel()
      reload()
    } catch {
      setError("Не удалось сохранить шаблон.")
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm("Удалить шаблон?")) return
    try {
      await deleteTemplate(id)
      reload()
    } catch {
      setError("Не удалось удалить шаблон.")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Reply className="size-5" />
            Шаблоны быстрых ответов
          </CardTitle>
          <CardDescription>
            Менеджеры смогут вставлять эти ответы в один клик при работе с чатами этого сайта.
          </CardDescription>
        </div>
        {!adding && !editing && (
          <Button onClick={startAdd} size="sm" className="gap-2">
            <Plus className="size-4" />
            Добавить
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {(adding || editing) && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {editing ? "Редактировать шаблон" : "Новый шаблон"}
              </span>
              <Button onClick={cancel} variant="ghost" size="icon" className="size-7">
                <X className="size-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                placeholder="Приветствие"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Текст ответа</Label>
              <Textarea
                rows={4}
                placeholder="Здравствуйте! Чем можем помочь?"
                value={draft.content}
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
              />
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancel} disabled={submitting}>
                Отмена
              </Button>
              <Button size="sm" onClick={save} disabled={submitting} className="gap-2">
                <Save className="size-4" />
                {submitting ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Загрузка...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Шаблонов пока нет. Добавьте первый — он появится в интерфейсе менеджера.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {templates.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{t.title}</span>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button onClick={() => startEdit(t)} variant="ghost" size="icon" className="size-8">
                    <Pencil className="size-4" />
                  </Button>
                  <Button onClick={() => remove(t.id)} variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
