import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import { progress, lessons, enrollments } from "@/lib/schema"
import { eq, and, sql } from "drizzle-orm"
import { z } from "zod"

const progressSchema = z.object({
  lessonId: z.number(),
  completed: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = progressSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id)
    const { lessonId, completed } = validated.data

    // Получаем урок и курс
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1)

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Проверяем существующий прогресс
    const [existingProgress] = await db
      .select()
      .from(progress)
      .where(
        and(eq(progress.userId, userId), eq(progress.lessonId, lessonId))
      )
      .limit(1)

    let progressRecord
    if (existingProgress) {
      // Обновляем существующий прогресс
      const [updated] = await db
        .update(progress)
        .set({
          completed,
          completedAt: completed ? new Date() : null,
        })
        .where(eq(progress.id, existingProgress.id))
        .returning()
      progressRecord = updated
    } else {
      // Создаем новый прогресс
      const [newProgress] = await db
        .insert(progress)
        .values({
          userId,
          lessonId,
          completed,
          completedAt: completed ? new Date() : null,
        })
        .returning()
      progressRecord = newProgress
    }

    // Обновление прогресса курса
    const allLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, lesson.courseId))

    const lessonIds = allLessons.map((l) => l.id)
    let completedCount = 0
    
    if (lessonIds.length > 0) {
      const completedLessons = await db
        .select()
        .from(progress)
        .where(
          and(
            eq(progress.userId, userId),
            eq(progress.completed, true)
          )
        )
      
      completedCount = completedLessons.filter((p) =>
        lessonIds.includes(p.lessonId)
      ).length
    }

    const totalLessons = allLessons.length
    const courseProgress = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0

    // Обновляем запись на курс
    await db
      .update(enrollments)
      .set({
        progress: courseProgress,
        status: courseProgress === 100 ? "COMPLETED" : "ENROLLED",
        completedAt: courseProgress === 100 ? new Date() : null,
      })
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, lesson.courseId)
        )
      )

    return NextResponse.json(progressRecord)
  } catch (error) {
    console.error("Progress error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

