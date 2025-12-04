"use client"

import { useSession } from "next-auth/react"
import { LogoutButton } from "./LogoutButton"
import Image from "next/image"
import { useEffect, useState } from "react"

export function UserInfo() {
  const { data: session, status } = useSession()
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      // Загружаем аватар пользователя
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.avatar) {
            setAvatar(data.user.avatar)
          }
        })
        .catch(() => {})
    }
  }, [session])

  if (status === "loading") {
    return <div>Загрузка...</div>
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      {avatar ? (
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
          <Image
            src={avatar}
            alt="Avatar"
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
          {session.user.name?.[0]?.toUpperCase() || session.user.email[0]?.toUpperCase()}
        </div>
      )}
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


