"use client"

import { useEffect, useRef, useCallback } from "react"
import { connectNotificationsWS, apiFetch } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const wsRef = useRef<WebSocket | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        // Создаём простой beep через AudioContext
        const ctx = new AudioContext()
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.frequency.value = 800
        oscillator.type = "sine"
        gain.gain.value = 0.1
        oscillator.start()
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        oscillator.stop(ctx.currentTime + 0.5)
      }
    } catch {
      // AudioContext may not be available
    }
  }, [])

  const showDesktopNotification = useCallback((title: string, body: string) => {
    if (!("Notification" in window)) return
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon.svg" })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission()
    }
  }, [])

  // Heartbeat — каждые 2 минуты для автоопределения online/offline
  useEffect(() => {
    const sendHeartbeat = () => {
      apiFetch("/api/chats/heartbeat/", { method: "POST" }).catch(() => {})
    }
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 120_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Запросить разрешение на уведомления при загрузке
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const ws = connectNotificationsWS()
    if (!ws) return

    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case "new_chat": {
            const title = "Новая заявка"
            const body = `${data.client_name || "Клиент"} — ${data.channel === "telegram" ? "Telegram" : "Виджет"}`
            toast({ title, description: body })
            playSound()
            if (document.hidden) showDesktopNotification(title, body)
            break
          }
          case "chat_assigned": {
            const title = "Назначена заявка"
            const body = `Вам назначена заявка #${data.chat_id}`
            toast({ title, description: body })
            playSound()
            if (document.hidden) showDesktopNotification(title, body)
            break
          }
          case "new_message": {
            const title = "Новое сообщение"
            const body = data.content?.slice(0, 100) || "Новое сообщение в чате"
            toast({ title, description: body })
            playSound()
            if (document.hidden) showDesktopNotification(title, body)
            break
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(() => {
        wsRef.current = connectNotificationsWS()
      }, 5000)
    }

    return () => {
      ws.close()
    }
  }, [toast, playSound, showDesktopNotification])

  return <>{children}</>
}
