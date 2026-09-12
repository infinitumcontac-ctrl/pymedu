-- ============================================
-- PymEdu - RESET COMPLETO de Supabase
-- ELIMINA todas las tablas, vistas, funciones,
-- disparadores, secuencias y datos del esquema public.
-- NO toca el esquema auth (gestionado por Supabase).
--
-- ⚠️  ¡IRREVERSIBLE! Ejecutar SOLO cuando se quiera
--     partir desde cero.
-- ============================================

-- 1. Eliminar el trigger que crea perfiles al registrar usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar todas las VISTAS del esquema public
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT viewname FROM pg_views WHERE schemaname = 'public'
  ) LOOP
    EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
  END LOOP;
END $$;

-- 3. Eliminar todas las TABLAS del esquema public
--    (CASCADE elimina también policies, triggers y sequences asociadas)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  ) LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;

-- 4. Eliminar SECUENCIAS restantes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  ) LOOP
    EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
  END LOOP;
END $$;

-- 5. Eliminar FUNCIONES del esquema public
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure AS proc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.proc || ' CASCADE';
  END LOOP;
END $$;

-- 6. Eliminar usuarios demo de PymEdu en Supabase Auth
--    (solo estos IDs; NO elimina usuarios reales registrados)
DELETE FROM auth.users
WHERE id IN (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',  -- supadmin@pymedu.com
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',  -- admin@colegiosanjose.cl
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',  -- coord@colegiosanjose.cl
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',  -- mentor@colegiosanjose.cl
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',  -- emprendedor@pymedu.com
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99'   -- demo@pymedu.com
);

-- 7. Verificar que el esquema public quedó limpio
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public')   AS tablas,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public')    AS vistas,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public') AS funciones;
