-- Script to create admin user marco@showyo.app
-- This needs to be executed in Supabase Dashboard SQL Editor

-- Step 1: Create the auth user (you'll need to do this via Supabase Dashboard UI)
-- Go to: Authentication > Users > Add User
-- Email: marco@showyo.app
-- Password: qazwsxQAZqaz#23
-- Or use the Supabase API/CLI

-- Step 2: After creating the auth user, get the user ID and run this:
-- Replace 'USER_ID_HERE' with the actual UUID from the auth.users table

-- First, let's check if user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'marco@showyo.app';

-- Then insert into users table with admin role
-- INSERT INTO users (id, email, display_name, roles)
-- VALUES ('USER_ID_HERE', 'marco@showyo.app', 'Marco', ARRAY['admin', 'user']::text[])
-- ON CONFLICT (id) DO UPDATE
-- SET roles = ARRAY['admin', 'user']::text[], display_name = 'Marco';
