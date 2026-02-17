"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Users, Globe, TrendingUp, ArrowUpRight, Star, BarChart3 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  fetchStatsOverview, fetchChats, fetchSites, fetchUsers,
  fetchStatsTimeline, fetchRatingsStats,
  type StatsOverview, type ApiChat, type TimelineItem, type RatingsStats,
} from "@/lib/api"

const PERIODS = [
  { label: "Сегодня", value: "today" },
  { label: "Неделя", value: "week" },
  { label: "Месяц", value: "month" },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [recentChats, setRecentChats] = useState<ApiChat[]>([])
  const [sitesCount, setSitesCount] = useState(0)
  const [managersOnline, setManagersOnline] = useState(0)
  const [managersTotal, setManagersTotal] = useState(0)
  const [period, setPeriod] = useState("month")
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [ratingsStats, setRatingsStats] = useState<RatingsStats | null>(null)

  useEffect(() => {
    fetchStatsOverview({ period }).then(setStats).catch(() => {})
    fetchStatsTimeline({ period }).then((r) => setTimeline(r.timeline)).catch(() => {})
  }, [period])

  useEffect(() => {
    fetchChats({ page_size: "5" }).then((r) => setRecentChats(r.results)).catch(() => {})
    fetchSites().then((r) => setSitesCount(r.count)).catch(() => {})
    fetchUsers().then((r) => {
      setManagersTotal(r.count)
      setManagersOnline(r.results.filter((u) => u.is_active).length)
    }).catch(() => {})
    fetchRatingsStats().then(setRatingsStats).catch(() => {})
  }, [])

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
    {
      title: "Менеджеры",
      value: managersOnline,
      change: `${managersTotal} всего`,
      icon: Users,
    },
    {
      title: "Подключено сайтов",
      value: sitesCount,
      change: ratingsStats?.avg_rating ? `★ ${ratingsStats.avg_rating}` : "",
      icon: Globe,
    },
  ]

  const totalChats = stats?.total_chats || 1
  const statusRows = [
    { label: "Новые", count: stats?.by_status?.new ?? 0, color: "bg-blue-500" },
    { label: "В обработке", count: stats?.by_status?.in_progress ?? 0, color: "bg-amber-500" },
    { label: "Ответ дан", count: stats?.by_status?.replied ?? 0, color: "bg-emerald-500" },
    { label: "Закрытые", count: stats?.by_status?.closed ?? 0, color: "bg-slate-400" },
  ]

  // Вычисляем максимум для графика
  const maxCount = Math.max(1, ...timeline.map((t) => t.count))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Обзор активности вашего чат-сервиса
          </p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
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
            <div className="flex items-end gap-1 h-40">
              {timeline.map((item) => (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs text-muted-foreground">{item.count}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t-sm min-h-[4px] transition-all"
                    style={{ height: `${(item.count / maxCount) * 100}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Последние чаты</CardTitle>
            <CardDescription>Недавние входящие сообщения</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentChats.length === 0 && (
                <p className="text-sm text-muted-foreground">Нет чатов</p>
              )}
              {recentChats.map((chat) => (
                <div key={chat.id} className="flex items-center gap-4">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {(chat.client_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{chat.client_name || "Без имени"}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {chat.last_message?.content || "Нет сообщений"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chat.channel === "telegram" ? "TG" : "Web"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика по статусам</CardTitle>
            <CardDescription>Распределение чатов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusRows.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className={`size-3 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <div className="text-sm font-medium">{item.count}</div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${(item.count / totalChats) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingsStats.distribution[String(rating)] ?? 0
                const pct = ratingsStats.total_ratings > 0
                  ? (count / ratingsStats.total_ratings) * 100
                  : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm w-8">{rating} ★</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
