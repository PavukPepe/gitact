"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare, Check, ArrowRight, Zap, Building2, Rocket,
  Globe, Mail, BarChart3, Shield, Headphones, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { register, login } from "@/lib/api"
import { cn } from "@/lib/utils"

// ─── Тарифы ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "starter",
    name: "Старт",
    price: 0,
    priceLabel: "Бесплатно",
    description: "Для малого бизнеса и старта",
    icon: Zap,
    accent: "text-slate-600",
    badgeCls: "bg-slate-100 text-slate-600 border-slate-200",
    badge: null,
    ring: "ring-slate-200",
    features: [
      { text: "1 сайт", ok: true },
      { text: "До 5 менеджеров", ok: true },
      { text: "Виджет на сайте", ok: true },
      { text: "До 500 чатов / мес", ok: true },
      { text: "Email-канал", ok: false },
      { text: "Расширенная аналитика", ok: false },
      { text: "API-доступ", ok: false },
      { text: "Приоритетная поддержка", ok: false },
    ],
  },
  {
    id: "business",
    name: "Бизнес",
    price: 2990,
    priceLabel: "2 990 ₽",
    description: "Для растущих команд продаж",
    icon: Building2,
    accent: "text-primary",
    badgeCls: "bg-primary/10 text-primary border-primary/20",
    badge: "Популярный",
    ring: "ring-primary",
    features: [
      { text: "5 сайтов", ok: true },
      { text: "До 25 менеджеров", ok: true },
      { text: "Виджет на сайте", ok: true },
      { text: "Неограниченные чаты", ok: true },
      { text: "Email-канал (IMAP/SMTP)", ok: true },
      { text: "Расширенная аналитика", ok: true },
      { text: "API-доступ", ok: false },
      { text: "Приоритетная поддержка", ok: false },
    ],
  },
  {
    id: "enterprise",
    name: "Корпоратив",
    price: 9990,
    priceLabel: "9 990 ₽",
    description: "Для крупных компаний без ограничений",
    icon: Rocket,
    accent: "text-violet-600",
    badgeCls: "bg-violet-100 text-violet-700 border-violet-200",
    badge: "Максимум",
    ring: "ring-violet-500",
    features: [
      { text: "Без ограничений по сайтам", ok: true },
      { text: "Без ограничений по менеджерам", ok: true },
      { text: "Все каналы общения", ok: true },
      { text: "Неограниченные чаты", ok: true },
      { text: "Email-канал (IMAP/SMTP)", ok: true },
      { text: "Полная аналитика + отчёты", ok: true },
      { text: "API-доступ", ok: true },
      { text: "Приоритетная поддержка 24/7", ok: true },
    ],
  },
]

// ─── Страница ─────────────────────────────────────────────────────────────────

