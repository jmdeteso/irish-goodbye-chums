-- Fix cross-tenant data exposure: replace blanket "anyone can view" policies
-- with a scoped RPC that only returns data for the ONE party matching a
-- given share_code, instead of exposing all active parties'/friends' rows
-- to any anon or authenticated caller via direct table SELECT.

DROP POLICY IF EXISTS "Anyone can view party by share code" ON public.parties;
DROP POLICY IF EXISTS "Anyone can view friends for active parties" ON public.friends;
DROP POLICY IF EXISTS "Anyone can view checkins for active parties" ON public.party_checkins;
DROP POLICY IF EXISTS "Anyone can view party photos metadata" ON public.party_photos;

-- RPC: returns everything the public check-in page needs for ONE party,
-- looked up by its secret share_code. SECURITY DEFINER lets it read across
-- RLS internally, but it only ever returns rows tied to the single party
-- matching p_share_code (and only if that party is_active) -- never phone
-- numbers, never other parties' data.
CREATE OR REPLACE FUNCTION public.get_checkin_page_data(p_share_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party public.parties%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_party
  FROM public.parties
  WHERE share_code = p_share_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'party', jsonb_build_object('id', v_party.id, 'name', v_party.name, 'user_id', v_party.user_id),
    'friends', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', f.id, 'name', f.name) ORDER BY f.name)
      FROM public.friends f
      WHERE f.user_id = v_party.user_id
    ), '[]'::jsonb),
    'checkins', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('friend_id', c.friend_id))
      FROM public.party_checkins c
      WHERE c.party_id = v_party.id
    ), '[]'::jsonb),
    'photos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', p.id, 'storage_path', p.storage_path) ORDER BY p.created_at DESC)
      FROM public.party_photos p
      WHERE p.party_id = v_party.id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_checkin_page_data(text) TO anon, authenticated;

-- Allow anonymous attendees to upload photos into an active party's own
-- folder (path convention "<party_id>/<file>"), instead of requiring
-- auth.uid() IS NOT NULL which silently 403'd every guest upload.
CREATE POLICY "Anyone can upload photos for active parties"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'party-photos'
  AND EXISTS (
    SELECT 1 FROM public.parties
    WHERE parties.id::text = (storage.foldername(name))[1]
      AND parties.is_active = true
  )
);

-- Narrow update/delete so a host can only touch photos inside their own
-- parties' folders, not any authenticated user's photos.
DROP POLICY IF EXISTS "Users can update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;

CREATE POLICY "Party owners can update their party's photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'party-photos'
  AND EXISTS (
    SELECT 1 FROM public.parties
    WHERE parties.id::text = (storage.foldername(name))[1]
      AND parties.user_id = auth.uid()
  )
);

CREATE POLICY "Party owners can delete their party's photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'party-photos'
  AND EXISTS (
    SELECT 1 FROM public.parties
    WHERE parties.id::text = (storage.foldername(name))[1]
      AND parties.user_id = auth.uid()
  )
);
