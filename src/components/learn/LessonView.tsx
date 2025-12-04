"use client";

import { useState } from "react";
import { lessons } from "@/lib/schema";

type Lesson = typeof lessons.$inferSelect;

export function LessonView({
  lesson,
  courseId: _courseId,
  isCompleted,
}: {
  lesson: Lesson;
  courseId: number;
  isCompleted: boolean;
}) {
  // courseId может быть использован в будущем для навигации или других функций
  // Префикс подчеркивания указывает, что параметр намеренно не используется
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);

  const handleToggleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          completed: !completed,
        }),
      });

      if (response.ok) {
        setCompleted(!completed);
        // Обновляем страницу для обновления прогресса
        window.location.reload();
      } else {
        alert("Ошибка при обновлении прогресса");
      }
    } catch {
      alert("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
        {lesson.title}
      </h1>

      {lesson.videoUrl && (
        <div className="mb-6">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <video
              src={lesson.videoUrl}
              controls
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}

      {lesson.content && (
        <div
          className="prose dark:prose-invert max-w-none mb-6 text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleToggleComplete}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            completed
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
          } disabled:opacity-50`}
        >
          {completed ? "✓ Урок пройден" : "Отметить как пройденный"}
        </button>
      </div>
    </div>
  );
}
