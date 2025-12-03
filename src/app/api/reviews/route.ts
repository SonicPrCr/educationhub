import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import { reviews } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const reviewSchema = z.object({
  courseId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = reviewSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id)
    const { courseId, rating, comment } = validated.data

    // Проверка существующего отзыва
    const [existing] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.courseId, courseId)))
      .limit(1)

    let review
    if (existing) {
      // Обновляем существующий отзыв
      const [updated] = await db
        .update(reviews)
        .set({
          rating,
          comment: comment || null,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, existing.id))
        .returning()
      review = updated
    } else {
      // Создаем новый отзыв
      const [newReview] = await db
        .insert(reviews)
        .values({
          userId,
          courseId,
          rating,
          comment: comment || null,
        })
        .returning()
      review = newReview
    }

    return NextResponse.json(review, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error("Review error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


