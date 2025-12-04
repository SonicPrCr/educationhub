import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { ProfileForm } from "@/components/profile/ProfileForm"

async function getUserProfile(userId: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return user
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const userId = parseInt(session.user.id)
  const user = await getUserProfile(userId)

  if (!user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Редактирование профиля
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <ProfileForm user={user} />
        </div>
      </div>
    </div>
  )
}

