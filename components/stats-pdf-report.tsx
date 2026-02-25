import type { StatsOverview, ManagerStats, TimelineItem, RatingsStats } from "@/lib/api"

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return "—"
  if (seconds < 60) return "< 1 мин"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
}

function aggregateByMonth(timeline: TimelineItem[]): { month: string; count: number }[] {
  const map: Record<string, number> = {}
  for (const item of timeline) {
    const month = item.date.substring(0, 7)
    map[month] = (map[month] || 0) + item.count
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
}

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-")
  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
  return `${months[parseInt(month) - 1]} ${year}`
}

interface StatsPDFReportProps {
  stats: StatsOverview | null
  managerStats: ManagerStats[]
  monthlyTimeline: TimelineItem[]
  yearlyTimeline: TimelineItem[]
  ratingsStats: RatingsStats | null
  generatedAt: Date
}

export function StatsPDFReport({
  stats,
  managerStats,
  monthlyTimeline,
  yearlyTimeline,
  ratingsStats,
  generatedAt,
}: StatsPDFReportProps) {
  const monthlyByMonth = aggregateByMonth(monthlyTimeline)
  const yearlyByMonth = aggregateByMonth(yearlyTimeline)

  const th: React.CSSProperties = {
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
  }
  const td: React.CSSProperties = {
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
    fontSize: 11,
    color: "#1e293b",
  }
  const tdCenter: React.CSSProperties = { ...td, textAlign: "center" }
  const thCenter: React.CSSProperties = { ...th, textAlign: "center" }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#1e293b",
        padding: "32px 40px",
        width: 794,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: "2px solid #3b82f6", paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1e293b" }}>
          Отчёт по статистике
        </h1>
        <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>
          Сгенерировано: {generatedAt.toLocaleString("ru-RU")}
        </p>
      </div>

      {/* Summary */}
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#1e293b" }}>
        Сводная статистика
      </h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Всего заявок", value: stats?.total_chats ?? 0 },
          { label: "Активных", value: stats?.active_chats ?? 0 },
          { label: "Новых сегодня", value: stats?.new_today ?? 0 },
          { label: "Закрыто", value: stats?.closed_total ?? 0 },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              flex: 1,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "12px 14px",
              backgroundColor: "#f8fafc",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Status distribution */}
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#1e293b" }}>
        Распределение по статусам
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
        <thead>
          <tr>
            <th style={th}>Статус</th>
            <th style={thCenter}>Кол-во заявок</th>
            <th style={thCenter}>Доля</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: "Новые", key: "new" },
            { label: "В обработке", key: "in_progress" },
            { label: "Ответ дан", key: "replied" },
            { label: "Закрытые", key: "closed" },
          ].map((row) => {
            const count = stats?.by_status?.[row.key] ?? 0
            const total = stats?.total_chats || 1
            return (
              <tr key={row.key}>
                <td style={td}>{row.label}</td>
                <td style={tdCenter}>{count}</td>
                <td style={tdCenter}>{((count / total) * 100).toFixed(1)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Monthly timeline */}
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#1e293b" }}>
        Динамика обращений — последние 30 дней
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
        <thead>
          <tr>
            <th style={th}>Дата</th>
            <th style={thCenter}>Кол-во заявок</th>
          </tr>
        </thead>
        <tbody>
          {monthlyByMonth.length === 0 && (
            <tr><td colSpan={2} style={{ ...tdCenter, color: "#94a3b8" }}>Нет данных</td></tr>
          )}
          {monthlyByMonth.map((item) => (
            <tr key={item.month}>
              <td style={td}>{formatMonth(item.month)}</td>
              <td style={tdCenter}>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Yearly timeline */}
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#1e293b" }}>
        Динамика обращений — последние 12 месяцев
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
        <thead>
          <tr>
            <th style={th}>Месяц</th>
            <th style={thCenter}>Кол-во заявок</th>
          </tr>
        </thead>
        <tbody>
          {yearlyByMonth.length === 0 && (
            <tr><td colSpan={2} style={{ ...tdCenter, color: "#94a3b8" }}>Нет данных</td></tr>
          )}
          {yearlyByMonth.map((item) => (
            <tr key={item.month}>
              <td style={td}>{formatMonth(item.month)}</td>
              <td style={tdCenter}>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Manager stats */}
      {managerStats.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#1e293b" }}>
            Статистика по менеджерам
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
            <thead>
              <tr>
                <th style={th}>Менеджер</th>
                <th style={thCenter}>Статус</th>
                <th style={thCenter}>Обработано</th>
                <th style={thCenter}>Активных</th>
                <th style={thCenter}>Скорость ответа</th>
                <th style={thCenter}>Оценка</th>
              </tr>
            </thead>
            <tbody>
              {managerStats.map((m) => (
                <tr key={m.id}>
                  <td style={td}>
                    <div style={{ fontWeight: 500 }}>{m.name || m.email}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.email}</div>
                  </td>
                  <td style={tdCenter}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 500,
                      backgroundColor: m.status === "online" ? "#dcfce7" : "#f1f5f9",
                      color: m.status === "online" ? "#16a34a" : "#64748b",
                    }}>
                      {m.status === "online" ? "Онлайн" : "Офлайн"}
                    </span>
                  </td>
                  <td style={{ ...tdCenter, fontWeight: 600 }}>{m.closed_chats}</td>
                  <td style={tdCenter}>{m.active_chats}</td>
                  <td style={tdCenter}>{formatResponseTime(m.avg_response_time)}</td>
                  <td style={tdCenter}>
                    {m.avg_rating ? `★ ${m.avg_rating}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Ratings */}
      {ratingsStats && ratingsStats.total_ratings > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#1e293b" }}>
            Оценки качества
          </h2>
          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
            Средняя оценка: {ratingsStats.avg_rating ?? "—"} из 5 ({ratingsStats.total_ratings} оценок)
          </p>
          <table style={{ width: "40%", borderCollapse: "collapse", marginBottom: 12 }}>
            <thead>
              <tr>
                <th style={th}>Оценка</th>
                <th style={thCenter}>Количество</th>
                <th style={thCenter}>Доля</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingsStats.distribution[String(rating)] ?? 0
                const pct = ratingsStats.total_ratings > 0
                  ? ((count / ratingsStats.total_ratings) * 100).toFixed(1)
                  : "0.0"
                return (
                  <tr key={rating}>
                    <td style={td}>{"★".repeat(rating)}</td>
                    <td style={tdCenter}>{count}</td>
                    <td style={tdCenter}>{pct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 8 }}>
        <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
          MultiChat — система управления обращениями
        </p>
      </div>
    </div>
  )
}
