-- Script to fix cloned diet plans by copying food items from the template to all user diet plans
-- This script will add food items to any diet plans that are missing them

-- First, identify the template diet plan with food items
DO $$
DECLARE
    template_id UUID;
    user_plan RECORD;
    template_meal RECORD;
    user_meal RECORD;
    template_food RECORD;
    current_day TEXT;
    current_meal TEXT;
    days TEXT[] := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    meal_types TEXT[] := ARRAY['breakfast', 'lunch', 'snack', 'dinner'];
BEGIN
    -- Find a diet plan that has food items (likely the template)
    SELECT DISTINCT dp.id INTO template_id
    FROM diet_plans dp
    JOIN diet_days dd ON dp.id = dd.diet_plan_id
    JOIN diet_meals dm ON dd.id = dm.diet_day_id
    JOIN diet_food_items dfi ON dm.id = dfi.diet_meal_id
    WHERE dp.is_template = true
    LIMIT 1;
    
    IF template_id IS NULL THEN
        -- If no template with food items exists, use any plan that has food items
        SELECT DISTINCT dp.id INTO template_id
        FROM diet_plans dp
        JOIN diet_days dd ON dp.id = dd.diet_plan_id
        JOIN diet_meals dm ON dd.id = dm.diet_day_id
        JOIN diet_food_items dfi ON dm.id = dfi.diet_meal_id
        LIMIT 1;
    END IF;
    
    IF template_id IS NULL THEN
        RAISE EXCEPTION 'No diet plan with food items found';
    END IF;
    
    RAISE NOTICE 'Using template diet plan ID: %', template_id;
    
    -- Loop through all user diet plans (non-template)
    FOR user_plan IN 
        SELECT dp.id, dp.name
        FROM diet_plans dp
        WHERE dp.id != template_id
        AND dp.is_template = false
    LOOP
        RAISE NOTICE 'Processing user diet plan: % (ID: %)', user_plan.name, user_plan.id;
        
        -- For each day of the week
        FOREACH current_day IN ARRAY days
        LOOP
            -- For each meal type
            FOREACH current_meal IN ARRAY meal_types
            LOOP
                -- Find the template meal for this day and type
                SELECT dm.id, dm.diet_day_id, dm.meal_type INTO template_meal
                FROM diet_meals dm
                JOIN diet_days dd ON dm.diet_day_id = dd.id
                WHERE dd.diet_plan_id = template_id
                AND dd.day_of_week = current_day
                AND dm.meal_type = current_meal
                LIMIT 1;
                
                IF template_meal IS NOT NULL THEN
                    -- Find the corresponding user meal
                    SELECT dm.id, dm.diet_day_id, dm.meal_type INTO user_meal
                    FROM diet_meals dm
                    JOIN diet_days dd ON dm.diet_day_id = dd.id
                    WHERE dd.diet_plan_id = user_plan.id
                    AND dd.day_of_week = current_day
                    AND dm.meal_type = current_meal
                    LIMIT 1;
                    
                    IF user_meal IS NOT NULL THEN
                        -- Check if the user meal already has food items
                        PERFORM 1 FROM diet_food_items WHERE diet_meal_id = user_meal.id LIMIT 1;
                        
                        IF NOT FOUND THEN
                            -- Copy food items from template meal to user meal
                            FOR template_food IN
                                SELECT * FROM diet_food_items WHERE diet_meal_id = template_meal.id
                            LOOP
                                INSERT INTO diet_food_items (
                                    diet_meal_id, food_name, calories, carbohydrates, protein, fat, sugars, quantity, unit, completed
                                ) VALUES (
                                    user_meal.id,
                                    template_food.food_name,
                                    template_food.calories,
                                    template_food.carbohydrates,
                                    template_food.protein,
                                    template_food.fat,
                                    template_food.sugars,
                                    template_food.quantity,
                                    template_food.unit,
                                    false
                                );
                            END LOOP;
                            
                            RAISE NOTICE 'Added food items to % meal on % for plan %', current_meal, current_day, user_plan.name;
                        ELSE
                            RAISE NOTICE 'Meal % on % for plan % already has food items', current_meal, current_day, user_plan.name;
                        END IF;
                    ELSE
                        RAISE NOTICE 'No % meal found for % in plan %', current_meal, current_day, user_plan.name;
                    END IF;
                ELSE
                    RAISE NOTICE 'No template % meal found for %', current_meal, current_day;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Verify the food items were added
SELECT 
    dp.name AS diet_plan_name,
    dd.day_of_week,
    dm.meal_type,
    COUNT(dfi.id) AS food_item_count
FROM 
    diet_plans dp
JOIN 
    diet_days dd ON dp.id = dd.diet_plan_id
JOIN 
    diet_meals dm ON dd.id = dm.diet_day_id
LEFT JOIN 
    diet_food_items dfi ON dm.id = dfi.diet_meal_id
GROUP BY 
    dp.name, dd.day_of_week, dm.meal_type
ORDER BY 
    dp.name,
    CASE dd.day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
    END,
    CASE dm.meal_type
        WHEN 'breakfast' THEN 1
        WHEN 'lunch' THEN 2
        WHEN 'snack' THEN 3
        WHEN 'dinner' THEN 4
    END;
