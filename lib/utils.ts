import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "beginner":
      return "text-green-600 bg-green-50 border-green-200";
    case "intermediate":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "advanced":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getTypeIcon(type: string) {
  switch (type) {
    case "educational":
      return "📚";
    case "tutorial":
      return "🎯";
    case "reference":
      return "📖";
    case "news":
      return "📰";
    default:
      return "📝";
  }
}
