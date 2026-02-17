"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getProfile, clearTokens, type UserProfile } from "@/lib/api"

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      setLoading(false)
      return
    }

    getProfile()
      .then(setUser)
      .catch(() => {
        clearTokens()
      })
      .finally(() => setLoading(false))
  }, [])

  const logout = () => {
    clearTokens()
    setUser(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
