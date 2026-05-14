"use client"

import { useState } from "react"
import Link from "next/link"
import { MessageSquare, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await apiFetch("/api/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError("Что-то пошло не так. Попробуйте позже.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="size-6 text-primary" />
            <span className="font-bold text-lg">MultiChat Hub</span>
          </div>
          <CardTitle className="text-xl">Сброс пароля</CardTitle>
          <CardDescription>
            Введите email — мы отправим ссылку для создания нового пароля.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="size-12 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Если аккаунт с таким email существует, письмо уже отправлено.
                Проверьте почту.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">Вернуться к входу</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Отправка..." : "Отправить ссылку"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Вернуться к входу
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
