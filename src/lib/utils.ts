import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Capitalize the first letter of a string. */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Derive the current semester ID from today's date. */
export function getCurrentSemesterId(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  if (month >= 0 && month <= 4) return `spring-${year}`;
  if (month >= 5 && month <= 6) return `summer-${year}`;
  return `fall-${year}`;
}
