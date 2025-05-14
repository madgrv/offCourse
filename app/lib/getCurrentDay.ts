// Utility to get the current day of the week as a lowercase string, matching the format used in the diet plan tabs.
// This is separated for clarity and easy testing. Locale is always set to 'en-GB' for consistency.
export function getCurrentDay(): string {
  // Get the day as a string, e.g., 'monday'
  return new Date().toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase();
}
