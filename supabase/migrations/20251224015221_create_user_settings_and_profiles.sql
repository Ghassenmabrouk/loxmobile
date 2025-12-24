/*
  # User Settings and Profiles System

  ## Overview
  Creates comprehensive user management system for the luxury car service app
  
  ## New Tables
  
  ### `user_profiles`
  - `id` (uuid, primary key) - User identifier
  - `email` (text) - User email address
  - `full_name` (text) - User's full name
  - `phone_number` (text) - Contact phone number
  - `avatar_url` (text) - Profile picture URL
  - `date_of_birth` (date) - User's birth date
  - `vip_status` (boolean) - VIP membership flag
  - `total_rides` (integer) - Count of completed rides
  - `rating` (numeric) - User rating (0-5)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `user_settings`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Reference to user_profiles
  - `push_notifications` (boolean) - Push notification preference
  - `email_notifications` (boolean) - Email notification preference
  - `sms_notifications` (boolean) - SMS notification preference
  - `ride_updates` (boolean) - Ride status updates
  - `promotional_offers` (boolean) - Marketing communications
  - `language` (text) - Preferred language
  - `currency` (text) - Preferred currency
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `saved_locations`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Reference to user_profiles
  - `label` (text) - Location label (Home, Work, etc.)
  - `address` (text) - Full address
  - `latitude` (numeric) - Coordinate latitude
  - `longitude` (numeric) - Coordinate longitude
  - `is_favorite` (boolean) - Favorite location flag
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone_number text DEFAULT '',
  avatar_url text DEFAULT '',
  date_of_birth date,
  vip_status boolean DEFAULT false,
  total_rides integer DEFAULT 0,
  rating numeric(3, 2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  push_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  ride_updates boolean DEFAULT true,
  promotional_offers boolean DEFAULT false,
  language text DEFAULT 'en',
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create saved_locations table
CREATE TABLE IF NOT EXISTS saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  address text NOT NULL,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid()::uuid);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid()::uuid);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::uuid)
  WITH CHECK (id = auth.uid()::uuid);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

-- RLS Policies for saved_locations
CREATE POLICY "Users can view own locations"
  ON saved_locations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own locations"
  ON saved_locations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own locations"
  ON saved_locations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete own locations"
  ON saved_locations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::uuid);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_favorite ON saved_locations(user_id, is_favorite);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_locations_updated_at BEFORE UPDATE ON saved_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();