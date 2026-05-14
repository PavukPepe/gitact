"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Mail, Phone, MessageSquare, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { fetchContacts, createContact, updateContact, deleteContact, fetchSites, type ApiContact, type ApiSite } from "@/lib/api"
import { useRoleGuard } from "@/hooks/use-role-guard"

export default function ContactsPage() {
  useRoleGuard(["admin", "rop", "manager"])

  const [contacts, setContacts] = useState<ApiContact[]>([])
  const [sites, setSites] = useState<ApiSite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editContact, setEditContact] = useState<ApiContact | null>(null)

  const emptyForm = { site: "", name: "", email: "", phone: "", notes: "" }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    Promise.all([loadContacts(), loadSites()])
  }, [])

  async function loadContacts() {
    try {
      const res = await fetchContacts()
      setContacts(res.results)
    } catch { /* */ } finally { setLoading(false) }
  }

  async function loadSites() {
    try {
      const res = await fetchSites()
      setSites(res.results)
    } catch { /* */ }
  }

  const openCreate = () => {
    setEditContact(null)
    setForm({ ...emptyForm, site: sites[0]?.id?.toString() ?? "" })
    setDialogOpen(true)
  }

  const openEdit = (c: ApiContact) => {
    setEditContact(c)
    setForm({
      site: String(c.site),
      name: c.name,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name && !form.email) return
    setSubmitting(true)
    try {
      const payload = { ...form, site: Number(form.site) }
      if (editContact) {
        const updated = await updateContact(editContact.id, payload)
        setContacts(contacts.map(c => c.id === updated.id ? updated : c))
      } else {
        await createContact(payload)
        await loadContacts()
      }
      setDialogOpen(false)
    } catch { /* */ } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      await deleteContact(deleteId)
      setContacts(contacts.filter(c => c.id !== deleteId))
    } catch { /* */ } finally { setDeleteId(null) }
  }

  const filtered = search.trim()
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      )
    : contacts

  const initials = (c: ApiContact) => {
    const src = c.name || c.email
    return src.split(/[\s@]/)[0]?.slice(0, 2).toUpperCase() || "?"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Контакты</h1>
          <p className="text-muted-foreground">Клиенты, обращавшиеся через виджет или email</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, email, телефону..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Контакт</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead className="text-center">Лиды</TableHead>
              <TableHead>Заметки</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <MessageSquare className="size-7 opacity-20" />
                    <span className="text-sm">{search ? "Ничего не найдено" : "Контактов пока нет"}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(contact => (
                <TableRow key={contact.id} className="group">
                  <TableCell>
                    <a
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {initials(contact)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{contact.name || "(без имени)"}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    {contact.email ? (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="size-3.5 shrink-0" />
                        {contact.email}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="size-3.5 shrink-0" />
                        {contact.phone}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{contact.chats_count}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground line-clamp-1 max-w-40">
                      {contact.notes || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(contact)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(contact.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Показано {filtered.length} из {contacts.length}
      </p>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editContact ? "Редактировать контакт" : "Новый контакт"}</DialogTitle>
            <DialogDescription>Заполните данные клиента</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {sites.length > 1 && (
              <div className="space-y-1">
                <Label>Сайт</Label>
                <Select value={form.site} onValueChange={v => setForm({ ...form, site: v })}>
                  <SelectTrigger><SelectValue placeholder="Выберите сайт" /></SelectTrigger>
                  <SelectContent>
                    {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Имя</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Иван Петров" />
              </div>
              <div className="space-y-1">
                <Label>Телефон</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+7 999 000-00-00" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Заметки</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Дополнительная информация..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={(!form.name && !form.email) || submitting}>
              {submitting ? "Сохранение..." : editContact ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить контакт?</AlertDialogTitle>
            <AlertDialogDescription>Лиды останутся, но связь с контактом будет разорвана.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
