-- Script to import food items from the backup data
-- This script should be run after cleanup_and_recreate_plans.sql

BEGIN;

-- Function to import food items for a specific plan and week
CREATE OR REPLACE FUNCTION import_food_items_for_plan(
    p_plan_name TEXT,
    p_json_data JSON
) RETURNS void AS $$
DECLARE
    food_item RECORD;
    meal_id UUID;
BEGIN
    -- Loop through the food items from the provided JSON data
    FOR food_item IN 
        SELECT * FROM json_to_recordset(p_json_data) AS x(
            plan_name TEXT,
            day_of_week TEXT,
            meal_type TEXT,
            food_item_id INTEGER,
            diet_meal_id UUID,
            food_name TEXT,
            calories INTEGER,
            carbohydrates TEXT,
            protein TEXT,
            fat TEXT,
            sugars TEXT,
            quantity TEXT,
            unit TEXT,
            completed BOOLEAN,
            week INTEGER
        )
        WHERE plan_name = p_plan_name
    LOOP
        -- Find the meal ID for this plan, day, and meal type
        meal_id := find_meal_id(
            food_item.plan_name,
            food_item.day_of_week,
            food_item.meal_type,
            COALESCE(food_item.week, 1)
        );
        
        -- If meal_id is found, add the food item
        IF meal_id IS NOT NULL THEN
            PERFORM add_food_item_to_meal(
                meal_id,
                food_item.food_name,
                food_item.calories,
                food_item.carbohydrates::NUMERIC,
                food_item.protein::NUMERIC,
                food_item.fat::NUMERIC,
                food_item.sugars::NUMERIC,
                food_item.quantity::NUMERIC,
                food_item.unit,
                food_item.completed,
                COALESCE(food_item.week, 1)
            );
        ELSE
            RAISE NOTICE 'Could not find meal for plan: %, day: %, meal: %, week: %', 
                food_item.plan_name, food_item.day_of_week, food_item.meal_type, COALESCE(food_item.week, 1);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a more efficient approach to import food items from the backup data
DO $$
DECLARE
    food_items_json JSON;
    food_item RECORD;
    meal_id UUID;
    processed_count INTEGER := 0;
    duplicate_count INTEGER := 0;
    current_plan TEXT := '';
    current_day TEXT := '';
    current_meal TEXT := '';
    current_week INTEGER := 0;
