-- ============================================
-- PymEdu - Datos de Prueba (Seed)
-- Estructura jerárquica completa
-- ============================================

-- ============================================
-- 1. INSTITUCIONES
-- ============================================
INSERT INTO instituciones (id, nombre, rut, rubro, region, comuna) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Instituto San José', '76.123.456-7', 'Educación', 'Metropolitana', 'Santiago'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Incubadora Innova', '76.234.567-8', 'Tecnología', 'Metropolitana', 'Providencia'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Universidad Católica', '76.345.678-9', 'Educación', 'Metropolitana', 'Ñuñoa');

-- ============================================
-- 2. USUARIOS (con passwords hasheados)
-- Password por defecto: "demo123"
-- ============================================

-- SuperAdmin (no pertenece a ninguna institución)
INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a, 
  puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes, puede_crear_ventas, puede_crear_gastos,
  membresia_nivel, segmento_negocio) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'supadmin@pymedu.com', 
   crypt('demo123', gen_salt('bf')), 'Super Admin PymEdu', 'superadmin', NULL, NULL,
   true, true, true, true, true, 'premium', 'A');

-- Admin Institucional 1 - Instituto San José
INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a,
  puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes, puede_crear_ventas, puede_crear_gastos,
  negocio_nombre, membresia_nivel, segmento_negocio) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'admin@colegiosanjose.cl',
   crypt('demo123', gen_salt('bf')), 'Admin Instituto San José', 'admin_institucional', 
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   true, true, true, true, true, 'Instituto San José', 'premium', 'B');

-- Admin Institucional 2 - Incubadora Innova
INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a,
  puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes, puede_crear_ventas, puede_crear_gastos,
  negocio_nombre, membresia_nivel, segmento_negocio) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'admin@innova.cl',
   crypt('demo123', gen_salt('bf')), 'Admin Incubadora Innova', 'admin_institucional',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   true, true, true, true, true, 'Incubadora Innova', 'premium', 'B');

-- Coordinadores
INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a,
  puede_ver_reportes, membresia_nivel, segmento_negocio) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'coord@colegiosanjose.cl',
   crypt('demo123', gen_salt('bf')), 'María González - Coordinadora', 'coordinador',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   true, 'pro', 'B'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'coord2@colegiosanjose.cl',
   crypt('demo123', gen_salt('bf')), 'Pedro Álvarez - Coordinador', 'coordinador',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
   true, 'pro', 'B');

-- Mentores
INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a,
  membresia_nivel, segmento_negocio) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'mentor@colegiosanjose.cl',
   crypt('demo123', gen_salt('bf')), 'Carlos Ruiz - Mentor', 'mentor',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'pro', 'B'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'mentor2@colegiosanjose.cl',
   crypt('demo123', gen_salt('bf')), 'Ana Martínez - Mentor', 'mentor',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
   'pro', 'B'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'mentor3@colegiosanjose.cl',
   crypt('demo123', gen_salt('bf')), 'Luis Torres - Mentor', 'mentor',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
   'pro', 'B');

-- Emprendedores
INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a,
  puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes, puede_crear_ventas, puede_crear_gastos,
  negocio_nombre, negocio_rut, negocio_rubro, membresia_nivel, segmento_negocio) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'emprendedor@pymedu.com',
   crypt('demo123', gen_salt('bf')), 'Pedro Martínez - Emprendedor', 'emprendedor',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
   true, true, true, true, true, 'Pyme Demo Chile', '76.123.456-7', 'Comercio', 'premium', 'B'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'emprendedor2@pymedu.com',
   crypt('demo123', gen_salt('bf')), 'Laura Díaz - Emprendedora', 'emprendedor',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
   false, false, true, true, false, 'Artesanías Laura', '76.234.567-8', 'Artesanías', 'pro', 'C'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'emprendedor3@pymedu.com',
   crypt('demo123', gen_salt('bf')), 'Roberto Sánchez - Emprendedor', 'emprendedor',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
   true, true, true, true, true, 'Tech Solutions', '76.345.678-9', 'Tecnología', 'premium', 'A');

-- Demo (acceso completo a todos los roles)
INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a,
  puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes, puede_crear_ventas, puede_crear_gastos,
  negocio_nombre, membresia_nivel, segmento_negocio) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'demo@pymedu.com',
   crypt('demo123', gen_salt('bf')), 'Usuario Demo - Acceso Completo', 'demo',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
   true, true, true, true, true, 'Demo PymEdu', 'premium', 'A');

-- ============================================
-- 3. PROGRAMAS
-- ============================================
INSERT INTO programas (id, institucion_id, nombre, descripcion) VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
   'Emprendimiento Juvenil', 'Programa de apoyo a jóvenes emprendedores'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
   'Sostenibilidad Local', 'Emprendimientos sustentables'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 
   'Innovación Digital', 'Transformación digital para PYMES');

-- ============================================
-- 4. RELACIONES USUARIO-PROGRAMA
-- ============================================
INSERT INTO usuario_programas (usuario_id, programa_id, rol_en_programa) VALUES
  -- Emprendedores en "Emprendimiento Juvenil"
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'emprendedor'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'emprendedor'),
  -- Emprendedor en "Innovación Digital"
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'emprendedor');

-- ============================================
-- 5. VERIFICAR ESTRUCTURA
-- ============================================
-- Mostrar jerarquía completa
SELECT 
  p.nombre_completo,
  p.rol,
  i.nombre AS institucion,
  jefe.nombre_completo AS jefe_directo,
  jefe.rol AS rol_jefe
FROM perfiles p
LEFT JOIN instituciones i ON p.institucion_id = i.id
LEFT JOIN perfiles jefe ON p.reporta_a = jefe.id
ORDER BY 
  CASE p.rol
    WHEN 'superadmin' THEN 1
    WHEN 'admin_institucional' THEN 2
    WHEN 'coordinador' THEN 3
    WHEN 'mentor' THEN 4
    WHEN 'emprendedor' THEN 5
  END,
  p.nombre_completo;