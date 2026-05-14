"use client"

import { useEffect, useState } from "react"
import { useRoleGuard } from "@/hooks/use-role-guard"
import { Globe, Mail, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchSites, type ApiSite } from "@/lib/api"

export default function IntegrationsPage() {
  useRoleGuard(["admin"])
  const [sites, setSites] = useState<ApiSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSites()
      .then((data) => setSites(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hasWidget = sites.length > 0
  const hasEmail = sites.some((s) => !!s.email_enabled)
  const emailSites = sites.filter((s) => !!s.email_enabled)

  const integrations = [
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
      id: "email",
      name: "Email-канал",
      description: hasEmail
        ? `Подключено на ${emailSites.length} ${emailSites.length === 1 ? "сайте" : "сайтах"}`
        : "Принимайте обращения с корпоративной почты по протоколам IMAP/SMTP",
      icon: Mail,
      color: "bg-sky-500",
      connected: hasEmail,
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
                  Не подключено
                </span>
              )}
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
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
