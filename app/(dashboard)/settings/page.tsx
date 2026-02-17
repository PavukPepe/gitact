"use client"

import { useState, useEffect } from "react"
import { Save, CreditCard, Building2, Clock, Mail, User, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProfile, updateProfile, changePassword, fetchUsers, fetchSites, type UserProfile } from "@/lib/api"

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    organization_name: "",
  })

  // Смена пароля
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Счётчики для тарифа
  const [sitesCount, setSitesCount] = useState(0)
  const [managersCount, setManagersCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [profileData, sitesData, usersData] = await Promise.all([
        getProfile(),
        fetchSites().catch(() => ({ results: [] })),
        fetchUsers().catch(() => ({ results: [] })),
      ])
      setProfile(profileData)
      setFormData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        organization_name: profileData.organization_name || "",
      })
      setSitesCount(sitesData.results.length)
      setManagersCount(usersData.results.length)
    } catch {
      // ошибка загрузки
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateProfile(formData)
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ошибка сохранения
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.old_password || !passwordData.new_password) return
    setPasswordSaving(true)
    setPasswordError("")
    try {
      await changePassword(passwordData.old_password, passwordData.new_password)
      setPasswordDialog(false)
      setPasswordData({ old_password: "", new_password: "" })
    } catch {
      setPasswordError("Не удалось сменить пароль. Проверьте текущий пароль.")
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const currentPlan = {
    name: "Pro",
    sitesLimit: 5,
    currentSites: sitesCount,
    managersLimit: 10,
    currentManagers: managersCount,
    price: 2990,
    billingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted-foreground">
            Управление аккаунтом и тарифным планом
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-2" />
          {saved ? "Сохранено!" : saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              Компания
            </CardTitle>
            <CardDescription>
              Информация о вашей компании
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization_name">Название компании</Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) =>
                  setFormData({ ...formData, organization_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email используется для входа и не может быть изменён
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Тарифный план
            </CardTitle>
            <CardDescription>
              Ваш текущий план и использование ресурсов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{currentPlan.name}</span>
              <Badge variant="default">{currentPlan.price} ₽/мес</Badge>
            </div>

            <Separator />

            {/* Sites usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Сайты</span>
                <span className="text-muted-foreground">
                  {currentPlan.currentSites} из {currentPlan.sitesLimit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(currentPlan.currentSites / currentPlan.sitesLimit) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Managers usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Менеджеры</span>
                <span className="text-muted-foreground">
                  {currentPlan.currentManagers} из {currentPlan.managersLimit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all"
                  style={{
                    width: `${(currentPlan.currentManagers / currentPlan.managersLimit) * 100}%`,
                  }}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Следующее списание</span>
              <span>{currentPlan.billingDate.toLocaleDateString("ru-RU")}</span>
            </div>

            <Button variant="outline" className="w-full bg-transparent">
              Изменить тариф
            </Button>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Профиль администратора
            </CardTitle>
            <CardDescription>
              Ваши личные данные для входа
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Имя</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Фамилия</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Input
                value={
                  profile?.role === "admin" ? "Администратор" :
                  profile?.role === "rop" ? "РОП" : "Менеджер"
                }
                disabled
              />
            </div>
            <Separator />
            <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  <Lock className="size-4 mr-2" />
                  Сменить пароль
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Сменить пароль</DialogTitle>
                  <DialogDescription>
                    Введите текущий и новый пароль
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="old_password">Текущий пароль</Label>
                    <Input
                      id="old_password"
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, old_password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Новый пароль</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, new_password: e.target.value })
                      }
                      placeholder="Минимум 8 символов"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPasswordDialog(false)}>
                    Отмена
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={!passwordData.old_password || !passwordData.new_password || passwordSaving}
                  >
                    {passwordSaving ? "Сохранение..." : "Сменить пароль"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Настройки виджета и Telegram</CardTitle>
            <CardDescription>
              Настройки виджета и интеграции с Telegram настраиваются индивидуально для каждого сайта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Перейдите в раздел «Сайты» и нажмите на иконку шестерёнки рядом с нужным сайтом,
              чтобы настроить внешний вид виджета и подключить Telegram бота.
            </p>
            <Button variant="outline" className="bg-transparent" asChild>
              <a href="/sites">Перейти к сайтам</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
