import type {
  StatsOverview, ManagerStats, TimelineItem, RatingsStats, SiteStats,
} from "@/lib/api"
import { TimelineChart, StatusPie, RatingsBar } from "@/components/dashboard-charts"

// ─── Палитра — синхронизирована с дашбордом ─────────────────────────────────
const COLOR = {
  primary: "#ea580c",        // orange-600 — соответствует light-теме (oklch 0.7 0.18 45)
  primarySoft: "#fff7ed",    // orange-50
  primaryEdge: "#fdba74",    // orange-300
  text: "#0f172a",           // slate-900
  textMuted: "#64748b",      // slate-500
  textSubtle: "#94a3b8",     // slate-400
  border: "#e2e8f0",         // slate-200
  borderSoft: "#f1f5f9",     // slate-100
  bgCard: "#f8fafc",         // slate-50
  // status colors — зеркалят дашбордные классы bg-blue-500 / bg-amber-500 / bg-emerald-500 / bg-slate-400
  statusNew: "#3b82f6",
  statusInProgress: "#f59e0b",
  statusReplied: "#10b981",
  statusClosed: "#94a3b8",
  // online indicator
  onlineFill: "#dcfce7",
  onlineText: "#16a34a",
  offlineFill: "#f1f5f9",
  offlineText: "#64748b",
} as const

// Без CSS-переменных: html2canvas срезает все стайлшиты,
// поэтому опираемся на имя 'Montserrat' (инжектим его в onclone) и web-safe фолбэки.
const FONT = "'Montserrat', 'Trebuchet MS', 'Lucida Sans Unicode', sans-serif"

// ─── Утилиты ────────────────────────────────────────────────────────────────
function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return "—"
  if (seconds < 60) return "< 1 мин"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
}

function responseTimeColor(seconds: number | null): string {
  if (seconds === null) return COLOR.textMuted
  if (seconds <= 300) return "#16a34a"   // emerald-600
  if (seconds <= 1800) return "#d97706"  // amber-600
  return "#dc2626"                       // red-600
}

interface StatsPDFReportProps {
  stats: StatsOverview | null
  managerStats: ManagerStats[]
  siteStats: SiteStats[]
  monthlyTimeline: TimelineItem[]
  yearlyTimeline: TimelineItem[]
  ratingsStats: RatingsStats | null
  generatedAt: Date
}

