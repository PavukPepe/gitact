"use client"

import { useState, useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table"
import { ArrowUpDown, Globe, Mail, Trash2, UserCheck, RefreshCw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Chat, ChatStatus } from "@/lib/chat-types"
import { formatRelativeTime, getStatusLabel } from "@/lib/chat-types"
import { updateChatStatus, assignChat, deleteChat, fetchUsers, type ApiManager } from "@/lib/api"
import { chatStatusToApi } from "@/lib/adapters"
import { cn } from "@/lib/utils"

interface ChatsListProps {
  chats: Chat[]
  onOpenChat: (chat: Chat) => void
  onChatsChange?: (chats: Chat[]) => void
}

const statusColors: Record<ChatStatus, string> = {
  new: "bg-blue-500/10 text-blue-600",
  "in-progress": "bg-amber-500/10 text-amber-600",
  replied: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-slate-500/10 text-slate-600",
}

const channelIcon = (source: string) => {
  if (source === "email") return <Mail className="size-3 mr-1" />
  return <Globe className="size-3 mr-1" />
}

const channelLabel = (source: string) => {
  if (source === "email") return "Email"
  return "Сайт"
}

export function ChatsList({ chats, onOpenChat, onChatsChange }: ChatsListProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkLoading, setBulkLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [managers, setManagers] = useState<ApiManager[]>([])
  const [managersLoaded, setManagersLoaded] = useState(false)

  const loadManagers = async () => {
    if (managersLoaded) return
    try {
      const res = await fetchUsers()
      setManagers(res.results.filter(m => m.is_active))
      setManagersLoaded(true)
    } catch { /* */ }
  }

  const columns: ColumnDef<Chat>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Выбрать все"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Выбрать"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "clientName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
          Клиент <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const initials = row.original.clientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{row.original.clientName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "source",
      header: "Канал",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {channelIcon(row.original.source)}
          {channelLabel(row.original.source)}
        </Badge>
      ),
      filterFn: (row, id, value) => value === "all" || row.getValue(id) === value,
    },
    {
      accessorKey: "lastMessage",
      header: "Последнее сообщение",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-60">
          {row.original.lastMessage}
        </span>
      ),
    },
    {
      accessorKey: "assignedManagerName",
      header: "Менеджер",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.assignedManagerName ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn("text-xs", statusColors[row.original.status])}>
          {getStatusLabel(row.original.status)}
        </Badge>
      ),
      filterFn: (row, id, value) => value === "all" || row.getValue(id) === value,
    },
    {
      accessorKey: "lastMessageTime",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
          Время <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatRelativeTime(row.original.lastMessageTime)}</span>
      ),
    },
  ], [])

  const table = useReactTable({
    data: chats,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, globalFilter, rowSelection },
  })

  const selectedRows = table.getSelectedRowModel().rows
  const selectedIds = selectedRows.map(r => Number(r.original.id))
  const hasSelection = selectedIds.length > 0

  const clearSelection = () => setRowSelection({})

  const bulkSetStatus = async (status: string) => {
    setBulkLoading(true)
    try {
      await Promise.all(selectedIds.map(id => updateChatStatus(id, status)))
      onChatsChange?.(chats.map(c =>
        selectedIds.includes(Number(c.id))
          ? { ...c, status: status as ChatStatus }
          : c
      ))
      clearSelection()
    } catch { /* */ } finally { setBulkLoading(false) }
  }

  const bulkAssign = async (managerId: string) => {
    if (!managerId) return
    const mId = Number(managerId)
    const manager = managers.find(m => m.id === mId)
    setBulkLoading(true)
    try {
      await Promise.all(selectedIds.map(id => assignChat(id, mId)))
      const name = manager ? `${manager.first_name} ${manager.last_name}`.trim() || manager.email : null
      onChatsChange?.(chats.map(c =>
        selectedIds.includes(Number(c.id))
          ? { ...c, assignedManagerId: mId, assignedManagerName: name }
          : c
      ))
      clearSelection()
    } catch { /* */ } finally { setBulkLoading(false) }
  }

  const bulkDelete = async () => {
    setBulkLoading(true)
    try {
      await Promise.all(selectedIds.map(id => deleteChat(id)))
      onChatsChange?.(chats.filter(c => !selectedIds.includes(Number(c.id))))
      clearSelection()
    } catch { /* */ } finally { setBulkLoading(false); setDeleteConfirm(false) }
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Поиск..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={(columnFilters.find(f => f.id === "status")?.value as string) || "all"}
          onValueChange={value => setColumnFilters(prev => [
            ...prev.filter(f => f.id !== "status"),
            ...(value !== "all" ? [{ id: "status", value }] : []),
          ])}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="Все статусы" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="in-progress">В обработке</SelectItem>
            <SelectItem value="replied">Ответ дан</SelectItem>
            <SelectItem value="closed">Закрытые</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={(columnFilters.find(f => f.id === "source")?.value as string) || "all"}
          onValueChange={value => setColumnFilters(prev => [
            ...prev.filter(f => f.id !== "source"),
            ...(value !== "all" ? [{ id: "source", value }] : []),
          ])}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="Все каналы" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все каналы</SelectItem>
            <SelectItem value="website">Сайт</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-1">
            Выбрано: {selectedIds.length}
          </span>

          {/* Change status */}
          <Select onValueChange={bulkSetStatus} disabled={bulkLoading}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <RefreshCw className="size-3 mr-1.5" />
              <SelectValue placeholder="Сменить статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Новая</SelectItem>
              <SelectItem value="in_progress">В обработке</SelectItem>
              <SelectItem value="replied">Ответ дан</SelectItem>
              <SelectItem value="closed">Закрыта</SelectItem>
            </SelectContent>
          </Select>

          {/* Assign manager */}
          <Select
            onValueChange={bulkAssign}
            disabled={bulkLoading}
            onOpenChange={open => open && loadManagers()}
          >
            <SelectTrigger className="h-8 w-48 text-xs">
              <UserCheck className="size-3 mr-1.5" />
              <SelectValue placeholder="Назначить менеджера" />
            </SelectTrigger>
            <SelectContent>
              {managers.map(m => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {`${m.first_name} ${m.last_name}`.trim() || m.email}
                </SelectItem>
              ))}
              {managers.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">Загрузка...</div>
              )}
            </SelectContent>
          </Select>

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={bulkLoading}
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="size-3" />
            Удалить
          </Button>

          <Button variant="ghost" size="sm" className="h-8 ml-auto" onClick={clearSelection}>
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className={cn("cursor-pointer", row.getIsSelected() && "bg-muted/40")}
                  onClick={() => onOpenChat(row.original)}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Чаты не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Показано {table.getRowModel().rows.length} из {chats.length}
      </p>

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить {selectedIds.length} чат{selectedIds.length > 1 ? "а" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>Это действие необратимо. Все сообщения будут удалены.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
