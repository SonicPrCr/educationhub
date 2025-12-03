import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import {
  enrollments,
  courses,
  certificates,
  achievements,
  progress,
  lessons,
} from "@/lib/schema"
import { eq, and, desc } from "drizzle-orm"
import Link from "next/link"
import { UserInfo } from "@/components/auth/UserInfo"

async function getUserData(userId: number) {
  const [userEnrollments, userCertificates, userAchievements] =
    await Promise.all([
      db
        .select({
          enrollment: enrollments,
          course: courses,
        })
        .from(enrollments)
        .leftJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.userId, userId))
        .orderBy(desc(enrollments.enrolledAt)),
      db
        .select({
          certificate: certificates,
          course: courses,
        })
        .from(certificates)
        .leftJoin(courses, eq(certificates.courseId, courses.id))
        .where(eq(certificates.userId, userId))
        .orderBy(desc(certificates.issuedAt)),
      db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId))
        .orderBy(desc(achievements.earnedAt))
        .limit(10),
    ])

  // Подсчет статистики
  const totalCourses = userEnrollments.length
  const completedCourses = userEnrollments.filter(
    (e) => e.enrollment.status === "COMPLETED"
  ).length
  const inProgressCourses = userEnrollments.filter(
    (e) => e.enrollment.status === "ENROLLED"
  ).length

  return {
    enrollments: userEnrollments,
    certificates: userCertificates,
    achievements: userAchievements,
    stats: {
      totalCourses,
      completedCourses,
      inProgressCourses,
      certificates: userCertificates.length,
      achievements: userAchievements.length,
    },
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const userId = parseInt(session.user.id)
  const userData = await getUserData(userId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Личный кабинет
          </h1>
          <UserInfo />
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {userData.stats.totalCourses}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Всего курсов
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {userData.stats.completedCourses}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Завершено
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {userData.stats.inProgressCourses}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              В процессе
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {userData.stats.certificates}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Сертификатов
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {userData.stats.achievements}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Достижений
            </div>
          </div>
        </div>

        {/* Мои курсы */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Мои курсы
          </h2>
          {userData.enrollments.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              Вы еще не записаны ни на один курс
            </p>
          ) : (
            <div className="space-y-4">
              {userData.enrollments.map((item) => (
                <div
                  key={item.enrollment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/learn/${item.course?.id}`}
                        className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {item.course?.title}
                      </Link>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            Прогресс
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {item.enrollment.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${item.enrollment.progress}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Статус:{" "}
                        {item.enrollment.status === "COMPLETED"
                          ? "Завершен"
                          : item.enrollment.status === "DROPPED"
                          ? "Прерван"
                          : "В процессе"}
                      </div>
                    </div>
                    <Link
                      href={`/learn/${item.course?.id}`}
                      className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      Продолжить
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Сертификаты */}
        {userData.certificates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Сертификаты
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.certificates.map((item) => (
                <div
                  key={item.certificate.id}
                  className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.course?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Сертификат №{item.certificate.certificateNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Выдан:{" "}
                    {new Date(
                      item.certificate.issuedAt || ""
                    ).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Достижения */}
        {userData.achievements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Достижения
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userData.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="border rounded-lg p-4 text-center"
                >
                  {achievement.icon && (
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {achievement.title}
                  </h3>
                  {achievement.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {achievement.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


