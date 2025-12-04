import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Получаем полную информацию о пользователе из БД (включая аватар)
    const userId = parseInt(session.user.id)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const { password, ...userWithoutPassword } = user
    
    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении пользователя' },
      { status: 500 }
    )
  }
}

