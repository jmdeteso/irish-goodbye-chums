
-- Storage bucket for party photos
INSERT INTO storage.buckets (id, name, public) VALUES ('party-photos', 'party-photos', true);

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload party photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'party-photos' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their photos
CREATE POLICY "Users can update their photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'party-photos' AND auth.uid() IS NOT NULL);

-- Allow anyone to view party photos (public sharing)
CREATE POLICY "Anyone can view party photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'party-photos');

-- Allow authenticated users to delete their photos
CREATE POLICY "Users can delete their photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'party-photos' AND auth.uid() IS NOT NULL);

-- Table to track photos per party
CREATE TABLE public.party_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.party_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party owner can manage photos"
ON public.party_photos FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anyone to view photos for active parties (for sharing)
CREATE POLICY "Anyone can view party photos metadata"
ON public.party_photos FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.parties WHERE parties.id = party_photos.party_id AND parties.is_active = true
));
