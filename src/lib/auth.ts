import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  return session.user
}
