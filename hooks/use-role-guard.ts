"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

type Role = "admin" | "rop" | "manager"

/**
 * Redirects to /chats if the current user's role is not in `allowed`.
 * Call at the top of any page component that should be role-restricted.
 */
export function useRoleGuard(allowed: Role[]) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) return // AuthGuard handles login redirect
    if (!allowed.includes(user.role as Role)) {
      router.replace("/chats")
    }
  }, [user, loading])
}
