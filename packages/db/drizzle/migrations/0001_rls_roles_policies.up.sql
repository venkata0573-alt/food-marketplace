-- 0001_rls_roles_policies.up.sql

CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION app_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.role', true), '');
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_anon') THEN
    CREATE ROLE app_anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_authenticated') THEN
    CREATE ROLE app_authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_chef') THEN
    CREATE ROLE app_chef NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_service_role') THEN
    CREATE ROLE app_service_role NOLOGIN BYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_anon, app_authenticated, app_chef, app_admin, app_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_service_role;

ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens FORCE ROW LEVEL SECURITY;
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chefs FORCE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes FORCE ROW LEVEL SECURITY;
ALTER TABLE dish_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_allergens FORCE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches FORCE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

-- allergens
CREATE POLICY allergens_anon_select ON allergens FOR SELECT TO app_anon USING (true);
CREATE POLICY allergens_authenticated_select ON allergens FOR SELECT TO app_authenticated USING (true);
CREATE POLICY allergens_chef_select ON allergens FOR SELECT TO app_chef USING (true);
CREATE POLICY allergens_admin_all ON allergens FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- chefs (public catalog)
CREATE POLICY chefs_anon_select ON chefs FOR SELECT TO app_anon
  USING (deleted_at IS NULL);
CREATE POLICY chefs_authenticated_select ON chefs FOR SELECT TO app_authenticated
  USING (deleted_at IS NULL);
CREATE POLICY chefs_chef_manage ON chefs FOR ALL TO app_chef
  USING (owner_user_id = app_current_user_id() AND deleted_at IS NULL)
  WITH CHECK (owner_user_id = app_current_user_id());
CREATE POLICY chefs_admin_all ON chefs FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- dishes
CREATE POLICY dishes_anon_select ON dishes FOR SELECT TO app_anon
  USING (deleted_at IS NULL);
CREATE POLICY dishes_authenticated_select ON dishes FOR SELECT TO app_authenticated
  USING (deleted_at IS NULL);
CREATE POLICY dishes_chef_manage ON dishes FOR ALL TO app_chef
  USING (
    deleted_at IS NULL
    AND chef_id IN (SELECT id FROM chefs WHERE owner_user_id = app_current_user_id())
  )
  WITH CHECK (
    chef_id IN (SELECT id FROM chefs WHERE owner_user_id = app_current_user_id())
  );
CREATE POLICY dishes_admin_all ON dishes FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- dish_allergens (follow dish visibility)
CREATE POLICY dish_allergens_anon_select ON dish_allergens FOR SELECT TO app_anon
  USING (EXISTS (SELECT 1 FROM dishes d WHERE d.id = dish_id AND d.deleted_at IS NULL));
CREATE POLICY dish_allergens_authenticated_select ON dish_allergens FOR SELECT TO app_authenticated
  USING (EXISTS (SELECT 1 FROM dishes d WHERE d.id = dish_id AND d.deleted_at IS NULL));
CREATE POLICY dish_allergens_chef_manage ON dish_allergens FOR ALL TO app_chef
  USING (
    EXISTS (
      SELECT 1
      FROM dishes d
      JOIN chefs c ON c.id = d.chef_id
      WHERE d.id = dish_id AND c.owner_user_id = app_current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM dishes d
      JOIN chefs c ON c.id = d.chef_id
      WHERE d.id = dish_id AND c.owner_user_id = app_current_user_id()
    )
  );
CREATE POLICY dish_allergens_admin_all ON dish_allergens FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- customers
CREATE POLICY customers_authenticated_select_own ON customers FOR SELECT TO app_authenticated
  USING (auth_user_id = app_current_user_id() AND deleted_at IS NULL);
CREATE POLICY customers_admin_all ON customers FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- inventory_batches
CREATE POLICY inventory_batches_chef_manage ON inventory_batches FOR ALL TO app_chef
  USING (
    EXISTS (
      SELECT 1
      FROM dishes d
      JOIN chefs c ON c.id = d.chef_id
      WHERE d.id = dish_id AND c.owner_user_id = app_current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM dishes d
      JOIN chefs c ON c.id = d.chef_id
      WHERE d.id = dish_id AND c.owner_user_id = app_current_user_id()
    )
  );
CREATE POLICY inventory_batches_admin_select ON inventory_batches FOR SELECT TO app_admin USING (true);

-- orders
CREATE POLICY orders_authenticated_select_own ON orders FOR SELECT TO app_authenticated
  USING (
    deleted_at IS NULL
    AND customer_id IN (SELECT id FROM customers WHERE auth_user_id = app_current_user_id())
  );
CREATE POLICY orders_chef_select ON orders FOR SELECT TO app_chef
  USING (
    deleted_at IS NULL
    AND chef_id IN (SELECT id FROM chefs WHERE owner_user_id = app_current_user_id())
  );
CREATE POLICY orders_admin_all ON orders FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- order_items (readable when parent order is readable — enforced via security barrier views pattern simplified)
CREATE POLICY order_items_authenticated_select ON order_items FOR SELECT TO app_authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN customers cu ON cu.id = o.customer_id
      WHERE o.id = order_id
        AND cu.auth_user_id = app_current_user_id()
        AND o.deleted_at IS NULL
    )
  );
CREATE POLICY order_items_chef_select ON order_items FOR SELECT TO app_chef
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN chefs c ON c.id = o.chef_id
      WHERE o.id = order_id
        AND c.owner_user_id = app_current_user_id()
        AND o.deleted_at IS NULL
    )
  );
CREATE POLICY order_items_admin_all ON order_items FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- idempotency_keys: service_role only (default deny for app roles)
CREATE POLICY idempotency_service_role_all ON idempotency_keys FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);

-- audit_log: admin read-only; inserts via service_role
CREATE POLICY audit_log_admin_select ON audit_log FOR SELECT TO app_admin USING (true);
CREATE POLICY audit_log_service_insert ON audit_log FOR INSERT TO app_service_role WITH CHECK (true);

GRANT SELECT ON allergens TO app_anon, app_authenticated, app_chef, app_admin;
GRANT SELECT ON chefs TO app_anon, app_authenticated, app_chef, app_admin;
GRANT SELECT ON dishes TO app_anon, app_authenticated, app_chef, app_admin;
GRANT SELECT ON dish_allergens TO app_anon, app_authenticated, app_chef, app_admin;
GRANT SELECT ON customers TO app_authenticated, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON chefs, dishes, dish_allergens, inventory_batches TO app_chef;
GRANT SELECT ON orders, order_items TO app_authenticated, app_chef, app_admin;
GRANT SELECT ON inventory_batches TO app_admin;
GRANT SELECT ON audit_log TO app_admin;

GRANT app_anon TO postgres;
GRANT app_authenticated TO postgres;
GRANT app_chef TO postgres;
GRANT app_admin TO postgres;
GRANT app_service_role TO postgres;
