import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import { courses, categories, institutions, instructors } from "@/lib/schema"
import { desc, eq } from "drizzle-orm"
import Link from "next/link"

async function getCourses() {
  return await db
    .select({
      course: courses,
      category: categories,
      institution: institutions,
      instructor: instructors,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .leftJoin(institutions, eq(courses.institutionId, institutions.id))
    .leftJoin(instructors, eq(courses.instructorId, instructors.id))
    .orderBy(desc(courses.createdAt))
}

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const coursesList = await getCourses()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Управление курсами
          </h1>
          <Link
            href="/admin/courses/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Создать курс
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Заведение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {coursesList.map(({ course, category, institution }) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {category?.name || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {institution?.name || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.price ? `${Number(course.price)} ₽` : "Бесплатно"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                    >
                      Редактировать
                    </Link>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Просмотр
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

