import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import Link from "next/link"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  // Проверка роли администратора
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Административная панель
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/courses"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Управление курсами
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Создание, редактирование и удаление курсов
            </p>
          </Link>

          <Link
            href="/admin/categories"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Управление категориями
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Управление категориями курсов
            </p>
          </Link>

          <Link
            href="/admin/institutions"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Управление заведениями
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Управление учебными заведениями
            </p>
          </Link>

          <Link
            href="/admin/instructors"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Управление преподавателями
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Управление преподавателями
            </p>
          </Link>

          <Link
            href="/admin/articles"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Управление статьями
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Создание и редактирование статей
            </p>
          </Link>

          <Link
            href="/admin/reviews"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Модерация отзывов
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Просмотр и модерация отзывов
            </p>
          </Link>

          <Link
            href="/admin/statistics"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Статистика
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Просмотр статистики платформы
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}


