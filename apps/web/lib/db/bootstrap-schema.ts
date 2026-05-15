/**
 * Idempotent DDL for Golf Tracker preferences (run via DATABASE_URL in instrumentation).
 * RLS: authenticated users only see/update their own row.
 */
export const BOOTSTRAP_DDL = `
CREATE TABLE IF NOT EXISTS public.golf_tracker_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  followed_pairing_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  starred_player_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  pairing_pick_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  parlays jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS golf_tracker_preferences_updated_at_idx
  ON public.golf_tracker_preferences (updated_at DESC);

ALTER TABLE public.golf_tracker_preferences ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.golf_tracker_preferences TO authenticated;
GRANT ALL ON public.golf_tracker_preferences TO service_role;

DROP POLICY IF EXISTS "golf_tracker_preferences_select_own" ON public.golf_tracker_preferences;
DROP POLICY IF EXISTS "golf_tracker_preferences_insert_own" ON public.golf_tracker_preferences;
DROP POLICY IF EXISTS "golf_tracker_preferences_update_own" ON public.golf_tracker_preferences;
DROP POLICY IF EXISTS "golf_tracker_preferences_delete_own" ON public.golf_tracker_preferences;

CREATE POLICY "golf_tracker_preferences_select_own"
  ON public.golf_tracker_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "golf_tracker_preferences_insert_own"
  ON public.golf_tracker_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "golf_tracker_preferences_update_own"
  ON public.golf_tracker_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "golf_tracker_preferences_delete_own"
  ON public.golf_tracker_preferences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
`
