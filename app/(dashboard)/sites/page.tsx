"use client"

import { useState, useEffect } from "react"
import { Plus, ExternalLink, Copy, Trash2, MoreHorizontal, Check, Globe, Settings } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { fetchSites, createSite, deleteSite, fetchWidgetCode, type ApiSite } from "@/lib/api"

export default function SitesPage() {
  const [sites, setSites] = useState<ApiSite[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newSite, setNewSite] = useState({ name: "", url: "" })
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const sitesLimit = 5

  useEffect(() => {
    loadSites()
  }, [])

  async function loadSites() {
    try {
      const res = await fetchSites()
      setSites(res.results)
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const handleAddSite = async () => {
    if (!newSite.name || !newSite.url) return
    setSubmitting(true)
    try {
      await createSite({ name: newSite.name, url: newSite.url })
      await loadSites()
      setNewSite({ name: "", url: "" })
      setDialogOpen(false)
    } catch {
      // ошибка создания
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSite = async (id: number) => {
    try {
      await deleteSite(id)
      setSites(sites.filter((s) => s.id !== id))
    } catch {
      // ошибка удаления
    }
  }

  const handleCopyCode = async (id: number) => {
    try {
      const data = await fetchWidgetCode(id)
      await navigator.clipboard.writeText(data.embed_code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback — генерим локально
      const site = sites.find((s) => s.id === id)
      if (site) {
        const code = `<script src="https://cdn.multichat.io/widget.js" data-site-id="${site.site_uuid}"></script>`
        await navigator.clipboard.writeText(code)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      }
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
          <h1 className="text-2xl font-bold tracking-tight">Сайты</h1>
          <p className="text-muted-foreground">
            Управление подключёнными сайтами
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={sites.length >= sitesLimit}>
              <Plus className="size-4 mr-2" />
              Добавить сайт
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить сайт</DialogTitle>
              <DialogDescription>
                Введите данные сайта для подключения виджета
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Название</Label>
                <Input
                  id="siteName"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  placeholder="Мой сайт"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">URL сайта</Label>
                <Input
                  id="siteUrl"
                  value={newSite.url}
                  onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={handleAddSite}
                disabled={!newSite.name || !newSite.url || submitting}
              >
                {submitting ? "Добавление..." : "Добавить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Limit indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Использовано сайтов</span>
            <span className="text-sm text-muted-foreground">
              {sites.length} из {sitesLimit}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(sites.length / sitesLimit) * 100}%` }}
            />
          </div>
          {sites.length >= sitesLimit && (
            <p className="text-xs text-muted-foreground mt-2">
              Достигнут лимит сайтов. Обновите тариф для добавления новых.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sites Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <Card key={site.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{site.name}</CardTitle>
                    <CardDescription className="text-xs truncate max-w-[150px]">
                      {site.url}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link href={`/sites/${site.id}/settings`}>
                            <Settings className="size-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Настройки виджета и Telegram</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(site.url, "_blank")}>
                        <ExternalLink className="size-4 mr-2" />
                        Открыть сайт
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteSite(site.id)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">UUID</span>
                <span className="font-mono text-xs">{site.site_uuid.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Автоответ</span>
                <Badge variant={site.auto_reply_enabled ? "default" : "secondary"}>
                  {site.auto_reply_enabled ? "Вкл" : "Выкл"}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleCopyCode(site.id)}
                    >
                      {copiedId === site.id ? (
                        <>
                          <Check className="size-4 mr-2" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="size-4 mr-2" />
                          Скопировать код
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Скопировать код виджета для вставки на сайт</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        ))}

        {/* Add site card */}
        {sites.length < sitesLimit && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Plus className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Добавьте новый сайт
              </p>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                Добавить сайт
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
