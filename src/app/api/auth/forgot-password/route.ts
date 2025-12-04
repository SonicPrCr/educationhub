import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { sendEmail, emailTemplates } from "@/lib/email"
import crypto from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email("Некорректный email"),
})

// В реальном приложении лучше хранить токены в БД с временем истечения
// Для простоты используем временное решение
const resetTokens = new Map<string, { userId: number; expiresAt: Date }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // Поиск пользователя
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)

    // Всегда возвращаем успех для безопасности (чтобы не раскрывать существование email)
    if (!user) {
      return NextResponse.json(
        { message: "Если email существует, мы отправили инструкции" },
        { status: 200 }
      )
    }

    // Генерация токена
    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Токен действителен 1 час

    resetTokens.set(resetToken, { userId: user.id, expiresAt })

    // Создание ссылки для сброса пароля
    const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`

    // Отправка письма
    try {
      const resetEmail = emailTemplates.passwordReset(
        user.name || "Пользователь",
        resetLink
      )
      await sendEmail({
        to: user.email,
        subject: resetEmail.subject,
        html: resetEmail.html,
      })
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError)
      return NextResponse.json(
        { error: "Ошибка при отправке письма" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Если email существует, мы отправили инструкции",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Ошибка при обработке запроса" },
      { status: 500 }
    )
  }
}

// Экспортируем для использования в reset-password route
export function getResetTokenData(token: string) {
  const data = resetTokens.get(token)
  if (!data) return null
  if (data.expiresAt < new Date()) {
    resetTokens.delete(token)
    return null
  }
  return data
}

export function deleteResetToken(token: string) {
  resetTokens.delete(token)
}

