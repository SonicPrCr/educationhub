"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { UserInfo } from "@/components/auth/UserInfo"

export function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            EducationHub
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/courses"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Курсы
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Личный кабинет
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Админ панель
                  </Link>
                )}
                <UserInfo />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


