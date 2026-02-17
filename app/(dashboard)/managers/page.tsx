"use client"

import { useState, useEffect } from "react"
import { Plus, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchUsers, createUser, updateUser, deleteUser, type ApiManager } from "@/lib/api"

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  rop: "РОП",
  manager: "Менеджер",
}

export default function ManagersPage() {
  const [managers, setManagers] = useState<ApiManager[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newManager, setNewManager] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "manager",
  })

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingManager, setEditingManager] = useState<ApiManager | null>(null)
  const [editForm, setEditForm] = useState<{ first_name: string; last_name: string; role: "admin" | "rop" | "manager" }>({
    first_name: "", last_name: "", role: "manager",
  })
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  useEffect(() => {
    loadManagers()
  }, [])

  async function loadManagers() {
    try {
      const res = await fetchUsers()
      setManagers(res.results)
    } catch {
      // fallback — пустой список
    } finally {
      setLoading(false)
    }
  }

  const handleAddManager = async () => {
    if (!newManager.first_name || !newManager.email || !newManager.password) return
    setSubmitting(true)
    try {
      await createUser({
        email: newManager.email,
        password: newManager.password,
        first_name: newManager.first_name,
        last_name: newManager.last_name,
        role: newManager.role,
      })
      await loadManagers()
      setNewManager({ first_name: "", last_name: "", email: "", password: "", role: "manager" })
      setDialogOpen(false)
    } catch {
      // ошибка создания
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteManager = async () => {
    if (deleteConfirmId === null) return
    try {
      await deleteUser(deleteConfirmId)
      setManagers(managers.filter((m) => m.id !== deleteConfirmId))
    } catch {
      // ошибка удаления
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleToggleActive = async (manager: ApiManager) => {
    try {
      const updated = await updateUser(manager.id, { is_active: !manager.is_active })
      setManagers(managers.map((m) => (m.id === updated.id ? updated : m)))
    } catch {
      // ошибка изменения статуса
    }
  }

  const openEditDialog = (manager: ApiManager) => {
    setEditingManager(manager)
    setEditForm({ first_name: manager.first_name || "", last_name: manager.last_name || "", role: manager.role })
    setEditDialogOpen(true)
  }

  const handleEditManager = async () => {
    if (!editingManager) return
    setSubmitting(true)
    try {
      const updated = await updateUser(editingManager.id, editForm)
      setManagers(managers.map((m) => (m.id === updated.id ? updated : m)))
      setEditDialogOpen(false)
    } catch {
      // ошибка
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Менеджеры</h1>
          <p className="text-muted-foreground">
            Управление командой поддержки
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Добавить менеджера
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить менеджера</DialogTitle>
              <DialogDescription>
                Заполните данные нового менеджера
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Имя</Label>
                  <Input
                    id="first_name"
                    value={newManager.first_name}
                    onChange={(e) =>
                      setNewManager({ ...newManager, first_name: e.target.value })
                    }
                    placeholder="Иван"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Фамилия</Label>
                  <Input
                    id="last_name"
                    value={newManager.last_name}
                    onChange={(e) =>
                      setNewManager({ ...newManager, last_name: e.target.value })
                    }
                    placeholder="Иванов"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newManager.email}
                  onChange={(e) =>
                    setNewManager({ ...newManager, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={newManager.password}
                  onChange={(e) =>
                    setNewManager({ ...newManager, password: e.target.value })
                  }
                  placeholder="Минимум 8 символов"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select
                  value={newManager.role}
                  onValueChange={(value) =>
                    setNewManager({ ...newManager, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="rop">РОП</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={handleAddManager}
                disabled={!newManager.first_name || !newManager.email || !newManager.password || submitting}
              >
                {submitting ? "Добавление..." : "Добавить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать менеджера</DialogTitle>
            <DialogDescription>Измените данные менеджера</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  placeholder="Иван"
                />
              </div>
              <div className="space-y-2">
                <Label>Фамилия</Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  placeholder="Иванов"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "admin" | "rop" | "manager") => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="rop">РОП</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleEditManager} disabled={submitting}>
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить менеджера?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Пользователь будет удалён из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteManager}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Менеджер</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager) => {
              const name = [manager.first_name, manager.last_name].filter(Boolean).join(" ") || manager.email
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
              return (
                <TableRow key={manager.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {manager.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabels[manager.role] || manager.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-2 rounded-full ${
                          manager.is_active ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {manager.is_active ? "Активен" : "Неактивен"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(manager)}>Редактировать</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {manager.is_active ? (
                          <DropdownMenuItem onClick={() => handleToggleActive(manager)}>
                            Деактивировать
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleToggleActive(manager)}>
                            Активировать
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(manager.id)}
                        >
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {managers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Нет менеджеров. Добавьте первого менеджера.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
