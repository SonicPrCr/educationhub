import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import {
  courses,
  categories,
  institutions,
  instructors,
  enrollments,
} from "@/lib/schema";
import { desc, eq, sql, and, or, like } from "drizzle-orm";

async function getCourses(
  page: number = 1,
  categorySlug?: string,
  level?: string,
  format?: string,
  search?: string
) {
  const limit = 12;
  const skip = (page - 1) * limit;

  const conditions = [];

  if (categorySlug) {
    conditions.push(eq(categories.slug, categorySlug));
  }
  if (
    level &&
    (level === "BEGINNER" || level === "INTERMEDIATE" || level === "ADVANCED")
  ) {
    conditions.push(eq(courses.level, level));
  }
  if (
    format &&
    (format === "ONLINE" || format === "OFFLINE" || format === "HYBRID")
  ) {
    conditions.push(eq(courses.format, format));
  }
  if (search) {
    conditions.push(
      or(
        like(courses.title, `%${search}%`),
        like(courses.description || "", `%${search}%`)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [coursesList, total] = await Promise.all([
    db
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
      .where(where)
      .groupBy(courses.id, categories.name, institutions.name, instructors.name)
      .orderBy(desc(courses.createdAt))
      .limit(limit)
      .offset(skip),
    db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(where),
  ]);

  return {
    courses: coursesList,
    total: Number(total[0]?.count || 0),
    totalPages: Math.ceil(Number(total[0]?.count || 0) / limit),
  };
}

async function getCategories() {
  return await db.select().from(categories);
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    level?: string;
    format?: string;
    search?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1");
  const { courses: coursesList, totalPages } = await getCourses(
    page,
    resolvedSearchParams.category,
    resolvedSearchParams.level,
    resolvedSearchParams.format,
    resolvedSearchParams.search
  );
  const categoriesList = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Каталог курсов
        </h1>

        {/* Фильтры */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow">
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="search"
              placeholder="Поиск по названию..."
              defaultValue={resolvedSearchParams.search}
              className="border rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            />
            <select
              name="category"
              className="border rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Все категории</option>
              {categoriesList.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.slug}
                  selected={resolvedSearchParams.category === cat.slug}
                >
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              name="level"
              className="border rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Все уровни</option>
              <option
                value="BEGINNER"
                selected={resolvedSearchParams.level === "BEGINNER"}
              >
                Начинающий
              </option>
              <option
                value="INTERMEDIATE"
                selected={resolvedSearchParams.level === "INTERMEDIATE"}
              >
                Средний
              </option>
              <option
                value="ADVANCED"
                selected={resolvedSearchParams.level === "ADVANCED"}
              >
                Продвинутый
              </option>
            </select>
            <select
              name="format"
              className="border rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Все форматы</option>
              <option
                value="ONLINE"
                selected={resolvedSearchParams.format === "ONLINE"}
              >
                Онлайн
              </option>
              <option
                value="OFFLINE"
                selected={resolvedSearchParams.format === "OFFLINE"}
              >
                Офлайн
              </option>
              <option
                value="HYBRID"
                selected={resolvedSearchParams.format === "HYBRID"}
              >
                Гибридный
              </option>
            </select>
            <button
              type="submit"
              className="md:col-span-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Применить фильтры
            </button>
          </form>
        </div>

        {/* Список курсов */}
        {coursesList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Курсы не найдены
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {coursesList.map((course) => (
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
                    <h2 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
                      {course.title}
                    </h2>
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

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <Link
                      key={p}
                      href={`/courses?page=${p}${
                        resolvedSearchParams.category
                          ? `&category=${resolvedSearchParams.category}`
                          : ""
                      }${
                        resolvedSearchParams.level
                          ? `&level=${resolvedSearchParams.level}`
                          : ""
                      }${
                        resolvedSearchParams.format
                          ? `&format=${resolvedSearchParams.format}`
                          : ""
                      }${
                        resolvedSearchParams.search
                          ? `&search=${resolvedSearchParams.search}`
                          : ""
                      }`}
                      className={`px-4 py-2 rounded ${
                        p === page
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
