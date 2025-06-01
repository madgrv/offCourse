-- Setup profiles table and admin role system

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the trigger already exists before creating it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;

-- Create function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result TEXT;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'User not found with email: ' || user_email;
    END IF;
    
    -- Check if profile exists, create if not
    INSERT INTO profiles (id, email, role)
    VALUES (user_id, user_email, 'admin')
    ON CONFLICT (id) 
    DO UPDATE SET role = 'admin', updated_at = NOW();
    
    RETURN 'User ' || user_email || ' is now an admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function before recreating with different return type
DROP FUNCTION IF EXISTS list_admins();

-- Create function to list all admins
CREATE FUNCTION list_admins()
RETURNS TABLE (user_id UUID, email VARCHAR(255), role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, u.email::VARCHAR(255), p.role
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to populate profiles for existing users
CREATE OR REPLACE FUNCTION populate_existing_profiles()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    users_added INT := 0;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        INSERT INTO profiles (id, email)
        VALUES (user_record.id, user_record.email)
        ON CONFLICT (id) DO NOTHING;
        
        users_added := users_added + 1;
    END LOOP;
    
    RETURN 'Added profiles for ' || users_added || ' existing users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to populate profiles for existing users
SELECT populate_existing_profiles();

-- Instructions:
-- To make a user an admin, run:
-- SELECT make_user_admin('your-email@example.com');
--
-- To list all admins, run:
-- SELECT * FROM list_admins();
