"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EnrollButton({ courseId }: { courseId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });

      if (response.ok) {
        router.push(`/learn/${courseId}`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при записи на курс");
      }
    } catch {
      alert("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Запись..." : "Записаться на курс"}
    </button>
  );
}
