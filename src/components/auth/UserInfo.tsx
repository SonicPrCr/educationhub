"use client"

import { useSession } from "next-auth/react"
import { LogoutButton } from "./LogoutButton"

export function UserInfo() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Загрузка...</div>
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <div className="font-medium text-gray-900 dark:text-white">
          {session.user.name || session.user.email}
        </div>
        {session.user.role && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {session.user.role}
          </div>
        )}
      </div>
      <LogoutButton />
    </div>
  )
}

