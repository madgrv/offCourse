-- SQL script to create meal_completions table and set up proper authorization
-- This will enable tracking meal and food item completion status

-- First, create the meal_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS meal_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add a unique constraint to prevent duplicate entries
    UNIQUE(user_id, diet_plan_id, day, meal_type)
);

-- Create the food_completions table to track individual food items
CREATE TABLE IF NOT EXISTS food_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    diet_food_item_id BIGINT NOT NULL REFERENCES diet_food_items(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add a unique constraint to prevent duplicate entries
    UNIQUE(user_id, diet_food_item_id)
);

-- Set up Row Level Security (RLS) policies for meal_completions
ALTER TABLE meal_completions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own meal completions
CREATE POLICY meal_completions_select_policy ON meal_completions
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own meal completions
CREATE POLICY meal_completions_insert_policy ON meal_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own meal completions
CREATE POLICY meal_completions_update_policy ON meal_completions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own meal completions
CREATE POLICY meal_completions_delete_policy ON meal_completions
    FOR DELETE USING (auth.uid() = user_id);

-- Set up Row Level Security (RLS) policies for food_completions
ALTER TABLE food_completions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own food completions
CREATE POLICY food_completions_select_policy ON food_completions
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own food completions
CREATE POLICY food_completions_insert_policy ON food_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own food completions
CREATE POLICY food_completions_update_policy ON food_completions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own food completions
CREATE POLICY food_completions_delete_policy ON food_completions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON food_completions TO authenticated;

-- Add completed column to diet_food_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'diet_food_items' AND column_name = 'completed'
    ) THEN
        ALTER TABLE diet_food_items ADD COLUMN completed BOOLEAN DEFAULT false;
    END IF;
END
$$;
