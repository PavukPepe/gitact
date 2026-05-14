"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Users,
  Settings,
  Plug,
  Globe,
  LayoutDashboard,
  BookUser,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

type Role = "admin" | "rop" | "manager"

const allMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "rop"] as Role[],
  },
  {
    title: "Чаты",
    url: "/chats",
    icon: MessageSquare,
    roles: ["admin", "rop", "manager"] as Role[],
  },
  {
    title: "Менеджеры",
    url: "/managers",
    icon: Users,
    roles: ["admin", "rop"] as Role[],
  },
  {
    title: "Контакты",
    url: "/contacts",
    icon: BookUser,
    roles: ["admin", "rop", "manager"] as Role[],
  },
  {
    title: "Сайты",
    url: "/sites",
    icon: Globe,
    roles: ["admin"] as Role[],
  },
  {
    title: "Интеграции",
    url: "/integrations",
    icon: Plug,
    roles: ["admin"] as Role[],
  },
  {
    title: "Настройки",
    url: "/settings",
    icon: Settings,
    roles: ["admin", "rop"] as Role[],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const role = (user?.role ?? "manager") as Role

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role))

  return (
    <Sidebar>
      <SidebarHeader className="h-14 flex items-center border-b border-sidebar-border px-4">
        <Link href="/chats" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="size-4" />
          </div>
          <span className="text-lg font-semibold">MultiChat Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        {user?.plan && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Тариф</span>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              user.plan === "enterprise"
                ? "bg-violet-500/10 text-violet-500"
                : user.plan === "business"
                  ? "bg-blue-500/10 text-blue-500"
                  : "bg-slate-500/10 text-slate-500"
            )}>
              {user.plan === "enterprise" ? "Корпоратив" : user.plan === "business" ? "Бизнес" : "Старт"}
            </span>
          </div>
        )}
        <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
      </SidebarFooter>
    </Sidebar>
  )
}