export default function JoinPage() {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [form, setForm] = useState({ first_name: "", organization_name: "", email: "", password: "" })
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return
    if (!consent) {
      setError("Необходимо согласие на обработку персональных данных.")
      return
    }
    setError("")
    setLoading(true)
    try {
      await register({ ...form, plan: selectedPlan, consent_pdn: true })
      await login(form.email, form.password)
      router.push("/chats")
    } catch (err: unknown) {
      const e = err as Record<string, unknown>
      const msg =
        (e?.email as string[])?.[0] ||
        (e?.password as string[])?.[0] ||
        (e?.organization_name as string[])?.[0] ||
        (e?.consent_pdn as string[])?.[0] ||
        (e as { detail?: string })?.detail ||
        "Ошибка регистрации. Проверьте данные."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const plan = PLANS.find(p => p.id === selectedPlan)

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base">MultiChat Hub</span>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm">Войти</Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-6 pt-14 pb-10 text-center">
        <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
          Мультиканальная CRM для онлайн-поддержки
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          Все обращения клиентов —<br />
          <span className="text-primary">в одном окне</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-base">
          Виджет на сайте и корпоративный email в единой очереди. Назначайте менеджеров,
          отслеживайте статусы, анализируйте эффективность.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {[
            { icon: Globe, text: "Виджет за 5 минут" },
            { icon: Mail, text: "Email-канал" },
            { icon: BarChart3, text: "Аналитика" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-primary" />{text}
            </span>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Pricing ── */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-1">Выберите тариф</h2>
          <p className="text-muted-foreground text-sm">Начните бесплатно, масштабируйтесь по мере роста</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => {
            const Icon = p.icon
            const isSelected = selectedPlan === p.id
            return (
              <Card
                key={p.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-150",
                  isSelected
                    ? `ring-2 ${p.ring} shadow-md`
                    : "hover:shadow-sm hover:border-border/80"
                )}
                onClick={() => handleSelectPlan(p.id)}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={cn("text-xs font-semibold px-3", p.badgeCls)}>
                      {p.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className={cn("size-9 rounded-lg bg-muted flex items-center justify-center mb-2", p.accent)}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription className="text-xs">{p.description}</CardDescription>
                  <div className="pt-1">
                    <span className="text-2xl font-extrabold">{p.priceLabel}</span>
                    {p.price > 0 && <span className="text-muted-foreground text-xs ml-1">/ мес</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pb-4">
                  {p.features.map((f) => (
                    <div key={f.text} className={cn("flex items-center gap-2 text-sm", !f.ok && "opacity-40")}>
                      {f.ok
                        ? <Check className="size-3.5 text-emerald-500 shrink-0" />
                        : <X className="size-3.5 text-muted-foreground shrink-0" />}
                      <span>{f.text}</span>
                    </div>
                  ))}
                  <div className="pt-3">
                    <Button
                      className="w-full"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={e => { e.stopPropagation(); handleSelectPlan(p.id) }}
                    >
                      {isSelected ? <>Выбран <Check className="size-3.5 ml-1" /></> : <>Выбрать <ArrowRight className="size-3.5 ml-1" /></>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Registration Form ── */}
      <div ref={formRef} />

      {selectedPlan && (
        <section className="mx-auto max-w-md px-6 pb-16">
          <Card className="shadow-sm">
            <CardHeader>
              {/* Chosen plan strip */}
              <div className={cn(
                "flex items-center gap-2.5 -mx-6 -mt-6 mb-4 px-6 pt-4 pb-3 rounded-t-lg border-b",
                "bg-muted/50"
              )}>
                {plan && <plan.icon className={cn("size-4 shrink-0", plan.accent)} />}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Тариф: </span>
                  <span className="text-sm font-semibold">{plan?.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">— {plan?.priceLabel}{plan?.price ? " / мес" : ""}</span>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>
              <CardTitle className="text-xl">Создать аккаунт</CardTitle>
              <CardDescription>
                Вы станете администратором своей организации и сможете приглашать менеджеров.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Ваше имя</Label>
                    <Input
                      placeholder="Иван"
                      value={form.first_name}
                      onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Организация</Label>
                    <Input
                      placeholder="ООО Компания"
                      value={form.organization_name}
                      onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="admin@company.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Пароль</Label>
                  <Input
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={8}
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 cursor-pointer"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    required
                  />
                  <span>
                    Я согласен на обработку персональных данных в соответствии с{" "}
                    <a
                      href="http://www.consultant.ru/document/cons_doc_LAW_61801/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      ФЗ-152
                    </a>{" "}
                    и принимаю условия использования сервиса.
                  </span>
                </label>

                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={loading || !consent}>
                  {loading ? "Создание аккаунта..." : <>Зарегистрироваться <ArrowRight className="size-4" /></>}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Уже есть аккаунт?{" "}
                  <Link href="/login" className="text-primary hover:underline">Войти</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Features ── */}
      {!selectedPlan && (
        <section className="border-t bg-background py-10">
          <div className="mx-auto max-w-5xl px-6 grid gap-6 md:grid-cols-3 text-center">
            {[
              { icon: Shield, title: "Безопасность", text: "JWT, раздельный доступ по ролям, шифрование данных" },
              { icon: Zap, title: "Быстрый старт", text: "Виджет подключается за 5 минут — один тег script на сайт" },
              { icon: Headphones, title: "Все каналы", text: "Виджет на сайте и email в одной очереди — клиент не теряется" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="space-y-2">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Icon className="size-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t py-5 text-center text-xs text-muted-foreground">
        © 2025 MultiChat Hub. Все права защищены.
      </footer>
    </div>
  )
}
