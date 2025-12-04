import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  courses,
  categories,
  institutions,
  instructors,
  lessons,
  reviews,
  enrollments,
  users,
} from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { EnrollButton } from "@/components/courses/EnrollButton";
import Link from "next/link";
import Image from "next/image";

async function getCourse(id: number) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);

  if (!course) {
    return null;
  }

  const [category, institution, instructor, courseLessons, courseReviews] =
    await Promise.all([
      course.categoryId
        ? db
            .select()
            .from(categories)
            .where(eq(categories.id, course.categoryId))
            .limit(1)
        : Promise.resolve([]),
      course.institutionId
        ? db
            .select()
            .from(institutions)
            .where(eq(institutions.id, course.institutionId))
            .limit(1)
        : Promise.resolve([]),
      course.instructorId
        ? db
            .select()
            .from(instructors)
            .where(eq(instructors.id, course.instructorId))
            .limit(1)
        : Promise.resolve([]),
      db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, course.id))
        .orderBy(lessons.order),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.courseId, course.id))
        .orderBy(desc(reviews.createdAt))
        .limit(10),
    ]);

  return {
    course,
    category: category[0] || null,
    institution: institution[0] || null,
    instructor: instructor[0] || null,
    lessons: courseLessons,
    reviews: courseReviews,
  };
}

async function checkEnrollment(userId: number | undefined, courseId: number) {
  if (!userId) return null;

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .limit(1);

  return enrollment || null;
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const courseData = await getCourse(courseId);

  if (!courseData) {
    notFound();
  }

  const { course, category, institution, instructor, lessons, reviews } =
    courseData;

  const enrollment = session?.user?.id
    ? await checkEnrollment(parseInt(session.user.id), courseId)
    : null;

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Основная информация */}
          <div>
            {course.image && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <Image
                  src={course.image}
                  alt={course.title || "Course"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {course.title}
            </h1>
            {category && (
              <Link
                href={`/courses?category=${category.slug}`}
                className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded mb-4"
              >
                {category.name}
              </Link>
            )}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {course.description}
            </p>

            <div className="space-y-2 mb-6">
              {course.level && (
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Уровень:</strong>{" "}
                  {course.level === "BEGINNER"
                    ? "Начинающий"
                    : course.level === "INTERMEDIATE"
                    ? "Средний"
                    : "Продвинутый"}
                </p>
              )}
              {course.duration && (
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Длительность:</strong> {course.duration} часов
                </p>
              )}
              {course.format && (
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Формат:</strong>{" "}
                  {course.format === "ONLINE"
                    ? "Онлайн"
                    : course.format === "OFFLINE"
                    ? "Офлайн"
                    : "Гибридный"}
                </p>
              )}
              {institution && (
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Учебное заведение:</strong> {institution.name}
                </p>
              )}
              {instructor && (
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Преподаватель:</strong> {instructor.name}
                </p>
              )}
              {averageRating > 0 && (
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Рейтинг:</strong> {averageRating.toFixed(1)}/5.0
                </p>
              )}
            </div>

            {session && !enrollment && <EnrollButton courseId={courseId} />}
            {enrollment && (
              <Link
                href={`/learn/${courseId}`}
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
              >
                Продолжить обучение
              </Link>
            )}
          </div>

          {/* Программа курса и отзывы */}
          <div className="space-y-8">
            {/* Программа курса */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Программа курса ({lessons.length} уроков)
              </h2>
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded flex items-center justify-between shadow"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {index + 1}. {lesson.title}
                    </span>
                    {enrollment && <span className="text-green-600">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Отзывы */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Отзывы ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    Пока нет отзывов
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-white dark:bg-gray-800 rounded shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {review.userName || review.userEmail || "Аноним"}
                        </span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < (review.rating || 0)
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 dark:text-gray-300">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
