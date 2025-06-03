import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes a trailing timestamp in parentheses from a plan name.
 * Example: "Vegetarian Diet (20250603221250)" => "Vegetarian Diet"
 * This is for user-friendly display only, not for DB storage.
 */
export function stripPlanNameTimestamp(planName: string): string {
  return planName.replace(/ \(\d{14}\)$/, '').trim();
}