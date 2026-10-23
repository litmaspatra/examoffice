import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export function formatWPM(wpm: number): string {
  return wpm.toFixed(1);
}

export function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getLanguageName(lang: string): string {
  const names: Record<string, string> = {
    english: "English",
    hindi: "Hindi (हिंदी)",
    marathi: "Marathi (मराठी)",
    gujarati: "Gujarati (ગુજરાતી)",
    punjabi: "Punjabi (ਪੰਜਾਬੀ)",
    tamil: "Tamil (தமிழ்)",
    telugu: "Telugu (తెలుగు)",
    kannada: "Kannada (ಕನ್ನಡ)",
    malayalam: "Malayalam (മലയാളം)",
    bengali: "Bengali (বাংলা)",
    oriya: "Odia (ଓଡ଼ିଆ)",
    assamese: "Assamese (অসমীয়া)",
    urdu: "Urdu (اردو)",
  };
  return names[lang] || lang;
}

export function getPaperTypeName(type: string): string {
  const names: Record<string, string> = {
    typing: "Typing Test",
    formatting: "Formatting",
    code: "Code Typing",
    mixed: "Mixed",
  };
  return names[type] || type;
}

export function getScoringMethodName(method: string): string {
  const names: Record<string, string> = {
    standard: "Standard WPM",
    indian_govt: "Indian Govt Standard",
    cpct: "CPCT",
    ssc: "SSC",
  };
  return names[method] || method;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}