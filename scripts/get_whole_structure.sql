SELECT 
    dp.id AS diet_plan_id,
    dp.name AS diet_plan_name,
    dp.description AS diet_plan_description,
    dd.id AS diet_day_id,
    dd.day_of_week,
    dd.total_calories,
    dm.id AS diet_meal_id,
    dm.meal_type,
    dfi.id AS diet_food_item_id,
    dfi.food_name,
    dfi.calories,
    dfi.carbohydrates,
    dfi.sugars,
    dfi.protein,
    dfi.fat,
    dfi.quantity,
    dfi.unit,
    dfi.completed,
    m.id AS meal_id,
    m.user_id,
    m.date,
    m.completed AS meal_completed,
    m.created_at AS meal_created_at,
    m.description AS meal_description,
    m.meal_name,
    ump.id AS user_meal_progress_id,
    ump.completed_at
FROM 
    public.diet_plans dp
LEFT JOIN 
    public.diet_days dd ON dp.id = dd.diet_plan_id
LEFT JOIN 
    public.diet_meals dm ON dd.id = dm.diet_day_id
LEFT JOIN 
    public.diet_food_items dfi ON dm.id = dfi.diet_meal_id
LEFT JOIN 
    public.meals m ON m.id = dm.id
LEFT JOIN 
    public.user_meal_progress ump ON ump.meal_id = m.id;