-- 0000_layer3_schema.up.sql — forward-only Drizzle-managed migration (paired down required)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Replace Layer 2 sandbox tables when upgrading local databases.
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS dish_allergens CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS chefs CASCADE;
DROP TABLE IF EXISTS allergens CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

DROP TYPE IF EXISTS order_status CASCADE;

CREATE TYPE order_status AS ENUM (
  'draft',
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
  'disputed'
);

CREATE TYPE idempotency_scope AS ENUM ('order', 'payment');

CREATE TABLE allergens (
  id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT allergens_code_not_empty CHECK (length(trim(code)) > 0),
  CONSTRAINT allergens_code_unique UNIQUE (code)
);

COMMENT ON COLUMN allergens.code IS 'public:allergen stable code';
COMMENT ON COLUMN allergens.name IS 'public:allergen display name';

CREATE TABLE chefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chefs_slug_not_empty CHECK (length(trim(slug)) > 0),
  CONSTRAINT chefs_slug_unique UNIQUE (slug)
);

COMMENT ON COLUMN chefs.display_name IS 'public:chef display name';
COMMENT ON COLUMN chefs.owner_user_id IS 'internal:chef owner auth subject';
COMMENT ON COLUMN chefs.bio IS 'public:chef profile bio';

CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES chefs (id) ON DELETE RESTRICT,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT dishes_price_cents_positive CHECK (price_cents > 0),
  CONSTRAINT dishes_chef_slug_unique UNIQUE (chef_id, slug)
);

CREATE INDEX dishes_chef_id_idx ON dishes (chef_id);

COMMENT ON COLUMN dishes.name IS 'public:menu item title';
COMMENT ON COLUMN dishes.description IS 'public:menu item description';
COMMENT ON COLUMN dishes.price_cents IS 'public:unit price in integer cents';

CREATE TABLE dish_allergens (
  dish_id UUID NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
  allergen_id SMALLINT NOT NULL REFERENCES allergens (id) ON DELETE RESTRICT,
  PRIMARY KEY (dish_id, allergen_id)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  email_encrypted TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT customers_auth_user_id_unique UNIQUE (auth_user_id)
);

CREATE INDEX customers_deleted_at_idx ON customers (deleted_at);

COMMENT ON COLUMN customers.email_encrypted IS 'sensitive:encrypted customer email (pgcrypto)';
COMMENT ON COLUMN customers.display_name IS 'pii:customer display name';
COMMENT ON COLUMN customers.auth_user_id IS 'internal:auth subject reference';

CREATE TABLE inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES dishes (id) ON DELETE RESTRICT,
  remaining_quantity INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_batches_remaining_gte_zero CHECK (remaining_quantity >= 0),
  CONSTRAINT inventory_batches_version_positive CHECK (version > 0)
);

CREATE INDEX inventory_batches_dish_id_idx ON inventory_batches (dish_id);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  chef_id UUID NOT NULL REFERENCES chefs (id) ON DELETE RESTRICT,
  status order_status NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT orders_subtotal_cents_gte_zero CHECK (subtotal_cents >= 0),
  CONSTRAINT orders_currency_lower CHECK (currency = lower(currency)),
  CONSTRAINT orders_order_number_unique UNIQUE (order_number)
);

CREATE INDEX orders_status_idx ON orders (status);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  dish_id UUID NOT NULL REFERENCES dishes (id) ON DELETE RESTRICT,
  inventory_batch_id UUID REFERENCES inventory_batches (id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_cents_positive CHECK (unit_price_cents > 0)
);

CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  scope idempotency_scope NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT idempotency_keys_key_not_empty CHECK (length(trim(key)) > 0)
);

CREATE INDEX idempotency_keys_expires_at_idx ON idempotency_keys (expires_at);

CREATE TABLE audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id TEXT,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id);

COMMENT ON COLUMN audit_log.ip_address IS 'pii:request source IP';
COMMENT ON COLUMN audit_log.before_state IS 'internal:entity snapshot before change';
COMMENT ON COLUMN audit_log.after_state IS 'internal:entity snapshot after change';

-- Sensitive column encryption helper (key supplied per-session by service_role only).
CREATE OR REPLACE FUNCTION encrypt_sensitive(plain TEXT, secret TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT encode(pgp_sym_encrypt(plain, secret), 'base64');
$$;

CREATE OR REPLACE FUNCTION decrypt_sensitive(cipher TEXT, secret TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT pgp_sym_decrypt(decode(cipher, 'base64'), secret);
$$;

REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;

CREATE TABLE drizzle_migrations (
  id SERIAL PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
