
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Friends table
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own friends" ON public.friends FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Parties table
CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  share_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own parties" ON public.parties FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Allow anyone to read party by share_code (for check-in page)
CREATE POLICY "Anyone can view party by share code" ON public.parties FOR SELECT USING (true);

-- Party check-ins table
CREATE TABLE public.party_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(party_id, friend_id)
);
ALTER TABLE public.party_checkins ENABLE ROW LEVEL SECURITY;

-- Owner can read/delete check-ins
CREATE POLICY "Party owner can view checkins" ON public.party_checkins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.parties WHERE parties.id = party_checkins.party_id AND parties.user_id = auth.uid()));
CREATE POLICY "Party owner can delete checkins" ON public.party_checkins FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.parties WHERE parties.id = party_checkins.party_id AND parties.user_id = auth.uid()));

-- Anyone can check in (friends are unauthenticated)
CREATE POLICY "Anyone can check in to a party" ON public.party_checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parties p
      JOIN public.friends f ON f.user_id = p.user_id
      WHERE p.id = party_checkins.party_id
        AND f.id = party_checkins.friend_id
        AND p.is_active = true
    )
  );

-- Allow anon to read checkins for a party (so check-in page can show who's checked in)
CREATE POLICY "Anyone can view checkins for active parties" ON public.party_checkins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.parties WHERE parties.id = party_checkins.party_id AND parties.is_active = true));

-- Allow anon to read friends for active parties (so check-in page shows friend names)
CREATE POLICY "Anyone can view friends for active parties" ON public.friends FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.parties WHERE parties.user_id = friends.user_id AND parties.is_active = true
  ));