BEGIN
    -- Load the actual JSON data from your backup file
    -- This is the Blue Zone Diet data you provided
    food_items_json := '[  
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "breakfast",
        "food_item_id": 2239,
        "diet_meal_id": "53039cb1-123a-4728-81be-8f7065d4ef9e",
        "food_name": "Barley coffee",
        "calories": 10,
        "carbohydrates": "2",
        "protein": "0.5",
        "fat": "0",
        "sugars": "0",
        "quantity": "200",
        "unit": "ml",
        "completed": false,
        "week": 2
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "breakfast",
        "food_item_id": 1023,
        "diet_meal_id": "53039cb1-123a-4728-81be-8f7065d4ef9e",
        "food_name": "Barley coffee",
        "calories": 10,
        "carbohydrates": "2",
        "protein": "0.5",
        "fat": "0",
        "sugars": "0",
        "quantity": "200",
        "unit": "ml",
        "completed": false,
        "week": 1
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "breakfast",
        "food_item_id": 1025,
        "diet_meal_id": "53039cb1-123a-4728-81be-8f7065d4ef9e",
        "food_name": "Fresh tomatoes with olive oil",
        "calories": 115,
        "carbohydrates": "7",
        "protein": "1.5",
        "fat": "9.5",
        "sugars": "5",
        "quantity": "150",
        "unit": "g",
        "completed": false,
        "week": 1
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "breakfast",
        "food_item_id": 2241,
        "diet_meal_id": "53039cb1-123a-4728-81be-8f7065d4ef9e",
        "food_name": "Fresh tomatoes with olive oil",
        "calories": 115,
        "carbohydrates": "7",
        "protein": "1.5",
        "fat": "9.5",
        "sugars": "5",
        "quantity": "150",
        "unit": "g",
        "completed": false,
        "week": 2
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "breakfast",
        "food_item_id": 1024,
        "diet_meal_id": "53039cb1-123a-4728-81be-8f7065d4ef9e",
        "food_name": "Whole grain bread",
        "calories": 120,
        "carbohydrates": "22",
        "protein": "4",
        "fat": "1",
        "sugars": "1.5",
        "quantity": "60",
        "unit": "g",
        "completed": false,
        "week": 1
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "breakfast",
        "food_item_id": 2240,
        "diet_meal_id": "53039cb1-123a-4728-81be-8f7065d4ef9e",
        "food_name": "Whole grain bread",
        "calories": 120,
        "carbohydrates": "22",
        "protein": "4",
        "fat": "1",
        "sugars": "1.5",
        "quantity": "60",
        "unit": "g",
        "completed": false,
        "week": 2
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "dinner",
        "food_item_id": 2292,
        "diet_meal_id": "5e4c82a5-cf37-4a96-b0bb-899d9653e75f",
        "food_name": "Cannonau wine",
        "calories": 85,
        "carbohydrates": "3",
        "protein": "0.1",
        "fat": "0",
        "sugars": "1",
        "quantity": "100",
        "unit": "ml",
        "completed": false,
        "week": 2
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "dinner",
        "food_item_id": 1033,
        "diet_meal_id": "5e4c82a5-cf37-4a96-b0bb-899d9653e75f",
        "food_name": "Cannonau wine",
        "calories": 85,
        "carbohydrates": "3",
        "protein": "0.1",
        "fat": "0",
        "sugars": "1",
        "quantity": "100",
        "unit": "ml",
        "completed": false,
        "week": 1
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "dinner",
        "food_item_id": 1031,
        "diet_meal_id": "5e4c82a5-cf37-4a96-b0bb-899d9653e75f",
        "food_name": "Grilled fish (local catch)",
        "calories": 180,
        "carbohydrates": "0",
        "protein": "36",
        "fat": "3",
        "sugars": "0",
        "quantity": "150",
        "unit": "g",
        "completed": false,
        "week": 1
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "dinner",
        "food_item_id": 2290,
        "diet_meal_id": "5e4c82a5-cf37-4a96-b0bb-899d9653e75f",
        "food_name": "Grilled fish (local catch)",
        "calories": 180,
        "carbohydrates": "0",
        "protein": "36",
        "fat": "3",
        "sugars": "0",
        "quantity": "150",
        "unit": "g",
        "completed": false,
        "week": 2
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "dinner",
        "food_item_id": 1032,
        "diet_meal_id": "5e4c82a5-cf37-4a96-b0bb-899d9653e75f",
        "food_name": "Roasted vegetables",
        "calories": 120,
        "carbohydrates": "25",
        "protein": "4",
        "fat": "1",
        "sugars": "10",
        "quantity": "200",
        "unit": "g",
        "completed": false,
        "week": 1
      },
      {
        "plan_name": "Blue Zone Diet",
        "day_of_week": "Friday",
        "meal_type": "dinner",
        "food_item_id": 2291,
        "diet_meal_id": "5e4c82a5-cf37-4a96-b0bb-899d9653e75f",
        "food_name": "Roasted vegetables",
        "calories": 120,
        "carbohydrates": "25",
        "protein": "4",
        "fat": "1",
        "sugars": "10",
        "quantity": "200",
        "unit": "g",
        "completed": false,
        "week": 2
      }
    ]';
    
    -- Process each food item
    FOR food_item IN 
        SELECT * FROM json_to_recordset(food_items_json) AS x(
            plan_name TEXT,
            day_of_week TEXT,
            meal_type TEXT,
            food_item_id INTEGER,
            diet_meal_id UUID,
            food_name TEXT,
            calories INTEGER,
            carbohydrates TEXT,
            protein TEXT,
            fat TEXT,
            sugars TEXT,
            quantity TEXT,
            unit TEXT,
            completed BOOLEAN,
            week INTEGER
        )
        ORDER BY plan_name, day_of_week, meal_type, week
    LOOP
        -- Log progress for debugging
        IF current_plan != food_item.plan_name OR current_day != food_item.day_of_week OR 
           current_meal != food_item.meal_type OR current_week != food_item.week THEN
            
            RAISE NOTICE 'Processing: % - % - % (Week %)', 
                food_item.plan_name, food_item.day_of_week, food_item.meal_type, food_item.week;
                
            current_plan := food_item.plan_name;
            current_day := food_item.day_of_week;
            current_meal := food_item.meal_type;
            current_week := food_item.week;
        END IF;
        
        -- Find the meal ID for this plan, day, and meal type
        meal_id := find_meal_id(
            food_item.plan_name,
            food_item.day_of_week,
            food_item.meal_type,
            COALESCE(food_item.week, 1)
        );
        
        -- If meal_id is found, add the food item
        IF meal_id IS NOT NULL THEN
            -- The add_food_item_to_meal function will check for duplicates
            -- and return the existing ID if a duplicate is found
            PERFORM add_food_item_to_meal(
                meal_id,
                food_item.food_name,
                food_item.calories,
                food_item.carbohydrates::NUMERIC,
                food_item.protein::NUMERIC,
                food_item.fat::NUMERIC,
                food_item.sugars::NUMERIC,
                food_item.quantity::NUMERIC,
                food_item.unit,
                food_item.completed,
                COALESCE(food_item.week, 1)
            );
            
            processed_count := processed_count + 1;
        ELSE
            RAISE NOTICE 'Could not find meal for plan: %, day: %, meal: %, week: %', 
                food_item.plan_name, food_item.day_of_week, food_item.meal_type, COALESCE(food_item.week, 1);
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Import completed. Processed % food items.', processed_count;
END $$;

-- Verify the import
SELECT 
    dp.name AS plan_name,
    pw.week_number,
    dd.day_of_week,
    dm.meal_type,
    COUNT(dfi.id) AS food_items_count
FROM 
    diet_plans dp
JOIN 
    plan_weeks pw ON dp.id = pw.diet_plan_id
JOIN 
    diet_days dd ON dp.id = dd.diet_plan_id AND dd.plan_week_id = pw.id
JOIN 
    diet_meals dm ON dd.id = dm.diet_day_id
LEFT JOIN 
    diet_food_items dfi ON dm.id = dfi.diet_meal_id
GROUP BY 
    dp.name, pw.week_number, dd.day_of_week, dm.meal_type
ORDER BY 
    dp.name, pw.week_number, dd.day_of_week, dm.meal_type;

COMMIT;

-- Note: You'll need to replace the placeholder JSON data in the import_food_items_for_plan function
-- with your actual backup data. You can either:
-- 1. Paste the JSON directly into the function
-- 2. Load it from a file using PostgreSQL's file reading functions (if available in your environment)
-- 3. Split the import into multiple smaller scripts if the data is too large
