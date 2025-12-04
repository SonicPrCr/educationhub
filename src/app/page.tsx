import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { courses, categories, institutions, instructors, enrollments } from "@/lib/schema"
import { desc, eq, sql } from "drizzle-orm"

async function getPopularCourses() {
  return await db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      image: courses.image,
      price: courses.price,
      rating: courses.rating,
      duration: courses.duration,
      level: courses.level,
      format: courses.format,
      categoryName: categories.name,
      institutionName: institutions.name,
      instructorName: instructors.name,
      enrollmentsCount: sql<number>`count(${enrollments.id})`,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .leftJoin(institutions, eq(courses.institutionId, institutions.id))
    .leftJoin(instructors, eq(courses.instructorId, instructors.id))
    .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
    .groupBy(courses.id, categories.name, institutions.name, instructors.name)
    .orderBy(desc(sql`count(${enrollments.id})`), desc(courses.createdAt))
    .limit(8)
}

async function getCategories() {
  return await db.select().from(categories).limit(6)
}

export default async function HomePage() {
  const [popularCourses, categoriesList] = await Promise.all([
    getPopularCourses(),
    getCategories(),
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">
            Образовательная платформа EducationHub
          </h1>
          <p className="text-xl mb-8">
            Откройте для себя лучшие курсы и программы обучения
          </p>
          <Link
            href="/courses"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Найти курс
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Категории обучения
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoriesList.map((category) => (
            <Link
              key={category.id}
              href={`/courses?category=${category.slug}`}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:shadow-lg transition shadow"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Популярные курсы
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
            >
              {course.image && (
                <div className="relative w-full h-48">
            <Image
                    src={course.image}
                    alt={course.title || "Course"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {course.institutionName || course.instructorName}
                </p>
                {course.categoryName && (
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded mb-2">
                    {course.categoryName}
                  </span>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {course.rating && (
                      <span className="text-yellow-500">★</span>
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {course.enrollmentsCount || 0} студентов
                    </span>
                  </div>
                  {course.price && (
                    <span className="font-bold text-gray-900 dark:text-white">
                      {Number(course.price)} ₽
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/courses"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Посмотреть все курсы
          </Link>
        </div>
      </section>
    </div>
  )
}
