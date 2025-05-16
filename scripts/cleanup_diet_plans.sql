-- SQL script to clean up diet plans and ensure only one correct "Teo's Diet" plan exists
-- for user ID: b4364efc-bef8-433e-8ba1-82bf91f3fcf8

DO $$
DECLARE
    user_id UUID := 'b4364efc-bef8-433e-8ba1-82bf91f3fcf8';
    main_plan_id UUID := 'a0eff679-eb84-482d-bf4f-a920ecd45df7'; -- The plan we just fixed
    plan_count INTEGER;
    plan_names TEXT[];
BEGIN
    -- First, check how many diet plans exist
    SELECT COUNT(*), ARRAY_AGG(name) INTO plan_count, plan_names
    FROM diet_plans
    WHERE name = 'Teo''s Diet';
    
    RAISE NOTICE 'Found % "Teo''s Diet" plans: %', plan_count, plan_names;
    
    -- 1. Update the ownership of our main plan to the correct user
    UPDATE diet_plans
    SET 
        owner_id = user_id,
        is_template = false
    WHERE 
        id = main_plan_id;
    
    RAISE NOTICE 'Updated ownership of main plan (ID: %) to user ID: %', main_plan_id, user_id;
    
    -- 2. Delete all other "Teo's Diet" plans EXCEPT our main one
    -- First, we need to delete associated food items and meals to avoid foreign key constraints
    
    -- Delete food items for other plans
    DELETE FROM diet_food_items
    WHERE diet_meal_id IN (
        SELECT dm.id
        FROM diet_meals dm
        JOIN diet_days dd ON dm.diet_day_id = dd.id
        JOIN diet_plans dp ON dd.diet_plan_id = dp.id
        WHERE dp.name = 'Teo''s Diet' AND dp.id != main_plan_id
    );
    
    RAISE NOTICE 'Deleted food items from duplicate plans';
    
    -- Delete meals for other plans
    DELETE FROM diet_meals
    WHERE diet_day_id IN (
        SELECT dd.id
        FROM diet_days dd
        JOIN diet_plans dp ON dd.diet_plan_id = dp.id
        WHERE dp.name = 'Teo''s Diet' AND dp.id != main_plan_id
    );
    
    RAISE NOTICE 'Deleted meals from duplicate plans';
    
    -- Delete days for other plans
    DELETE FROM diet_days
    WHERE diet_plan_id IN (
        SELECT id FROM diet_plans 
        WHERE name = 'Teo''s Diet' AND id != main_plan_id
    );
    
    RAISE NOTICE 'Deleted days from duplicate plans';
    
    -- Finally, delete the duplicate plans themselves
    DELETE FROM diet_plans
    WHERE name = 'Teo''s Diet' AND id != main_plan_id;
    
    RAISE NOTICE 'Deleted duplicate "Teo''s Diet" plans';
    
    -- 3. Verify the cleanup
    SELECT COUNT(*) INTO plan_count
    FROM diet_plans
    WHERE name = 'Teo''s Diet';
    
    RAISE NOTICE 'After cleanup: % "Teo''s Diet" plan(s) remain', plan_count;
    
    -- 4. Verify the plan is associated with the correct user
    SELECT COUNT(*) INTO plan_count
    FROM diet_plans
    WHERE name = 'Teo''s Diet' AND owner_id = user_id AND is_template = false;
    
    RAISE NOTICE 'Plans owned by user % and not marked as template: %', user_id, plan_count;
    
    -- 5. If needed, rename the plan to make it clearer
    UPDATE diet_plans
    SET name = 'Teo''s Diet Plan'
    WHERE id = main_plan_id;
    
    RAISE NOTICE 'Renamed plan to "Teo''s Diet Plan" for clarity';
    
    RAISE NOTICE 'Cleanup complete. The plan should now be visible in the UI.';
END $$;
