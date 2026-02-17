"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Save, Bot, Palette, MessageSquare, Send,
  Smartphone, Monitor, GripVertical, Clock, Reply, Link2, Copy, Check,
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
import { fetchSite, updateSite, setupTelegram, fetchWidgetCode, type ApiSite } from "@/lib/api"

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
  // Extra
  const [requireTelegram, setRequireTelegram] = useState(false)

  // Working hours
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "18:00",
    timezone: "Europe/Moscow",
  })

  // Auto-reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState("")

  // Telegram
  const [botToken, setBotToken] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [botUsername, setBotUsername] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [connectingBot, setConnectingBot] = useState(false)

  const [botError, setBotError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [copiedLink, setCopiedLink] = useState(false)
  const [embedCode, setEmbedCode] = useState("")
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  useEffect(() => {
    if (isNaN(siteId)) return
    loadSite()
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
      if (ws.requireTelegram !== undefined) {
        setRequireTelegram(ws.requireTelegram)
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

      // Telegram
      setBotToken(data.telegram_bot_token || "")
      setIsConnected(!!data.telegram_bot_token)

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
          requireTelegram,
        },
        working_hours: workingHours,
        auto_reply_enabled: autoReplyEnabled,
        auto_reply_message: autoReplyMessage,
        telegram_bot_token: botToken,
      } as any)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ошибка сохранения
    } finally {
      setSaving(false)
    }
  }

  const handleConnectBot = async () => {
    if (!botToken.trim()) return
    setBotError("")
    setConnectingBot(true)
    try {
      // Сначала сохраняем токен
      await updateSite(siteId, { telegram_bot_token: botToken } as any)
      // Затем регистрируем webhook
      const result = await setupTelegram(siteId)
      if (result.ok) {
        setIsConnected(true)
        setBotUsername(result.bot_username || "")
        setReferralLink(result.referral_link || "")
      }
    } catch (err: any) {
      const msg = err?.detail || "Ошибка подключения. Проверьте токен бота."
      setBotError(msg)
    } finally {
      setConnectingBot(false)
    }
  }

  const handleDisconnectBot = async () => {
    try {
      await updateSite(siteId, { telegram_bot_token: "" } as any)
      setBotToken("")
      setIsConnected(false)
      setBotUsername("")
      setReferralLink("")
    } catch {
      // ошибка отключения
    }
  }

  const handleCopyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
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

  const getMobileButtonSize = () => {
    switch (mobile.buttonSize) {
      case "small": return "size-12 text-xs"
      case "large": return "size-16 text-base"
      default: return "size-14 text-sm"
    }
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
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="widget" className="gap-2">
            <Palette className="size-4" />
            Виджет
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2">
            <Send className="size-4" />
            Telegram
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
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Обязательный Telegram</Label>
                    <p className="text-sm text-muted-foreground">
                      Требовать Telegram-никнейм от клиента
                    </p>
                  </div>
                  <Switch
                    checked={requireTelegram}
                    onCheckedChange={setRequireTelegram}
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
                        ? "w-full h-72"
                        : "w-[320px] h-[560px] border-8 border-foreground/20 rounded-[2rem]"
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

        {/* Telegram Settings Tab */}
        <TabsContent value="telegram" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bot Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="size-5" />
                  Подключение бота
                </CardTitle>
                <CardDescription>Подключите Telegram бота для этого сайта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    disabled={isConnected}
                  />
                  <p className="text-xs text-muted-foreground">
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Статус:</span>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Подключён" : "Не подключён"}
                  </Badge>
                </div>
                {isConnected && botUsername && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Бот:</span>
                    <span className="text-sm font-medium">@{botUsername}</span>
                  </div>
                )}
                {isConnected && referralLink && (
                  <div className="space-y-2">
                    <Label>Реферальная ссылка</Label>
                    <div className="flex items-center gap-2">
                      <Input value={referralLink} readOnly className="text-xs" />
                      <Button variant="outline" size="icon" onClick={handleCopyReferralLink}>
                        {copiedLink ? <Check className="size-4" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Клиенты могут перейти по этой ссылке для начала чата
                    </p>
                  </div>
                )}
                <Button
                  className="w-full"
                  variant={isConnected ? "outline" : "default"}
                  onClick={isConnected ? handleDisconnectBot : handleConnectBot}
                  disabled={connectingBot || (!isConnected && !botToken.trim())}
                >
                  {connectingBot ? "Подключение..." : isConnected ? "Отключить бота" : "Подключить бота"}
                </Button>
                {botError && (
                  <p className="text-sm text-destructive">{botError}</p>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Как подключить Telegram бота</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Откройте Telegram и найдите @BotFather</li>
                  <li>Отправьте команду /newbot и следуйте инструкциям</li>
                  <li>Скопируйте полученный токен и вставьте его в поле выше</li>
                  <li>Нажмите кнопку &quot;Подключить бота&quot;</li>
                  <li>Скопируйте реферальную ссылку и разместите на сайте</li>
                  <li>Готово! Сообщения из Telegram будут приходить в панель менеджера</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
