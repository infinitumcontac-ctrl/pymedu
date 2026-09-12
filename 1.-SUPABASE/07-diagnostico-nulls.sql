-- ============================================
-- PymEdu - DIAGNÓSTICO: columnas con NULL en auth.users
-- Pegar en: Supabase Dashboard > SQL Editor > New Query
-- Ejecutar y copiar el resultado completo aquí
-- ============================================

-- 1. Columnas de auth.users que tienen valores NULL, con cuántas filas.
DO $$
DECLARE
  col record;
  cnt integer;
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users'
  LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM auth.users WHERE %I IS NULL', col.column_name) INTO cnt;
      IF cnt > 0 THEN
        RAISE NOTICE 'COLUMNA % TIENE % NULL', col.column_name, cnt;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'COLUMNA %: no se pudo consultar', col.column_name;
    END;
  END LOOP;
END $$;

-- 2. Listado real de usuarios con columnas clave
SELECT
  id,
  email,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_user_meta_data,
  raw_app_meta_data,
  last_sign_in_at
FROM auth.users
ORDER BY email;
