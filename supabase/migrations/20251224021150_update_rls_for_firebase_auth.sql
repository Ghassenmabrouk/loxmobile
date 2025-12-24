/*
  # Update RLS Policies for Firebase Auth Integration
  
  ## Changes
  - Modify RLS policies to work with Firebase Auth (not Supabase Auth)
  - Allow anon role access since auth is handled by Firebase
  - Application-level authorization enforced in code
  
  ## Security Notes
  - RLS policies updated to allow anon access
  - Authorization checked at application layer using Firebase Auth
  - User IDs from Firebase Auth used to filter data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can update own locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can delete own locations" ON saved_locations;

-- Create new policies that allow anon access
-- (Authorization is handled at application level with Firebase Auth)

-- user_profiles policies
CREATE POLICY "Allow anon select on user_profiles"
  ON user_profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on user_profiles"
  ON user_profiles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on user_profiles"
  ON user_profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- user_settings policies
CREATE POLICY "Allow anon select on user_settings"
  ON user_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on user_settings"
  ON user_settings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on user_settings"
  ON user_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- saved_locations policies
CREATE POLICY "Allow anon select on saved_locations"
  ON saved_locations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on saved_locations"
  ON saved_locations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on saved_locations"
  ON saved_locations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on saved_locations"
  ON saved_locations FOR DELETE
  TO anon
  USING (true);
