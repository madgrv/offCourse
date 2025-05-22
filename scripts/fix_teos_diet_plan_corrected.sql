-- SQL script to fix Teo's Diet plan to match the spreadsheet exactly
-- This will delete all existing food items and meals for the plan, then recreate them correctly

-- First, identify the main plan ID to use
-- We'll use the first one from the list: a0eff679-eb84-482d-bf4f-a920ecd45df7
DO $$
DECLARE
    plan_id UUID := 'a0eff679-eb84-482d-bf4f-a920ecd45df7';
    monday_id UUID;
    tuesday_id UUID;
    wednesday_id UUID;
    thursday_id UUID;
    friday_id UUID;
    saturday_id UUID;
    sunday_id UUID;
    
    -- Meal IDs for each day
    monday_breakfast_id UUID;
    monday_lunch_id UUID;
    monday_snack_id UUID;
    monday_dinner_id UUID;
    
    tuesday_breakfast_id UUID;
    tuesday_lunch_id UUID;
    tuesday_snack_id UUID;
    tuesday_dinner_id UUID;
    
    wednesday_breakfast_id UUID;
    wednesday_lunch_id UUID;
    wednesday_snack_id UUID;
    wednesday_dinner_id UUID;
    
    thursday_breakfast_id UUID;
    thursday_lunch_id UUID;
    thursday_snack_id UUID;
    thursday_dinner_id UUID;
    
    friday_breakfast_id UUID;
    friday_lunch_id UUID;
    friday_snack_id UUID;
    friday_dinner_id UUID;
    
    saturday_breakfast_id UUID;
    saturday_lunch_id UUID;
    saturday_snack_id UUID;
    saturday_dinner_id UUID;
    
    sunday_breakfast_id UUID;
    sunday_lunch_id UUID;
    sunday_snack_id UUID;
    sunday_dinner_id UUID;
    
