import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import {
  courses,
  lessons,
  enrollments,
  progress,
  categories,
  instructors,
} from "@/lib/schema"
import { eq, and, asc } from "drizzle-orm"
import { LessonView } from "@/components/learn/LessonView"

async function getCourseData(courseId: number, userId: number) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)

  if (!course) {
    return null
  }

  const [enrollment, courseLessons, userProgress] = await Promise.all([
    db
      .select()
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
      )
      .limit(1),
    db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order)),
    db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId)),
  ])

  return {
    course,
    enrollment: enrollment[0] || null,
    lessons: courseLessons,
    progress: userProgress,
  }
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { lesson?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const courseId = parseInt(params.id)
  if (isNaN(courseId)) {
    notFound()
  }

  const userId = parseInt(session.user.id)
  const courseData = await getCourseData(courseId, userId)

  if (!courseData || !courseData.enrollment) {
    redirect(`/courses/${courseId}`)
  }

  const { course, enrollment, lessons, progress: userProgress } = courseData

  const progressMap = new Map(
    userProgress.map((p) => [p.lessonId, p.completed])
  )

  const currentLessonId = searchParams.lesson
    ? parseInt(searchParams.lesson)
    : lessons[0]?.id

  const currentLesson = lessons.find((l) => l.id === currentLessonId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar с уроками */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-4">
              <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                {course.title}
              </h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Прогресс
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {enrollment.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {lessons.map((lesson, index) => {
                  const isCompleted = progressMap.get(lesson.id) || false
                  const isActive = lesson.id === currentLessonId

                  return (
                    <a
                      key={lesson.id}
                      href={`/learn/${courseId}?lesson=${lesson.id}`}
                      className={`block p-2 rounded ${
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {index + 1}. {lesson.title}
                        </span>
                        {isCompleted && (
                          <span className="text-green-600">✓</span>
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Контент урока */}
          <div className="md:col-span-3">
            {currentLesson ? (
              <LessonView
                lesson={currentLesson}
                courseId={courseId}
                isCompleted={progressMap.get(currentLesson.id) || false}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Урок не найден
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


