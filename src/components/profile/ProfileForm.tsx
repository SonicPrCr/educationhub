"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
}

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name || "");
  const [avatar, setAvatar] = useState(user.avatar);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      setError("Файл должен быть изображением");
      return;
    }

    // Проверка размера файла
    if (file.size > 5 * 1024 * 1024) {
      setError("Размер файла не должен превышать 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при загрузке аватара");
        setUploading(false);
        return;
      }

      setAvatar(data.avatar);
      setSuccess("Аватар успешно обновлен");
      router.refresh();

      // Очищаем сообщение об успехе через 3 секунды
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Произошла ошибка при загрузке");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Вы уверены, что хотите удалить аватар?")) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Ошибка при удалении аватара");
        setUploading(false);
        return;
      }

      setAvatar(null);
      setSuccess("Аватар удален");
      router.refresh();

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Произошла ошибка");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при обновлении профиля");
        setLoading(false);
        return;
      }

      setSuccess("Профиль успешно обновлен");
      router.refresh();

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Аватар */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Аватар
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatar ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                <Image
                  src={avatar}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-gray-400">
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Загрузка..." : avatar ? "Изменить" : "Загрузить"}
            </button>
            {avatar && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Удалить
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Рекомендуемый размер: 200x200px. Максимальный размер: 5MB
        </p>
      </div>

      {/* Сообщения */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Форма профиля */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Email нельзя изменить
          </p>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Имя
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите ваше имя"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </div>
  );
}