BEGIN
    -- Step 1: Remove all food items for Teo's Diet
    DELETE FROM diet_food_items
    WHERE diet_meal_id IN (
        SELECT dm.id
        FROM diet_meals dm
        JOIN diet_days dd ON dm.diet_day_id = dd.id
        JOIN diet_plans dp ON dd.diet_plan_id = dp.id
        WHERE dp.name = 'Teo''s Diet'
    );
    
    -- Step 2: Remove all meals for Teo's Diet
    DELETE FROM diet_meals
    WHERE diet_day_id IN (
        SELECT dd.id
        FROM diet_days dd
        JOIN diet_plans dp ON dd.diet_plan_id = dp.id
        WHERE dp.name = 'Teo''s Diet'
    );
    
    -- Step 3: Remove all days for Teo's Diet (to start fresh)
    DELETE FROM diet_days
    WHERE diet_plan_id IN (
        SELECT id FROM diet_plans WHERE name = 'Teo''s Diet'
    );
    
    -- Step 4: Create fresh days for the plan
    INSERT INTO diet_days (diet_plan_id, day_of_week, total_calories)
    VALUES 
        (plan_id, 'Monday', 1566);
    
    INSERT INTO diet_days (diet_plan_id, day_of_week, total_calories)
    VALUES 
        (plan_id, 'Tuesday', 1827);
    
    INSERT INTO diet_days (diet_plan_id, day_of_week, total_calories)
    VALUES 
        (plan_id, 'Wednesday', 1374);
    
    INSERT INTO diet_days (diet_plan_id, day_of_week, total_calories)
    VALUES 
        (plan_id, 'Thursday', 1941);
    
    INSERT INTO diet_days (diet_plan_id, day_of_week, total_calories)
    VALUES 
        (plan_id, 'Friday', 1724);
    
    INSERT INTO diet_days (diet_plan_id, day_of_week, total_calories)
    VALUES 
        (plan_id, 'Saturday', 2398);
    
    INSERT INTO diet_days (diet_plan_id, day_of_week, total_calories)
    VALUES 
        (plan_id, 'Sunday', 2838);
    
    -- Get all day IDs
    SELECT id INTO monday_id FROM diet_days WHERE diet_plan_id = plan_id AND day_of_week = 'Monday';
    SELECT id INTO tuesday_id FROM diet_days WHERE diet_plan_id = plan_id AND day_of_week = 'Tuesday';
    SELECT id INTO wednesday_id FROM diet_days WHERE diet_plan_id = plan_id AND day_of_week = 'Wednesday';
    SELECT id INTO thursday_id FROM diet_days WHERE diet_plan_id = plan_id AND day_of_week = 'Thursday';
    SELECT id INTO friday_id FROM diet_days WHERE diet_plan_id = plan_id AND day_of_week = 'Friday';
    SELECT id INTO saturday_id FROM diet_days WHERE diet_plan_id = plan_id AND day_of_week = 'Saturday';
    SELECT id INTO sunday_id FROM diet_days WHERE diet_plan_id = plan_id AND day_of_week = 'Sunday';
    
    -- Step 5: Create meals for each day
    -- MONDAY
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (monday_id, 'breakfast') 
    RETURNING id INTO monday_breakfast_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (monday_id, 'lunch') 
    RETURNING id INTO monday_lunch_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (monday_id, 'snack') 
    RETURNING id INTO monday_snack_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (monday_id, 'dinner') 
    RETURNING id INTO monday_dinner_id;
    
    -- TUESDAY
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (tuesday_id, 'breakfast') 
    RETURNING id INTO tuesday_breakfast_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (tuesday_id, 'lunch') 
    RETURNING id INTO tuesday_lunch_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (tuesday_id, 'snack') 
    RETURNING id INTO tuesday_snack_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (tuesday_id, 'dinner') 
    RETURNING id INTO tuesday_dinner_id;
    
    -- WEDNESDAY
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (wednesday_id, 'breakfast') 
    RETURNING id INTO wednesday_breakfast_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (wednesday_id, 'lunch') 
    RETURNING id INTO wednesday_lunch_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (wednesday_id, 'snack') 
    RETURNING id INTO wednesday_snack_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (wednesday_id, 'dinner') 
    RETURNING id INTO wednesday_dinner_id;
    
    -- THURSDAY
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (thursday_id, 'breakfast') 
    RETURNING id INTO thursday_breakfast_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (thursday_id, 'lunch') 
    RETURNING id INTO thursday_lunch_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (thursday_id, 'snack') 
    RETURNING id INTO thursday_snack_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (thursday_id, 'dinner') 
    RETURNING id INTO thursday_dinner_id;
    
    -- FRIDAY
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (friday_id, 'breakfast') 
    RETURNING id INTO friday_breakfast_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (friday_id, 'lunch') 
    RETURNING id INTO friday_lunch_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (friday_id, 'snack') 
    RETURNING id INTO friday_snack_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (friday_id, 'dinner') 
    RETURNING id INTO friday_dinner_id;
    
    -- SATURDAY
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (saturday_id, 'breakfast') 
    RETURNING id INTO saturday_breakfast_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (saturday_id, 'lunch') 
    RETURNING id INTO saturday_lunch_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (saturday_id, 'snack') 
    RETURNING id INTO saturday_snack_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (saturday_id, 'dinner') 
    RETURNING id INTO saturday_dinner_id;
    
    -- SUNDAY
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (sunday_id, 'breakfast') 
    RETURNING id INTO sunday_breakfast_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (sunday_id, 'lunch') 
    RETURNING id INTO sunday_lunch_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (sunday_id, 'snack') 
    RETURNING id INTO sunday_snack_id;
    
    INSERT INTO diet_meals (diet_day_id, meal_type) 
    VALUES (sunday_id, 'dinner') 
    RETURNING id INTO sunday_dinner_id;
    
    -- Step 6: Insert food items for each meal based on the spreadsheet
    
    -- MONDAY BREAKFAST (Oat 40g + Milk 100g, Banana, Blueberries)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (monday_breakfast_id, 'Oat with Milk', 195, 25, 6, 8, 4, 40, 'g'),
        (monday_breakfast_id, 'Banana', 105, 27, 14, 1, 0, 1, 'piece'),
        (monday_breakfast_id, 'Blueberries', 12, 3, 2, 0, 0, 15, 'g');
    
    -- MONDAY LUNCH (Chicken breast, Steamed vegetables, Whole wheat pasta)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (monday_lunch_id, 'Chicken breast', 225, 0, 0, 38, 4, 150, 'g'),
        (monday_lunch_id, 'Steamed vegetables', 60, 12, 6, 2, 0, 200, 'g'),
        (monday_lunch_id, 'Whole wheat pasta', 150, 30, 2, 5, 3, 80, 'g');
    
    -- MONDAY SNACK (Yogurt, Green tea)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (monday_snack_id, 'Yogurt', 96, 15, 10, 5, 2, 100, 'g'),
        (monday_snack_id, 'Green tea', 2, 0, 0, 0, 0, 1, 'cup');
    
    -- MONDAY DINNER (Salmon, Mixed vegetables, Whole grain bread)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (monday_dinner_id, 'Salmon', 450, 0, 0, 40, 28, 210, 'g'),
        (monday_dinner_id, 'Mixed vegetables', 60, 12, 6, 2, 0, 200, 'g'),
        (monday_dinner_id, 'Whole grain bread', 210, 40, 2, 6, 2, 80, 'g');
    
    -- TUESDAY BREAKFAST (Oat 40g + Milk 100g, Strawberries, Blueberries)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (tuesday_breakfast_id, 'Oat with Milk', 195, 25, 6, 8, 4, 40, 'g'),
        (tuesday_breakfast_id, 'Strawberries', 15, 3, 2, 0, 0, 50, 'g'),
        (tuesday_breakfast_id, 'Blueberries', 12, 3, 2, 0, 0, 15, 'g');
    
    -- TUESDAY LUNCH (Aloe drink, Fresh fruit, Pasta with sauce)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (tuesday_lunch_id, 'Aloe drink', 30, 7, 6, 0, 0, 1, 'cup'),
        (tuesday_lunch_id, 'Fresh fruit', 80, 20, 15, 1, 0, 160, 'g'),
        (tuesday_lunch_id, 'Pasta with sauce', 320, 60, 6, 10, 5, 80, 'g');
    
    -- TUESDAY SNACK (Smoked salmon bagel, Green tea)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (tuesday_snack_id, 'Smoked salmon bagel', 300, 35, 3, 12, 7, 1, 'piece'),
        (tuesday_snack_id, 'Green tea', 2, 0, 0, 0, 0, 1, 'cup');
    
    -- TUESDAY DINNER (Steak, Mixed vegetables, Potato)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (tuesday_dinner_id, 'Steak', 614, 0, 0, 55, 45, 220, 'g'),
        (tuesday_dinner_id, 'Mixed vegetables', 60, 12, 6, 2, 0, 200, 'g'),
        (tuesday_dinner_id, 'Potato', 240, 50, 2, 5, 0, 240, 'g');
    
    -- WEDNESDAY BREAKFAST (Oat 40g + Milk 100g, Strawberries, Blueberries)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (wednesday_breakfast_id, 'Oat with Milk', 195, 25, 6, 8, 4, 40, 'g'),
        (wednesday_breakfast_id, 'Strawberries', 15, 3, 2, 0, 0, 50, 'g'),
        (wednesday_breakfast_id, 'Blueberries', 12, 3, 2, 0, 0, 15, 'g');
    
    -- WEDNESDAY LUNCH (Tuna, Salad, Jacket potato)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (wednesday_lunch_id, 'Tuna', 300, 0, 0, 25, 4, 86, 'g'),
        (wednesday_lunch_id, 'Salad', 60, 10, 3, 2, 0, 80, 'g'),
        (wednesday_lunch_id, 'Jacket potato', 248, 35, 2, 3, 0, 260, 'g');
    
    -- WEDNESDAY SNACK (Yogurt, Green tea)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (wednesday_snack_id, 'Yogurt', 96, 15, 10, 5, 2, 100, 'g'),
        (wednesday_snack_id, 'Green tea', 2, 0, 0, 0, 0, 1, 'cup');
    
    -- WEDNESDAY DINNER (Fish bass, Mixed vegetables, Whole grain bread)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (wednesday_dinner_id, 'Fish bass', 348, 0, 0, 35, 18, 180, 'g'),
        (wednesday_dinner_id, 'Mixed vegetables', 60, 12, 6, 2, 0, 200, 'g'),
        (wednesday_dinner_id, 'Whole grain bread', 210, 40, 2, 6, 2, 80, 'g');
    
    -- THURSDAY BREAKFAST (Eggs, Fresh fruit)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (thursday_breakfast_id, 'Eggs', 200, 0, 0, 12, 14, 2, 'piece'),
        (thursday_breakfast_id, 'Fresh fruit', 80, 20, 15, 1, 0, 160, 'g');
    
    -- THURSDAY LUNCH (Chicken breast, Steamed vegetables, Whole wheat pasta)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (thursday_lunch_id, 'Chicken breast', 225, 0, 0, 38, 4, 150, 'g'),
        (thursday_lunch_id, 'Steamed vegetables', 60, 12, 6, 2, 0, 200, 'g'),
        (thursday_lunch_id, 'Whole wheat pasta', 150, 30, 2, 5, 3, 80, 'g');
    
    -- THURSDAY SNACK (Fresh fruit, Green tea)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (thursday_snack_id, 'Fresh fruit', 80, 20, 15, 1, 0, 160, 'g'),
        (thursday_snack_id, 'Green tea', 2, 0, 0, 0, 0, 1, 'cup');
    
    -- THURSDAY DINNER (Legumes, Mixed vegetables, Whole grain bread)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (thursday_dinner_id, 'Legumes', 700, 120, 2, 35, 3, 200, 'g'),
        (thursday_dinner_id, 'Mixed vegetables', 60, 12, 6, 2, 0, 200, 'g'),
        (thursday_dinner_id, 'Whole grain bread', 210, 40, 2, 6, 2, 80, 'g');
    
    -- FRIDAY BREAKFAST (Oat 40g + Milk 100g, Banana, Blueberries)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (friday_breakfast_id, 'Oat with Milk', 195, 25, 6, 8, 4, 40, 'g'),
        (friday_breakfast_id, 'Banana', 105, 27, 14, 1, 0, 1, 'piece'),
        (friday_breakfast_id, 'Blueberries', 12, 3, 2, 0, 0, 15, 'g');
    
    -- FRIDAY LUNCH (Salmon, Mixed vegetables, Whole grain bread)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (friday_lunch_id, 'Salmon', 450, 0, 0, 40, 28, 210, 'g'),
        (friday_lunch_id, 'Mixed vegetables', 60, 12, 6, 2, 0, 200, 'g'),
        (friday_lunch_id, 'Whole grain bread', 210, 40, 2, 6, 2, 80, 'g');
    
    -- FRIDAY SNACK (Yogurt, Green tea)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (friday_snack_id, 'Yogurt', 96, 15, 10, 5, 2, 100, 'g'),
        (friday_snack_id, 'Green tea', 2, 0, 0, 0, 0, 1, 'cup');
    
    -- FRIDAY DINNER (Mince beef, Mixed vegetables, Potato)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (friday_dinner_id, 'Mince beef 5% fat', 273, 0, 0, 40, 10, 200, 'g'),
        (friday_dinner_id, 'Mixed vegetables', 80, 16, 8, 3, 0, 200, 'g'),
        (friday_dinner_id, 'Potato', 240, 50, 2, 5, 0, 240, 'g');
    
    -- SATURDAY BREAKFAST (Eggs with extras)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (saturday_breakfast_id, 'Eggs with extras', 300, 5, 1, 20, 20, 1, 'portion');
    
    -- SATURDAY LUNCH (Pad Thai)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (saturday_lunch_id, 'Pad Thai', 838, 100, 10, 30, 25, 1, 'portion');
    
    -- SATURDAY SNACK (Fresh fruit)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (saturday_snack_id, 'Fresh fruit', 80, 20, 15, 1, 0, 160, 'g');
    
    -- SATURDAY DINNER (Pizza)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (saturday_dinner_id, 'Pizza', 1000, 120, 8, 40, 30, 1, 'portion');
    
    -- SUNDAY BREAKFAST (Eggs with extras)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (sunday_breakfast_id, 'Eggs with extras', 300, 5, 1, 20, 20, 1, 'portion');
    
    -- SUNDAY LUNCH (Sunday roast)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (sunday_lunch_id, 'Sunday roast', 1200, 100, 10, 60, 50, 1, 'portion');
    
    -- SUNDAY SNACK (Fresh fruit)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (sunday_snack_id, 'Fresh fruit', 80, 20, 15, 1, 0, 160, 'g');
    
    -- SUNDAY DINNER (Lasagna)
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (sunday_dinner_id, 'Lasagna', 750, 80, 10, 35, 30, 420, 'g');
    
    -- Add drinks for weekend
    INSERT INTO diet_food_items (diet_meal_id, food_name, calories, carbohydrates, sugars, protein, fat, quantity, unit)
    VALUES 
        (saturday_dinner_id, 'PUNK IPA', 480, 40, 0, 2, 0, 2, 'pint'),
        (sunday_lunch_id, 'Guinness', 420, 35, 0, 2, 0, 2, 'pint');
        
    RAISE NOTICE 'Teo''s Diet plan has been successfully updated to match the spreadsheet.';
END $$;
