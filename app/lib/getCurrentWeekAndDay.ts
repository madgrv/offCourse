// Utility to get the current week (1 or 2) and day of the week
// This determines which week of the 2-week diet plan cycle we are in
// and which day tab should be active

interface WeekAndDay {
  week: 1 | 2;
  day: string;
}

/**
 * Determines the current week (1 or 2) and day based on the current date
 * Week alternation is based on the start date of the diet plan
 * @param startDateStr Optional ISO string date when the diet plan started (defaults to 2 weeks ago)
 * @returns Object containing the current week (1 or 2) and day name
 */
export function getCurrentWeekAndDay(startDateStr?: string): WeekAndDay {
  // Get current date
  const today = new Date();
  
  // Parse the start date from ISO string if provided
  // If no start date is provided, default to 2 weeks ago
  let planStartDate: Date;
  
  if (startDateStr) {
    try {
      planStartDate = new Date(startDateStr);
      // Check if the date is valid
      if (isNaN(planStartDate.getTime())) {
        // If invalid, default to 2 weeks ago
        planStartDate = new Date(today);
        planStartDate.setDate(planStartDate.getDate() - 14);
      }
    } catch (e) {
      // If parsing fails, default to 2 weeks ago
      planStartDate = new Date(today);
      planStartDate.setDate(planStartDate.getDate() - 14);
    }
  } else {
    // No start date provided, default to 2 weeks ago
    planStartDate = new Date(today);
    planStartDate.setDate(planStartDate.getDate() - 14);
  }
  
  // Calculate days elapsed since the plan started
  const msInDay = 24 * 60 * 60 * 1000;
  const daysSincePlanStart = Math.floor(
    (today.getTime() - planStartDate.getTime()) / msInDay
  );
  
  // Determine which week we're in (1 or 2)
  // Week 1 is days 0-6, Week 2 is days 7-13, then it repeats
  const weekInCycle = (Math.floor(daysSincePlanStart / 7) % 2) + 1 as 1 | 2;
  
  // Get the day name (Monday, Tuesday, etc.)
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
  
  // Return with first letter capitalized to match our database format
  return {
    week: weekInCycle,
    day: dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase()
  };
}

/**
 * Formats a week number and day into a unique identifier
 * @param week Week number (1 or 2)
 * @param day Day name (e.g., "Monday")
 * @returns Formatted string like "week1_Monday"
 */
export function formatWeekDay(week: 1 | 2, day: string): string {
  return `week${week}_${day}`;
}

/**
 * Parses a formatted week_day string back into its components
 * @param weekDay Formatted string like "week1_Monday"
 * @returns Object with week and day, or null if invalid format
 */
export function parseWeekDay(weekDay: string): { week: 1 | 2; day: string } | null {
  const match = weekDay.match(/^week([12])_(.+)$/);
  if (!match) return null;
  
  return {
    week: parseInt(match[1]) as 1 | 2,
    day: match[2]
  };
}
