-- 0001_rls_roles_policies.down.sql

DROP POLICY IF EXISTS audit_log_service_insert ON audit_log;
DROP POLICY IF EXISTS audit_log_admin_select ON audit_log;
DROP POLICY IF EXISTS idempotency_service_role_all ON idempotency_keys;
DROP POLICY IF EXISTS order_items_admin_all ON order_items;
DROP POLICY IF EXISTS order_items_chef_select ON order_items;
DROP POLICY IF EXISTS order_items_authenticated_select ON order_items;
DROP POLICY IF EXISTS orders_admin_all ON orders;
DROP POLICY IF EXISTS orders_chef_select ON orders;
DROP POLICY IF EXISTS orders_authenticated_select_own ON orders;
DROP POLICY IF EXISTS inventory_batches_admin_select ON inventory_batches;
DROP POLICY IF EXISTS inventory_batches_chef_manage ON inventory_batches;
DROP POLICY IF EXISTS customers_admin_all ON customers;
DROP POLICY IF EXISTS customers_authenticated_select_own ON customers;
DROP POLICY IF EXISTS dish_allergens_admin_all ON dish_allergens;
DROP POLICY IF EXISTS dish_allergens_chef_manage ON dish_allergens;
DROP POLICY IF EXISTS dish_allergens_authenticated_select ON dish_allergens;
DROP POLICY IF EXISTS dish_allergens_anon_select ON dish_allergens;
DROP POLICY IF EXISTS dishes_admin_all ON dishes;
DROP POLICY IF EXISTS dishes_chef_manage ON dishes;
DROP POLICY IF EXISTS dishes_authenticated_select ON dishes;
DROP POLICY IF EXISTS dishes_anon_select ON dishes;
DROP POLICY IF EXISTS chefs_admin_all ON chefs;
DROP POLICY IF EXISTS chefs_chef_manage ON chefs;
DROP POLICY IF EXISTS chefs_authenticated_select ON chefs;
DROP POLICY IF EXISTS chefs_anon_select ON chefs;
DROP POLICY IF EXISTS allergens_admin_all ON allergens;
DROP POLICY IF EXISTS allergens_chef_select ON allergens;
DROP POLICY IF EXISTS allergens_authenticated_select ON allergens;
DROP POLICY IF EXISTS allergens_anon_select ON allergens;

ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE dish_allergens DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE chefs DISABLE ROW LEVEL SECURITY;
ALTER TABLE allergens DISABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS app_current_role();
DROP FUNCTION IF EXISTS app_current_user_id();

DROP ROLE IF EXISTS app_service_role;
DROP ROLE IF EXISTS app_admin;
DROP ROLE IF EXISTS app_chef;
DROP ROLE IF EXISTS app_authenticated;
DROP ROLE IF EXISTS app_anon;
