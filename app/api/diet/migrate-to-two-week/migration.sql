-- Migration script for two-week diet plan feature
-- This script adds the 'week' column to diet_food_items table if it doesn't exist
-- and creates a copy of existing food items for week 2

-- Step 1: Check if the week column exists, and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'diet_food_items'
        AND column_name = 'week'
    ) THEN
        -- Add the week column with default value 1 (existing items will be week 1)
        ALTER TABLE diet_food_items ADD COLUMN week INTEGER DEFAULT 1;
        
        -- Update all existing items to be week 1 explicitly
        UPDATE diet_food_items SET week = 1 WHERE week IS NULL;
    END IF;
END $$;

-- Step 2: Create a function to duplicate food items for week 2
-- This will only run once and won't duplicate items that already have week=2
CREATE OR REPLACE FUNCTION duplicate_food_items_for_week_2() RETURNS void AS $$
DECLARE
    meal_record RECORD;
BEGIN
    -- For each meal in the system
    FOR meal_record IN 
        SELECT DISTINCT diet_meal_id 
        FROM diet_food_items 
        WHERE week = 1
    LOOP
        -- Check if week 2 items already exist for this meal
        IF NOT EXISTS (
            SELECT 1 
            FROM diet_food_items 
            WHERE diet_meal_id = meal_record.diet_meal_id 
            AND week = 2
        ) THEN
            -- Duplicate week 1 items as week 2 items
            INSERT INTO diet_food_items (
                diet_meal_id, food_name, calories, carbohydrates, 
                protein, fat, sugars, quantity, unit, completed, week
            )
            SELECT 
                diet_meal_id, food_name, calories, carbohydrates, 
                protein, fat, sugars, quantity, unit, completed, 2
            FROM diet_food_items
            WHERE diet_meal_id = meal_record.diet_meal_id
            AND week = 1;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to duplicate items
SELECT duplicate_food_items_for_week_2();

-- Drop the function after use
DROP FUNCTION IF EXISTS duplicate_food_items_for_week_2();

-- Return success message
SELECT 'Migration completed successfully: Added week column and duplicated food items for week 2' AS result;
