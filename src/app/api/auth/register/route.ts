import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидация данных
    const validatedData = registerSchema.parse(body)
    
    // Проверка существования пользователя
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }
    
    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)
    
    // Создание пользователя
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name || null,
      })
      .returning()
    
    // Удаляем пароль из ответа
    const { password, ...userWithoutPassword } = newUser
    
    return NextResponse.json(
      {
        message: 'Регистрация успешна',
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}


