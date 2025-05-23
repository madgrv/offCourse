# offCourse
https://diet.offmachines.com

## Personal Diet Tracking Application

This is a modern web application for tracking personal diet, meals, and nutrition. The app allows users to:

- Sign in and manage their own diet plans
- Clone template diet plans and customise them
- Track meals, calories, carbohydrates, sugars, and other macros
- Mark meals and food items as completed
- View analytics and progress based on real data
- Experience responsive and accessible UI built with reusable shared components

### Data Fetching and State Management

The application now uses **SWR** (stale-while-revalidate) for efficient data fetching and caching. This ensures:
- Fast UI updates with cached data
- Automatic background revalidation for fresh data
- Simplified hooks-based data access throughout the app

### Technical Stack
- Next.js App Router
- TypeScript
- Supabase (for authentication and storage)
- SWR (for data fetching and caching)
- Modular, well-commented codebase

---

For developer setup and contribution guidelines, see below (expand as needed).
