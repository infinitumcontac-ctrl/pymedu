-- ============================================
-- PymEdu - Reparar auth.users (NULL -> '')
-- Corrige el error: "500: Database error querying schema"
-- Pegar en: Supabase Dashboard > SQL Editor > New Query
--
-- GoTrue espera string vacío '' (no NULL) en columnas como
-- confirmation_token, recovery_token, email_change, etc.
-- Se actualizan SOLO columnas de texto que NO estén en una
-- restricción única (como email o phone), para no violar
-- los constraints.
-- ============================================

-- 1. Columnas de texto que NO forman parte de una clave única
DO $$
DECLARE
  col record;
  cnt integer;
BEGIN
  FOR col IN
    SELECT c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'auth'
      AND c.table_name = 'users'
      AND c.data_type IN ('text', 'character varying', 'character')
      AND NOT EXISTS (
        -- columnas que pertenecen a un índice único
        SELECT 1
        FROM pg_index i
        JOIN pg_attribute a
          ON a.attrelid = i.indrelid
         AND a.attnum = ANY(i.indkey)
        JOIN information_schema.columns ic
          ON ic.column_name = a.attname
         AND ic.table_schema = c.table_schema
         AND ic.table_name = c.table_name
        WHERE i.indrelid = 'auth.users'::regclass
          AND i.indisunique
          AND ic.column_name = c.column_name
      )
  LOOP
    EXECUTE format(
      'UPDATE auth.users SET %I = '''' WHERE %I IS NULL',
      col.column_name, col.column_name
    );
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN
      RAISE NOTICE 'Columna % actualizada: % filas', col.column_name, cnt;
    END IF;
  END LOOP;
END $$;

-- 2. Verificación final (no debería quedar ningún NULL de texto)
DO $$
DECLARE
  col record;
  cnt integer;
BEGIN
  FOR col IN
    SELECT c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'auth'
      AND c.table_name = 'users'
      AND c.data_type IN ('text', 'character varying', 'character')
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM auth.users WHERE %I IS NULL',
      col.column_name
    ) INTO cnt;
    IF cnt > 0 THEN
      RAISE NOTICE 'PENDIENTE: % tiene % NULL', col.column_name, cnt;
    END IF;
  END LOOP;
  RAISE NOTICE 'Verificación completada.';
END $$;
