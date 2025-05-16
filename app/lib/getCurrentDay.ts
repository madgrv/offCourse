// Utility to get the current day of the week, matching the format used in the diet plan tabs.
// This is separated for clarity and easy testing. Locale is always set to 'en-GB' for consistency.
export function getCurrentDay(): string {
  // Get the day as a string, e.g., 'Monday'
  const day = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  // Return with first letter capitalized to match our database format
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}
