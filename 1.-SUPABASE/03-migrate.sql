-- ============================================
-- PymEdu - Script de Migración
-- Migrar usuarios existentes de Supabase
-- ============================================

-- Este script migra los usuarios de la estructura anterior
-- a la nueva estructura jerárquica.

-- ============================================
-- 1. CREAR TABLA TEMPORAL CON DATOS EXISTENTES
-- ============================================
CREATE TEMPORARY TABLE temp_usuarios AS
SELECT 
  id,
  email,
  nombre_completo,
  rol,
  membresia_nivel,
  segmento_negocio,
  acceso_revocado_at,
  negocio_nombre,
  negocio_rut,
  negocio_rubro,
  negocio_giro,
  negocio_actividad,
  negocio_region,
  negocio_comuna,
  negocio_direccion,
  logo_url,
  avatar_url,
  puede_ver_remuneraciones,
  puede_ver_caja,
  puede_ver_reportes,
  puede_crear_ventas,
  puede_crear_gastos,
  notif_email,
  notif_push,
  push_token,
  created_at,
  updated_at
FROM perfiles;

-- ============================================
-- 2. LIMPIAR TABLA PERFILES
-- ============================================
TRUNCATE TABLE perfiles CASCADE;

-- ============================================
-- 3. INSERTAR USUARIOS CON NUEVA ESTRUCTURA
-- ============================================
-- Los passwords se hashean con el formato nuevo
-- Por defecto se usa "demo123" para todos

INSERT INTO perfiles (
  id, email, password_hash, nombre_completo, rol,
  institucion_id, reporta_a,
  puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes,
  puede_crear_ventas, puede_crear_gastos,
  membresia_nivel, segmento_negocio,
  negocio_nombre, negocio_rut, negocio_rubro, negocio_giro,
  negocio_actividad, negocio_region, negocio_comuna, negocio_direccion,
  logo_url, avatar_url,
  notif_email, notif_push, push_token,
  acceso_revocado_at, created_at, updated_at
)
SELECT 
  id, email, 
  crypt('demo123', gen_salt('bf')) as password_hash,
  nombre_completo, rol,
  NULL as institucion_id,
  NULL as reporta_a,
  puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes,
  puede_crear_ventas, puede_crear_gastos,
  membresia_nivel, segmento_negocio,
  negocio_nombre, negocio_rut, negocio_rubro, negocio_giro,
  negocio_actividad, negocio_region, negocio_comuna, negocio_direccion,
  logo_url, avatar_url,
  notif_email, notif_push, push_token,
  acceso_revocado_at, created_at, updated_at
FROM temp_usuarios;

-- ============================================
-- 4. ASIGNAR INSTITUCIONES Y JERARQUÍA
-- ============================================
-- Esto debe hacerse manualmente o con un script específico
-- según la estructura de cada organización.

-- Ejemplo: Asignar admin_institucional a su institución
-- UPDATE perfiles 
-- SET institucion_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
-- WHERE rol = 'admin_institucional' AND email = 'admin@colegiosanjose.cl';

-- Ejemplo: Asignar reporta_a para coordinadores
-- UPDATE perfiles coord
-- SET reporta_a = (
--   SELECT id FROM perfiles 
--   WHERE rol = 'admin_institucional' 
--   AND institucion_id = coord.institucion_id
--   LIMIT 1
-- )
-- WHERE rol = 'coordinador';

-- ============================================
-- 5. LIMPIAR TABLA TEMPORAL
-- ============================================
DROP TABLE IF EXISTS temp_usuarios;

-- ============================================
-- 6. VERIFICAR MIGRACIÓN
-- ============================================
SELECT 
  rol,
  COUNT(*) as cantidad,
  COUNT(CASE WHEN institucion_id IS NOT NULL THEN 1 END) as con_institucion,
  COUNT(CASE WHEN reporta_a IS NOT NULL THEN 1 END) as con_jefe
FROM perfiles
GROUP BY rol
ORDER BY 
  CASE rol
    WHEN 'superadmin' THEN 1
    WHEN 'admin_institucional' THEN 2
    WHEN 'coordinador' THEN 3
    WHEN 'mentor' THEN 4
    WHEN 'emprendedor' THEN 5
    ELSE 6
  END;