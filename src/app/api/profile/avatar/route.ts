import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: 400 }
      )
    }

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением" },
        { status: 400 }
      )
    }

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 5MB" },
        { status: 400 }
      )
    }

    // Конвертируем файл в base64 для хранения в БД
    // В продакшене лучше использовать облачное хранилище (S3, Cloudinary и т.д.)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    const userId = parseInt(session.user.id)

    // Обновляем аватар пользователя
    await db
      .update(users)
      .set({ avatar: dataUrl })
      .where(eq(users.id, userId))

    return NextResponse.json({
      message: "Аватар успешно обновлен",
      avatar: dataUrl,
    })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Ошибка при загрузке аватара" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Удаляем аватар
    await db
      .update(users)
      .set({ avatar: null })
      .where(eq(users.id, userId))

    return NextResponse.json({ message: "Аватар удален" })
  } catch (error) {
    console.error("Avatar delete error:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении аватара" },
      { status: 500 }
    )
  }
}

