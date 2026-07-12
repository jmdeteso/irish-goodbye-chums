-- Allow a party's host to delete any photo tied to their own party,
-- including guest-uploaded ones (user_id IS NULL), scoped by party
-- ownership rather than by who uploaded the row.
CREATE POLICY "Party owners can delete any photo in their party"
ON public.party_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.parties
    WHERE parties.id = party_photos.party_id
      AND parties.user_id = auth.uid()
  )
);