export function StatsPDFReport({
  stats,
  managerStats,
  siteStats,
  monthlyTimeline,
  yearlyTimeline,
  ratingsStats,
  generatedAt,
}: StatsPDFReportProps) {
  const totalChats = stats?.total_chats || 1
  const statusRows = [
    { label: "Новые", count: stats?.by_status?.new ?? 0, color: "bg-blue-500" },
    { label: "В обработке", count: stats?.by_status?.in_progress ?? 0, color: "bg-amber-500" },
    { label: "Ответ дан", count: stats?.by_status?.replied ?? 0, color: "bg-emerald-500" },
    { label: "Закрытые", count: stats?.by_status?.closed ?? 0, color: "bg-slate-400" },
  ]

  // Стили таблиц
  const th: React.CSSProperties = {
    backgroundColor: COLOR.borderSoft,
    border: `1px solid ${COLOR.border}`,
    padding: "8px 10px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 600,
    color: COLOR.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  }
  const thCenter: React.CSSProperties = { ...th, textAlign: "center" }
  const td: React.CSSProperties = {
    border: `1px solid ${COLOR.border}`,
    padding: "8px 10px",
    fontSize: 11,
    color: COLOR.text,
  }
  const tdCenter: React.CSSProperties = { ...td, textAlign: "center" }
  const sectionTitle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    margin: "0 0 12px",
    color: COLOR.text,
    fontFamily: FONT,
  }

  return (
    <div
      style={{
        fontFamily: FONT,
        backgroundColor: "#ffffff",
        color: COLOR.text,
        padding: "32px 40px",
        width: 794,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{
        borderBottom: `2px solid ${COLOR.primary}`,
        paddingBottom: 14,
        marginBottom: 24,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: COLOR.text, fontFamily: FONT }}>
            Отчёт по статистике
          </h1>
          <p style={{ fontSize: 11, color: COLOR.textMuted, margin: "4px 0 0", fontFamily: FONT }}>
            Сгенерировано: {generatedAt.toLocaleString("ru-RU")}
          </p>
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: COLOR.primary,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: FONT,
        }}>
          MultiChat
        </div>
      </div>

      {/* Сводные карточки — копия верхнего ряда дашборда */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Всего чатов", value: stats?.total_chats ?? 0, sub: `+${stats?.new_today ?? 0} сегодня` },
          { label: "Новые сегодня", value: stats?.new_today ?? 0, sub: `${stats?.active_chats ?? 0} активных` },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              flex: 1,
              border: `1px solid ${COLOR.border}`,
              borderRadius: 10,
              padding: "14px 16px",
              backgroundColor: COLOR.bgCard,
              fontFamily: FONT,
            }}
          >
            <div style={{ fontSize: 11, color: COLOR.textMuted, marginBottom: 4, fontWeight: 500 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: COLOR.text, lineHeight: 1.1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 10, color: COLOR.textMuted, marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Pie — статусы */}
      <h2 style={sectionTitle}>Распределение по статусам</h2>
      <div style={{
        border: `1px solid ${COLOR.border}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 24,
        height: 220,
      }}>
        <StatusPie rows={statusRows} total={totalChats} />
      </div>

      {/* Line — динамика */}
      <h2 style={sectionTitle}>Динамика обращений</h2>
      <div style={{
        border: `1px solid ${COLOR.border}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 24,
        height: 220,
      }}>
        <TimelineChart data={monthlyTimeline.length ? monthlyTimeline : yearlyTimeline} />
      </div>

      {/* Manager stats */}
      {managerStats.length > 0 && (
        <>
          <h2 style={sectionTitle}>Статистика по менеджерам</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontFamily: FONT, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "32%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
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
              {managerStats.map((m, i) => (
                <tr key={m.id} style={i % 2 === 1 ? { backgroundColor: COLOR.bgCard } : {}}>
                  <td style={td}>
                    <div style={{ fontWeight: 500, wordBreak: "break-word" }}>{m.name || m.email}</div>
                    <div style={{ fontSize: 10, color: COLOR.textSubtle, wordBreak: "break-all" }}>{m.email}</div>
                  </td>
                  <td style={tdCenter}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 500,
                      backgroundColor: m.status === "online" ? COLOR.onlineFill : COLOR.offlineFill,
                      color: m.status === "online" ? COLOR.onlineText : COLOR.offlineText,
                    }}>
                      {m.status === "online" ? "Онлайн" : "Офлайн"}
                    </span>
                  </td>
                  <td style={{ ...tdCenter, fontWeight: 600 }}>{m.closed_chats}</td>
                  <td style={{ ...tdCenter, color: COLOR.textMuted }}>{m.active_chats}</td>
                  <td style={{ ...tdCenter, color: responseTimeColor(m.avg_response_time), fontWeight: 500 }}>
                    {formatResponseTime(m.avg_response_time)}
                  </td>
                  <td style={tdCenter}>
                    {m.avg_rating ? `★ ${m.avg_rating}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Site stats */}
      {siteStats.length > 0 && (
        <>
          <h2 style={sectionTitle}>Статистика по сайтам</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontFamily: FONT, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "36%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={th}>Сайт</th>
                <th style={thCenter}>Всего</th>
                <th style={thCenter}>Активных</th>
                <th style={thCenter}>Закрыто</th>
                <th style={thCenter}>Скорость ответа</th>
                <th style={thCenter}>Оценка</th>
              </tr>
            </thead>
            <tbody>
              {siteStats.map((s, i) => (
                <tr key={s.id} style={i % 2 === 1 ? { backgroundColor: COLOR.bgCard } : {}}>
                  <td style={td}>
                    <div style={{ fontWeight: 500, wordBreak: "break-word" }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: COLOR.textSubtle, wordBreak: "break-all" }}>{s.url}</div>
                  </td>
                  <td style={{ ...tdCenter, fontWeight: 600 }}>{s.total_chats}</td>
                  <td style={{ ...tdCenter, color: COLOR.textMuted }}>{s.active_chats}</td>
                  <td style={tdCenter}>{s.closed_chats}</td>
                  <td style={{ ...tdCenter, color: responseTimeColor(s.avg_response_time), fontWeight: 500 }}>
                    {formatResponseTime(s.avg_response_time)}
                  </td>
                  <td style={tdCenter}>
                    {s.avg_rating ? `★ ${s.avg_rating}` : "—"}
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
          <h2 style={sectionTitle}>Оценки качества</h2>
          <p style={{ fontSize: 11, color: COLOR.textMuted, margin: "0 0 12px", fontFamily: FONT }}>
            Средняя оценка: <strong style={{ color: COLOR.text }}>{ratingsStats.avg_rating ?? "—"}</strong> из 5
            ({ratingsStats.total_ratings} оценок)
          </p>
          <div style={{
            border: `1px solid ${COLOR.border}`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            height: 200,
          }}>
            <RatingsBar distribution={ratingsStats.distribution} />
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${COLOR.border}`, paddingTop: 12, marginTop: 8 }}>
        <p style={{ fontSize: 10, color: COLOR.textSubtle, margin: 0, fontFamily: FONT }}>
          MultiChat — система управления обращениями · {generatedAt.toLocaleDateString("ru-RU")}
        </p>
      </div>
    </div>
  )
}
