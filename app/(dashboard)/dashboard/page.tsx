"use client"

import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useRoleGuard } from "@/hooks/use-role-guard"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { CalendarIcon, MessageSquare, Users, Globe, TrendingUp, ArrowUpRight, Star, BarChart3, Clock, CheckCircle2, FileDown, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  fetchStatsOverview, fetchChats,
  fetchStatsTimeline, fetchRatingsStats, fetchManagerStats, fetchSiteStats,
  type StatsOverview, type ApiChat, type TimelineItem, type RatingsStats,
  type ManagerStats, type SiteStats,
} from "@/lib/api"
import { StatsPDFReport } from "@/components/stats-pdf-report"
import { TimelineChart, StatusPie, RatingsBar } from "@/components/dashboard-charts"
import { captureElementToPDF } from "@/lib/pdf-export"

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return "—"
  if (seconds < 60) return "< 1 мин"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
}

const PERIODS = [
  { label: "Сегодня", value: "today" },
  { label: "Неделя", value: "week" },
  { label: "Месяц", value: "month" },
]

export default function DashboardPage() {
  useRoleGuard(["admin", "rop"])
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [recentChats, setRecentChats] = useState<ApiChat[]>([])
  const [period, setPeriod] = useState("month")
  const [range, setRange] = useState<DateRange | undefined>()
  const dateFrom = range?.from ? format(range.from, "yyyy-MM-dd") : ""
  const dateTo = range?.to ? format(range.to, "yyyy-MM-dd") : ""
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [ratingsStats, setRatingsStats] = useState<RatingsStats | null>(null)
  const [managerStats, setManagerStats] = useState<ManagerStats[]>([])
  const [siteStats, setSiteStats] = useState<SiteStats[]>([])
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [yearlyTimeline, setYearlyTimeline] = useState<TimelineItem[]>([])
  const reportRef = useRef<HTMLDivElement>(null)

  const buildStatsParams = (): Record<string, string> => {
    if (period === "custom") {
      const params: Record<string, string> = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      return params
    }
    return { period }
  }

  useEffect(() => {
    if (period === "custom" && !dateFrom && !dateTo) return
    const params = buildStatsParams()
    fetchStatsOverview(params).then(setStats).catch(() => {})
    fetchStatsTimeline(params).then((r) => setTimeline(r.timeline)).catch(() => {})
    fetchManagerStats(params).then(setManagerStats).catch(() => {})
    fetchSiteStats(params).then(setSiteStats).catch(() => {})
    fetchRatingsStats(params).then(setRatingsStats).catch(() => {})
  }, [period, dateFrom, dateTo])

  useEffect(() => {
    fetchChats({ page_size: "5" }).then((r) => setRecentChats(r.results)).catch(() => {})
  }, [])

  const handleExportPDF = async () => {
    setExporting(true)
    setExportError(null)
    try {
      // Загружаем годовые данные
      const yearAgo = new Date()
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      const dateFrom = yearAgo.toISOString().split("T")[0]
      const dateTo = new Date().toISOString().split("T")[0]
      const yearly = await fetchStatsTimeline({ date_from: dateFrom, date_to: dateTo })

      // flushSync гарантирует, что React обновит DOM синхронно перед захватом
      flushSync(() => setYearlyTimeline(yearly.timeline))

      if (!reportRef.current) {
        throw new Error("Элемент отчёта не найден")
      }

      const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")
      await captureElementToPDF(reportRef.current, `statistics-${date}.pdf`)
    } catch (err) {
      console.error("[PDF export]", err)
      setExportError("Не удалось создать PDF. Проверьте консоль.")
    } finally {
      setExporting(false)
    }
  }

  const statCards = [
    {
      title: "Всего чатов",
      value: stats?.total_chats ?? 0,
      change: `+${stats?.new_today ?? 0} сегодня`,
      icon: MessageSquare,
    },
    {
      title: "Новые сегодня",
      value: stats?.new_today ?? 0,
      change: `${stats?.active_chats ?? 0} активных`,
      icon: TrendingUp,
    },
  ]

  const totalChats = stats?.total_chats || 1
  const statusRows = [
    { label: "Новые", count: stats?.by_status?.new ?? 0, color: "bg-blue-500" },
    { label: "В обработке", count: stats?.by_status?.in_progress ?? 0, color: "bg-amber-500" },
    { label: "Ответ дан", count: stats?.by_status?.replied ?? 0, color: "bg-emerald-500" },
    { label: "Закрытые", count: stats?.by_status?.closed ?? 0, color: "bg-slate-400" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Обзор активности вашего чат-сервиса
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <Button
                  key={p.value}
                  variant={period === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPeriod(p.value)
                    setRange(undefined)
                  }}
                >
                  {p.label}
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={period === "custom" ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "gap-2 font-normal",
                      period !== "custom" && !range?.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {range?.from ? (
                      range.to ? (
                        <>
                          {format(range.from, "d MMM", { locale: ru })} —{" "}
                          {format(range.to, "d MMM yyyy", { locale: ru })}
                        </>
                      ) : (
                        format(range.from, "d MMM yyyy", { locale: ru })
                      )
                    ) : (
                      "Диапазон"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={(r) => {
                      setRange(r)
                      if (r?.from) setPeriod("custom")
                    }}
                    numberOfMonths={2}
                    locale={ru}
                    defaultMonth={range?.from}
                  />
                  <div className="flex justify-end gap-2 border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRange(undefined)
                        setPeriod("month")
                      }}
                      disabled={!range?.from}
                    >
                      Сбросить
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleExportPDF} disabled={exporting} variant="outline" size="sm">
              {exporting ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="size-4 mr-2" />
              )}
              {exporting ? "Экспорт..." : "Экспорт PDF"}
            </Button>
          </div>
          {exportError && (
            <p className="text-xs text-destructive">{exportError}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="size-3 text-emerald-500" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Распределение по статусам</CardTitle>
            <CardDescription className="text-xs">
              Всего {totalChats === 1 && stats?.total_chats !== 1 ? 0 : totalChats}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <StatusPie rows={statusRows} total={totalChats} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* График динамики обращений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Динамика обращений
          </CardTitle>
          <CardDescription>Количество новых заявок по дням</CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет данных за выбранный период
            </p>
          ) : (
            <div className="h-64">
              <TimelineChart data={timeline} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние чаты</CardTitle>
          <CardDescription>Недавние входящие сообщения</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            {recentChats.length === 0 && (
              <p className="text-sm text-muted-foreground">Нет чатов</p>
            )}
            {recentChats.map((chat) => (
              <div key={chat.id} className="flex items-center gap-4">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {(chat.client_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">{chat.client_name || "Без имени"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {chat.last_message?.content || "Нет сообщений"}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {chat.channel === "email" ? "Mail" : "Web"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Статистика по менеджерам */}
      {managerStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Статистика по менеджерам
            </CardTitle>
            <CardDescription>Эффективность команды за выбранный период</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Менеджер</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Статус</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        Обработано
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Активных</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="size-3.5" />
                        Скорость ответа
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Оценка</th>
                  </tr>
                </thead>
                <tbody>
                  {managerStats.map((m, i) => (
                    <tr key={m.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.name || m.email}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={m.status === "online" ? "default" : "secondary"}
                          className="text-[10px] px-2 py-0 h-5"
                        >
                          <span className={`size-1.5 rounded-full mr-1.5 inline-block ${m.status === "online" ? "bg-emerald-400" : "bg-slate-400"}`} />
                          {m.status === "online" ? "Онлайн" : "Офлайн"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{m.closed_chats}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{m.active_chats}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={m.avg_response_time === null ? "text-muted-foreground" : m.avg_response_time <= 300 ? "text-emerald-600 font-medium" : m.avg_response_time <= 1800 ? "text-amber-600 font-medium" : "text-red-500 font-medium"}>
                          {formatResponseTime(m.avg_response_time)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.avg_rating ? (
                          <span className="flex items-center justify-center gap-1">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{m.avg_rating}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Статистика по сайтам */}
      {siteStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5" />
              Статистика по сайтам
            </CardTitle>
            <CardDescription>Активность по каждому подключённому сайту</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Сайт</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <MessageSquare className="size-3.5" />
                        Всего
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Активных</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        Закрыто
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="size-3.5" />
                        Скорость ответа
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Оценка</th>
                  </tr>
                </thead>
                <tbody>
                  {siteStats.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-65">{s.url}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{s.total_chats}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{s.active_chats}</td>
                      <td className="px-4 py-3 text-center">{s.closed_chats}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={s.avg_response_time === null ? "text-muted-foreground" : s.avg_response_time <= 300 ? "text-emerald-600 font-medium" : s.avg_response_time <= 1800 ? "text-amber-600 font-medium" : "text-red-500 font-medium"}>
                          {formatResponseTime(s.avg_response_time)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.avg_rating ? (
                          <span className="flex items-center justify-center gap-1">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{s.avg_rating}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Оценки */}
      {ratingsStats && ratingsStats.total_ratings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5" />
              Оценки качества
            </CardTitle>
            <CardDescription>
              Средняя оценка: {ratingsStats.avg_rating ?? "—"} из 5 ({ratingsStats.total_ratings} оценок)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <RatingsBar distribution={ratingsStats.distribution} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Скрытый блок для экспорта PDF — всегда в DOM */}
      <div
        ref={reportRef}
        style={{ position: "absolute", top: 0, left: "-9999px", width: 794, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <StatsPDFReport
          stats={stats}
          managerStats={managerStats}
          siteStats={siteStats}
          monthlyTimeline={timeline}
          yearlyTimeline={yearlyTimeline}
          ratingsStats={ratingsStats}
          generatedAt={new Date()}
        />
      </div>
    </div>
  )
}
