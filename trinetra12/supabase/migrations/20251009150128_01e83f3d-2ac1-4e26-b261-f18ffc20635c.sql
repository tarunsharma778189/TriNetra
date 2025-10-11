-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  reward_points INTEGER DEFAULT 0,
  is_helper_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create safe_zones table for geofencing
CREATE TABLE public.safe_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create emergency_contacts table
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sos_logs table to track emergency alerts
CREATE TABLE public.sos_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'auto_geofence', 'timer_expired')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create helpers table for community network
CREATE TABLE public.helpers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  last_location_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create timer_checkins table
CREATE TABLE public.timer_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expected_checkin_time TIMESTAMP WITH TIME ZONE NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'triggered_sos')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_checkins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Safe zones policies
CREATE POLICY "Users can view their own safe zones"
  ON public.safe_zones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own safe zones"
  ON public.safe_zones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own safe zones"
  ON public.safe_zones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own safe zones"
  ON public.safe_zones FOR DELETE
  USING (auth.uid() = user_id);

-- Emergency contacts policies
CREATE POLICY "Users can view their own emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emergency contacts"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency contacts"
  ON public.emergency_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency contacts"
  ON public.emergency_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- SOS logs policies (users can only see their own, but helpers can see active ones nearby)
CREATE POLICY "Users can view their own SOS logs"
  ON public.sos_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SOS logs"
  ON public.sos_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOS logs"
  ON public.sos_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Helpers policies (available helpers are visible to authenticated users for emergency)
CREATE POLICY "Authenticated users can view available helpers"
  ON public.helpers FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_available = true);

CREATE POLICY "Users can manage their own helper status"
  ON public.helpers FOR ALL
  USING (auth.uid() = user_id);

-- Timer checkins policies
CREATE POLICY "Users can view their own timer checkins"
  ON public.timer_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timer checkins"
  ON public.timer_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer checkins"
  ON public.timer_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safe_zones_updated_at
  BEFORE UPDATE ON public.safe_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_safe_zones_user_id ON public.safe_zones(user_id);
CREATE INDEX idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX idx_sos_logs_user_id ON public.sos_logs(user_id);
CREATE INDEX idx_sos_logs_status ON public.sos_logs(status);
CREATE INDEX idx_helpers_user_id ON public.helpers(user_id);
CREATE INDEX idx_helpers_available ON public.helpers(is_available);
CREATE INDEX idx_timer_checkins_user_id ON public.timer_checkins(user_id);
CREATE INDEX idx_timer_checkins_status ON public.timer_checkins(status);