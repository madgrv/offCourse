/**
 * Parses a composite week-day key into its week and day components
 * @param weekDayKey - The composite key in format "weekX_DayName" (e.g., "week1_Monday")
 * @returns An object with the week number and day name
 */
export function parseWeekDay(weekDayKey: string): { week: number; day: string } {
  // Default to week 1 if no week prefix is found (for backward compatibility)
  if (!weekDayKey.startsWith('week')) {
    return { week: 1, day: weekDayKey };
  }

  const parts = weekDayKey.split('_');
  if (parts.length !== 2) {
    // Invalid format, return defaults
    return { week: 1, day: weekDayKey };
  }

  const weekPart = parts[0]; // e.g., "week1"
  const day = parts[1]; // e.g., "Monday"
  
  // Extract the week number, defaulting to 1 if parsing fails
  const weekNumber = parseInt(weekPart.replace('week', ''), 10);
  const week = isNaN(weekNumber) ? 1 : weekNumber;

  return { week, day };
}

/**
 * Formats a week number and day into a composite week-day key
 * @param week - The week number (1 or 2)
 * @param day - The day name (e.g., "Monday")
 * @returns The composite key in format "weekX_DayName"
 */
export function formatWeekDay(week: number, day: string): string {
  return `week${week}_${day}`;
}
