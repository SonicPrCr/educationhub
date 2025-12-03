import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email и пароль обязательны")
        }

        // Поиск пользователя
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1)

        if (!user || !user.password) {
          throw new Error("Неверный email или пароль")
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Неверный email или пароль")
        }

        // Возвращаем объект пользователя для сессии
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || undefined,
          role: user.role || "STUDENT",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // При первом входе добавляем данные пользователя в токен
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      // Добавляем данные из токена в сессию
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 дней
  },
  secret: process.env.NEXTAUTH_SECRET,
}


