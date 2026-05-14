"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { MessageSquare, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api"

function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const mode = params.get("mode") ?? "invite"

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const isReset = mode === "reset"
  const title = isReset ? "Новый пароль" : "Добро пожаловать!"
  const description = isReset
    ? "Придумайте новый пароль для входа в систему."
    : "Для активации аккаунта задайте пароль."

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError("Пароли не совпадают"); return }
    if (password.length < 8) { setError("Минимум 8 символов"); return }
    setError("")
    setLoading(true)
    try {
      await apiFetch("/api/auth/set-password/", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      })
      setDone(true)
    } catch (err: unknown) {
      const e = err as Record<string, unknown>
      const msg = (e.token as string[])?.[0] || (e.password as string[])?.[0] || "Ошибка. Попробуйте снова."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <p className="text-center text-destructive text-sm">
        Неверная ссылка. Запросите новое приглашение у администратора.
      </p>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="size-12 text-green-500" />
        <p className="text-sm text-muted-foreground">
          Пароль задан. Теперь вы можете войти в систему.
        </p>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Войти
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          placeholder="Минимум 8 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Подтвердите пароль</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="Повторите пароль"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : "Задать пароль"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          Войти в аккаунт
        </Link>
      </p>
    </form>
  )

  return null
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="size-6 text-primary" />
            <span className="font-bold text-lg">MultiChat Hub</span>
          </div>
          <CardTitle className="text-xl">Задайте пароль</CardTitle>
          <CardDescription>Придумайте надёжный пароль для вашего аккаунта</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Загрузка...</p>}>
            <SetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
