-- ============================================
-- PymEdu - Crear Usuarios Demo en Supabase Auth
-- Pegar DESPUÉS de la migración principal
-- ============================================

-- IMPORTANTE: Estos inserts crean usuarios en auth.users
-- y el trigger automático crea el perfil en perfiles.

-- SuperAdmin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  'authenticated', 'authenticated',
  'supadmin@pymedu.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  '{"full_name": "Super Admin PymEdu", "rol": "superadmin"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Admin Institucional
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
  'authenticated', 'authenticated',
  'admin@colegiosanjose.cl',
  crypt('demo123', gen_salt('bf')),
  now(),
  '{"full_name": "Admin Instituto San José", "rol": "admin_institucional"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Coordinador
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
  'authenticated', 'authenticated',
  'coord@colegiosanjose.cl',
  crypt('demo123', gen_salt('bf')),
  now(),
  '{"full_name": "María González - Coordinadora", "rol": "coordinador"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Mentor
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
  'authenticated', 'authenticated',
  'mentor@colegiosanjose.cl',
  crypt('demo123', gen_salt('bf')),
  now(),
  '{"full_name": "Carlos Ruiz - Mentor", "rol": "mentor"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Emprendedor
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
  'authenticated', 'authenticated',
  'emprendedor@pymedu.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  '{"full_name": "Pedro Martínez - Emprendedor", "rol": "emprendedor"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Asignar instituciones y jerarquía a los perfiles
-- (el trigger crea los perfiles sin institución)
-- ============================================
UPDATE perfiles SET 
  institucion_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  puede_ver_remuneraciones = true,
  puede_ver_caja = true,
  puede_ver_reportes = true,
  puede_crear_ventas = true,
  puede_crear_gastos = true,
  membresia_nivel = 'premium',
  segmento_negocio = 'A'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';

UPDATE perfiles SET
  institucion_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  reporta_a = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  puede_ver_remuneraciones = true,
  puede_ver_caja = true,
  puede_ver_reportes = true,
  puede_crear_ventas = true,
  puede_crear_gastos = true,
  membresia_nivel = 'premium',
  segmento_negocio = 'B',
  negocio_nombre = 'Instituto San José',
  negocio_rubro = 'Educación'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02';

UPDATE perfiles SET
  institucion_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  reporta_a = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
  puede_ver_reportes = true,
  membresia_nivel = 'pro',
  segmento_negocio = 'B',
  negocio_nombre = 'Instituto San José'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04';

UPDATE perfiles SET
  institucion_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  reporta_a = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
  membresia_nivel = 'pro',
  segmento_negocio = 'B',
  negocio_nombre = 'Instituto San José'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06';

UPDATE perfiles SET
  institucion_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  reporta_a = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
  puede_ver_remuneraciones = true,
  puede_ver_caja = true,
  puede_ver_reportes = true,
  puede_crear_ventas = true,
  puede_crear_gastos = true,
  membresia_nivel = 'premium',
  segmento_negocio = 'B',
  negocio_nombre = 'Pyme Demo Chile',
  negocio_rut = '76.123.456-7',
  negocio_rubro = 'Comercio'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09';

-- ============================================
-- Demo (acceso a todos los roles)
-- ============================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
  'authenticated', 'authenticated',
  'demo@pymedu.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  '{"full_name": "Usuario Demo - Acceso Completo", "rol": "demo"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

UPDATE perfiles SET
  institucion_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  puede_ver_remuneraciones = true,
  puede_ver_caja = true,
  puede_ver_reportes = true,
  puede_crear_ventas = true,
  puede_crear_gastos = true,
  membresia_nivel = 'premium',
  segmento_negocio = 'A',
  negocio_nombre = 'Demo PymEdu',
  negocio_rubro = 'Tecnología'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';