-- Direct seeding script for the Italian two-week diet plan
-- Run this directly in the Supabase SQL Editor to bypass RLS policies

-- Function to seed the Italian two-week diet plan
CREATE OR REPLACE FUNCTION seed_italian_diet_plan(
    plan_name TEXT DEFAULT 'Italian Two-Week Diet Plan',
    plan_description TEXT DEFAULT 'A balanced two-week Italian diet plan with nutritious meals',
    is_template BOOLEAN DEFAULT true,
    owner_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    diet_plan_id UUID;
    day_record RECORD;
    meal_record RECORD;
    day_id UUID;
    meal_id UUID;
    day_names TEXT[] := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    meal_types TEXT[] := ARRAY['breakfast', 'lunch', 'snack', 'dinner'];
    week INT;
    day_name TEXT;
    meal_type TEXT;
    result JSONB;
    days_created INT := 0;
    meals_created INT := 0;
    food_items_created INT := 0;
BEGIN
    -- Create the diet plan
    INSERT INTO diet_plans (name, description, is_template, owner_id)
    VALUES (plan_name, plan_description, is_template, owner_id)
    RETURNING id INTO diet_plan_id;
    
    -- Create days, meals, and food items for each week and day
    FOR week IN 1..2 LOOP
        FOREACH day_name IN ARRAY day_names LOOP
            -- Create the day
            INSERT INTO diet_days (diet_plan_id, day_of_week)
            VALUES (diet_plan_id, day_name)
            RETURNING id INTO day_id;
            
            days_created := days_created + 1;
            
            -- Create meals for this day
            FOREACH meal_type IN ARRAY meal_types LOOP
                INSERT INTO diet_meals (diet_day_id, meal_type)
                VALUES (day_id, meal_type)
                RETURNING id INTO meal_id;
                
                meals_created := meals_created + 1;
                
                -- Insert sample food items for this meal based on meal type and day
                -- Breakfast items
                IF meal_type = 'breakfast' THEN
                    INSERT INTO diet_food_items (
                        diet_meal_id, food_name, calories, carbohydrates, 
                        protein, fat, sugars, quantity, unit, completed, week
                    ) VALUES
                    (meal_id, 'Italian Coffee', 5, 1, 0, 0, 0, 1, 'cup', false, week),
                    (meal_id, 'Whole Grain Toast', 80, 15, 3, 1, 1, 1, 'slice', false, week),
                    (meal_id, 'Ricotta with Honey', 150, 12, 8, 6, 12, 2, 'tbsp', false, week);
                    
                    food_items_created := food_items_created + 3;
                
                -- Lunch items
                ELSIF meal_type = 'lunch' THEN
                    INSERT INTO diet_food_items (
                        diet_meal_id, food_name, calories, carbohydrates, 
                        protein, fat, sugars, quantity, unit, completed, week
                    ) VALUES
                    (meal_id, 'Pasta with Tomato Sauce', 320, 65, 12, 3, 8, 1, 'serving', false, week),
                    (meal_id, 'Mixed Green Salad', 45, 5, 2, 0, 2, 1, 'cup', false, week),
                    (meal_id, 'Extra Virgin Olive Oil', 120, 0, 0, 14, 0, 1, 'tbsp', false, week);
                    
                    food_items_created := food_items_created + 3;
                
                -- Snack items
                ELSIF meal_type = 'snack' THEN
                    INSERT INTO diet_food_items (
                        diet_meal_id, food_name, calories, carbohydrates, 
                        protein, fat, sugars, quantity, unit, completed, week
                    ) VALUES
                    (meal_id, 'Fresh Fruit', 80, 20, 1, 0, 15, 1, 'piece', false, week),
                    (meal_id, 'Handful of Nuts', 170, 6, 6, 15, 1, 1, 'serving', false, week);
                    
                    food_items_created := food_items_created + 2;
                
                -- Dinner items
                ELSIF meal_type = 'dinner' THEN
                    INSERT INTO diet_food_items (
                        diet_meal_id, food_name, calories, carbohydrates, 
                        protein, fat, sugars, quantity, unit, completed, week
                    ) VALUES
                    (meal_id, 'Grilled Fish', 200, 0, 40, 6, 0, 1, 'fillet', false, week),
                    (meal_id, 'Roasted Vegetables', 120, 15, 3, 5, 6, 1, 'cup', false, week),
                    (meal_id, 'Glass of Red Wine', 125, 4, 0, 0, 1, 1, 'glass', false, week);
                    
                    food_items_created := food_items_created + 3;
                END IF;
                
                -- Add some variety for week 2
                IF week = 2 THEN
                    IF meal_type = 'breakfast' THEN
                        INSERT INTO diet_food_items (
                            diet_meal_id, food_name, calories, carbohydrates, 
                            protein, fat, sugars, quantity, unit, completed, week
                        ) VALUES
                        (meal_id, 'Fresh Orange Juice', 110, 26, 2, 0, 20, 1, 'glass', false, week);
                        
                        food_items_created := food_items_created + 1;
                    ELSIF meal_type = 'dinner' THEN
                        INSERT INTO diet_food_items (
                            diet_meal_id, food_name, calories, carbohydrates, 
                            protein, fat, sugars, quantity, unit, completed, week
                        ) VALUES
                        (meal_id, 'Italian Bread', 80, 15, 3, 1, 1, 1, 'slice', false, week);
                        
                        food_items_created := food_items_created + 1;
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Build result JSON
    result := jsonb_build_object(
        'success', true,
        'diet_plan_id', diet_plan_id,
        'plan_name', plan_name,
        'days_created', days_created,
        'meals_created', meals_created,
        'food_items_created', food_items_created
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to seed the diet plan
-- You can customize the parameters as needed
SELECT seed_italian_diet_plan(
    'Italian Two-Week Diet Plan',  -- plan_name
    'A balanced two-week Italian diet plan with nutritious meals',  -- plan_description
    true,  -- is_template (true for template, false for user-specific)
    NULL   -- owner_id (NULL for template, or specify a user ID)
);

-- Clean up (remove the function after use)
DROP FUNCTION IF EXISTS seed_italian_diet_plan;
