# Two-Week Alternating Diet Plan

## Overview

The two-week alternating diet plan feature allows users to create and follow a diet plan that alternates between two different weekly meal plans. This provides more variety and flexibility compared to a single-week repeating plan.

## Key Features

- **Week Tracking**: The system automatically determines which week of the plan (Week 1 or Week 2) the user is currently in based on the plan's start date.
- **Week Selection**: Users can manually switch between viewing Week 1 and Week 2 meal plans.
- **Day Navigation**: The current day is highlighted, making it easy for users to find today's meals.
- **Separate Meal Data**: Each week maintains its own set of meals and food items, allowing for completely different meal plans between weeks.

## Technical Implementation

### Database Schema

The diet plan data structure has been extended to support the two-week format:

- Added a `week` column to the `diet_food_items` table (values: 1 or 2)
- Modified data fetching to retrieve food items for both weeks
- Updated the diet plan data structure to include week-prefixed day keys (e.g., `week1_Monday`, `week2_Monday`)

### Current Week Determination

The current week is determined by:

1. Calculating the number of days elapsed since the diet plan's start date
2. Dividing by 7 and taking the remainder after dividing by 2
3. Adding 1 to get either Week 1 or Week 2

```typescript
// Determine which week we're in (1 or 2)
// Week 1 is days 0-6, Week 2 is days 7-13, then it repeats
const weekInCycle = (Math.floor(daysSincePlanStart / 7) % 2) + 1;
```

### Data Structure

The diet plan data is structured as follows:

```typescript
{
  id: "plan-id",
  days: {
    "week1_Monday": { meals: { breakfast: [...], lunch: [...], ... } },
    "week1_Tuesday": { meals: { ... } },
    // ... other days in week 1
    "week2_Monday": { meals: { breakfast: [...], lunch: [...], ... } },
    "week2_Tuesday": { meals: { ... } },
    // ... other days in week 2
  },
  planName: "My Diet Plan",
  planDescription: "Description",
  startDate: "2025-05-25T12:00:00Z" // ISO string date when the plan was created
}
```

## Migration

For existing diet plans, a migration script is available to:

1. Add the `week` column to the `diet_food_items` table if it doesn't exist
2. Set all existing food items to Week 1
3. Create duplicates of all food items for Week 2

To run the migration:

1. Navigate to `/admin/migrate-to-two-week` in the application
2. Click the "Run Migration" button
3. Wait for the migration to complete

**Note**: Only users with admin privileges can run the migration.

## Usage for End Users

1. **View Current Week**: The current week and day are displayed at the top of the diet plan page.
2. **Switch Weeks**: Use the "Week 1" and "Week 2" buttons to toggle between viewing each week's meal plan.
3. **Edit Meals**: Edit meals as usual - changes will be saved to the specific week you're currently viewing.
4. **Track Completion**: Meal and food item completion is tracked separately for each week.

## Development Considerations

When developing features that interact with the diet plan:

1. Always use the week-prefixed day format (e.g., `week1_Monday`) when accessing meal data
2. Use the provided utility functions:
   - `getCurrentWeekAndDay(startDate)`: Determines the current week and day
   - `formatWeekDay(week, day)`: Formats a week and day into the composite key
   - `parseWeekDay(weekDay)`: Parses a composite key back into week and day components
3. Remember that the diet plan's `startDate` is used to determine the current week in the cycle

## Troubleshooting

If users encounter issues with the two-week plan:

1. Check that the diet plan has a valid `startDate`
2. Verify that food items have the correct `week` value in the database
3. Ensure the migration has been run successfully for existing plans
