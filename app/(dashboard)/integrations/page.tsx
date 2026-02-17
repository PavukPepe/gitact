"use client"

import { useEffect, useState } from "react"
import { Send, Globe, MessageCircle, Bot, Zap, CheckCircle2, Building2, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchSites, type ApiSite } from "@/lib/api"

export default function IntegrationsPage() {
  const [sites, setSites] = useState<ApiSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSites()
      .then((data) => setSites(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hasTelegram = sites.some((s) => !!s.telegram_bot_token)
  const hasWidget = sites.length > 0
  const telegramSites = sites.filter((s) => !!s.telegram_bot_token)

  const integrations = [
    {
      id: "telegram",
      name: "Telegram",
      description: hasTelegram
        ? `Подключено на ${telegramSites.length} ${telegramSites.length === 1 ? "сайте" : "сайтах"}`
        : "Подключите Telegram бота для получения сообщений из мессенджера",
      icon: Send,
      color: "bg-sky-500",
      connected: hasTelegram,
    },
    {
      id: "website",
      name: "Виджет на сайт",
      description: hasWidget
        ? `Установлен на ${sites.length} ${sites.length === 1 ? "сайте" : "сайтах"}`
        : "Установите виджет чата на ваш сайт для общения с посетителями",
      icon: Globe,
      color: "bg-emerald-500",
      connected: hasWidget,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Интеграция с WhatsApp Business API для общения с клиентами",
      icon: MessageCircle,
      color: "bg-green-500",
      connected: false,
      comingSoon: true,
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      description: "Автоматические ответы с помощью искусственного интеллекта",
      icon: Bot,
      color: "bg-violet-500",
      connected: false,
      comingSoon: true,
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Автоматизация рабочих процессов с тысячами приложений",
      icon: Zap,
      color: "bg-orange-500",
      connected: false,
      comingSoon: true,
    },
    {
      id: "bitrix24",
      name: "Bitrix24",
      description: "Интеграция с CRM Битрикс24 для управления клиентами и сделками",
      icon: Building2,
      color: "bg-blue-600",
      connected: false,
      comingSoon: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Интеграции</h1>
        <p className="text-muted-foreground">
          Подключите внешние сервисы для расширения возможностей
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative overflow-hidden">
            {integration.comingSoon && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="text-xs">
                  Скоро
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg ${integration.color} flex items-center justify-center`}>
                  <integration.icon className="size-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {loading ? "Загрузка..." : integration.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              {integration.connected ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span className="text-sm font-medium">Подключено</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {integration.comingSoon ? "Скоро" : "Не подключено"}
                </span>
              )}
              {(integration.id === "telegram" || integration.id === "website") ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent gap-1"
                  asChild
                >
                  <Link href="/sites">
                    Настроить
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant={integration.connected ? "outline" : "default"}
                  size="sm"
                  disabled={integration.comingSoon}
                >
                  {integration.connected ? "Настроить" : "Подключить"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
