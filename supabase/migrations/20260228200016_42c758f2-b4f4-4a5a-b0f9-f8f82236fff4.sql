
-- Make user_id nullable so attendee uploads (no auth) can work
ALTER TABLE public.party_photos ALTER COLUMN user_id DROP NOT NULL;

-- Add friend_id column for attendee-uploaded photos
ALTER TABLE public.party_photos ADD COLUMN friend_id uuid REFERENCES public.friends(id);

-- Allow anyone to insert photos for active parties (attendee uploads)
CREATE POLICY "Anyone can upload photos to active parties"
ON public.party_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parties
    WHERE parties.id = party_photos.party_id
    AND parties.is_active = true
  )
);

-- Allow anyone to view photos for active parties (already have a SELECT policy but it's restrictive)
-- The existing "Anyone can view party photos metadata" policy already covers this.
