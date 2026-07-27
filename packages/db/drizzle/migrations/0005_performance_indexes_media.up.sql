-- Layer 7: performance indexes + media variants (no original camera uploads served)
CREATE INDEX IF NOT EXISTS dishes_deleted_at_idx ON dishes (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS dishes_browse_cursor_idx ON dishes (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS chefs_slug_active_idx ON chefs (slug) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS dish_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
  blurhash text NOT NULL DEFAULT '',
  cdn_base_url text NOT NULL,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  processing_status text NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS dish_media_dish_id_unique ON dish_media (dish_id);
CREATE INDEX IF NOT EXISTS dish_media_dish_id_idx ON dish_media (dish_id);
