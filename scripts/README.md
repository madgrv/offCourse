# Diet Plan Database Optimisation Scripts

This directory contains scripts for auditing, cleaning up, and optimising the diet plan database structure.

## Available Scripts

### 1. Database Audit Script (`audit_database_structure.sql`)

This script provides a comprehensive audit of the database structure, including:
- Table listings with row counts and sizes
- Column information for each table
- Foreign key relationships
- Index information
- Redundancy analysis to identify similar tables

### 2. Database Cleanup and Optimisation Script (`cleanup_redundant_tables.sql`)

This script helps clean up and optimise the database after the migration to the new normalised structure:
- Safely identifies and removes redundant backup tables
- Verifies and adds proper foreign key constraints
- Creates strategic indexes for performance optimisation
- Includes maintenance commands for updating statistics
- Provides monitoring queries to track index usage

### 3. Data Verification Script (`verify_diet_plan_data.sql`)

This script helps verify the state of your data:
- Counts records in all main tables
- Checks for backup tables with data
- Determines if migration is needed

## How to Use These Scripts

1. **Audit First**: Run the audit script to understand your database structure
   ```sql
   \i audit_database_structure.sql
   ```

2. **Verify Data**: Run the verification script to check data status
   ```sql
   \i verify_diet_plan_data.sql
   ```

3. **Cleanup and Optimise**: Run the cleanup script in stages
   ```sql
   -- Run each section separately, reviewing results between steps
   \i cleanup_redundant_tables.sql
   ```

4. **Maintenance**: Run VACUUM ANALYSE separately after all changes
   ```sql
   VACUUM ANALYSE;
   ```

## Database Schema Overview

The diet plan application uses a normalised structure with these key tables:

1. **Main tables**:
   - `diet_plans` - Stores plan metadata with parent-child relationships
   - `plan_weeks` - Weeks within a diet plan (week_number)
   - `diet_days` - Days within a week (day_of_week)
   - `day_meals` - Meals within a day (meal_type)
   - `meal_food_items` - Food items within a meal
   - `food_items` - Reusable food item definitions

2. **User tracking tables**:
   - `user_food_item_completion` - Tracks user completion of food items
   - `user_nutrition_log` - Logs nutritional information

## Important Notes

- Always back up your database before running cleanup scripts
- Run scripts in sections rather than all at once
- Verify data integrity before dropping any tables
- VACUUM ANALYSE must be run separately, outside transaction blocks
