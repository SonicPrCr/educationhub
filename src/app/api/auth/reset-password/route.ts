import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import {
  getResetTokenData,
  deleteResetToken,
} from "../forgot-password/route"

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = resetPasswordSchema.parse(body)

    // Проверка токена
    const tokenData = getResetTokenData(validatedData.token)
    if (!tokenData) {
      return NextResponse.json(
        { error: "Недействительный или истекший токен" },
        { status: 400 }
      )
    }

    // Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Обновление пароля
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, tokenData.userId))

    // Удаление использованного токена
    deleteResetToken(validatedData.token)

    return NextResponse.json({
      message: "Пароль успешно изменен",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Ошибка при сбросе пароля" },
      { status: 500 }
    )
  }
}

