"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function AvatarUpload() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<string | null>(
    session?.user?.image || null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      setError("Файл должен быть изображением")
      return
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Размер файла не должен превышать 5MB")
      return
    }

    // Превью
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Загрузка
    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Ошибка при загрузке")
        setPreview(null)
        return
      }

      // Обновляем сессию, чтобы аватар отобразился сразу
      await update({ image: data.avatar })
      setError("")
      
      // Обновляем страницу для отображения нового аватара
      router.refresh()
    } catch (err) {
      setError("Произошла ошибка при загрузке")
      setPreview(null)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/user/avatar", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Ошибка при удалении")
        return
      }

      setPreview(null)
      await update({ image: null })
      setError("")
      
      // Обновляем страницу
      router.refresh()
    } catch (err) {
      setError("Произошла ошибка при удалении")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    const name = session?.user?.name || session?.user?.email || "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarUrl = preview || session?.user?.image

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {avatarUrl ? (
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
            <Image
              src={avatarUrl}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200 dark:border-gray-700">
            {getInitials()}
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
          <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Загрузка..." : "Изменить"}
          </span>
        </label>
        {avatarUrl && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Удалить
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
        Рекомендуемый размер: 200x200px. Максимальный размер файла: 5MB
      </p>
    </div>
  )
}

