-- Direct migration script for two-week diet plan feature
-- Run this directly in the Supabase SQL Editor

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
        
        -- Log the change
        RAISE NOTICE 'Added week column to diet_food_items table';
    ELSE
        RAISE NOTICE 'Week column already exists in diet_food_items table';
    END IF;
END $$;

-- Step 2: Duplicate food items for week 2 if they don't already exist
DO $$
DECLARE
    meal_record RECORD;
    week2_count INTEGER;
    week1_count INTEGER;
BEGIN
    -- Count existing week 2 items
    SELECT COUNT(*) INTO week2_count FROM diet_food_items WHERE week = 2;
    SELECT COUNT(*) INTO week1_count FROM diet_food_items WHERE week = 1;
    
    RAISE NOTICE 'Found % items for week 1 and % items for week 2', week1_count, week2_count;
    
    -- Only proceed if we have week 1 items but no week 2 items
    IF week1_count > 0 AND week2_count = 0 THEN
        -- For each meal in the system
        FOR meal_record IN 
            SELECT DISTINCT diet_meal_id 
            FROM diet_food_items 
            WHERE week = 1
        LOOP
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
            
            RAISE NOTICE 'Duplicated items for meal_id % to week 2', meal_record.diet_meal_id;
        END LOOP;
        
        -- Count the items after duplication
        SELECT COUNT(*) INTO week2_count FROM diet_food_items WHERE week = 2;
        RAISE NOTICE 'Created % items for week 2', week2_count;
    ELSE
        RAISE NOTICE 'Skipping duplication: Week 2 items already exist or no Week 1 items found';
    END IF;
END $$;

-- Verify the migration
SELECT 
    'Migration completed' AS status,
    (SELECT COUNT(*) FROM diet_food_items WHERE week = 1) AS week1_items,
    (SELECT COUNT(*) FROM diet_food_items WHERE week = 2) AS week2_items;
