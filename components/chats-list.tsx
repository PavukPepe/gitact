"use client"

import { useState, useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { ArrowUpDown, Globe, Send, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Chat, ChatStatus } from "@/lib/mock-data"
import { formatRelativeTime, getStatusLabel, getTagLabel } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ChatsListProps {
  chats: Chat[]
  onOpenChat: (chat: Chat) => void
}

const statusColors: Record<ChatStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "in-progress": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  replied: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  closed: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

export function ChatsList({ chats, onOpenChat }: ChatsListProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns: ColumnDef<Chat>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Клиент
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const initials = row.original.clientName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{row.original.clientName}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "source",
        header: "Источник",
        cell: ({ row }) => (
          <Badge
            variant={row.original.source === "telegram" ? "default" : "secondary"}
            className="text-xs"
          >
            {row.original.source === "telegram" ? (
              <Send className="size-3 mr-1" />
            ) : (
              <Globe className="size-3 mr-1" />
            )}
            {row.original.source === "telegram" ? "Telegram" : "Сайт"}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          return value === "all" || row.getValue(id) === value
        },
      },
      {
        accessorKey: "lastMessage",
        header: "Последнее сообщение",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
            {row.original.lastMessage}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Статус",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn("text-xs", statusColors[row.original.status])}
          >
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          return value === "all" || row.getValue(id) === value
        },
      },
      {
        accessorKey: "tags",
        header: "Метки",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.tags.map((tag) => (
              <Badge
                key={tag}
                variant={tag === "urgent" ? "destructive" : "outline"}
                className="text-[10px] px-1.5 py-0"
              >
                {getTagLabel(tag)}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "lastMessageTime",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Время
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(row.original.lastMessageTime)}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenChat(row.original)}>
                Открыть чат
              </DropdownMenuItem>
              <DropdownMenuItem>Изменить статус</DropdownMenuItem>
              <DropdownMenuItem>Назначить менеджера</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onOpenChat]
  )

  const table = useReactTable({
    data: chats,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Поиск по имени или сообщению..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={(columnFilters.find((f) => f.id === "status")?.value as string) || "all"}
          onValueChange={(value) =>
            setColumnFilters((prev) => [
              ...prev.filter((f) => f.id !== "status"),
              ...(value !== "all" ? [{ id: "status", value }] : []),
            ])
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="in-progress">В обработке</SelectItem>
            <SelectItem value="replied">Ответ дан</SelectItem>
            <SelectItem value="closed">Закрытые</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={(columnFilters.find((f) => f.id === "source")?.value as string) || "all"}
          onValueChange={(value) =>
            setColumnFilters((prev) => [
              ...prev.filter((f) => f.id !== "source"),
              ...(value !== "all" ? [{ id: "source", value }] : []),
            ])
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все источники" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все источники</SelectItem>
            <SelectItem value="website">Сайт</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onOpenChat(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Чаты не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
