-- ============================================
-- PymEdu - Resetear contraseñas de usuarios demo
-- Password nueva para TODOS: Demo#2026
-- Pegar en: Supabase Dashboard > SQL Editor > New Query > RUN
-- ============================================

UPDATE auth.users
SET encrypted_password = crypt('Demo#2026', gen_salt('bf')),
    updated_at = now()
WHERE email IN (
  'supadmin@pymedu.com',
  'admin@colegiosanjose.cl',
  'coord@colegiosanjose.cl',
  'mentor@colegiosanjose.cl',
  'emprendedor@pymedu.com',
  'demo@pymedu.com'
);

-- Verificación
SELECT email, encrypted_password
FROM auth.users
WHERE email IN (
  'supadmin@pymedu.com',
  'admin@colegiosanjose.cl',
  'coord@colegiosanjose.cl',
  'mentor@colegiosanjose.cl',
  'emprendedor@pymedu.com',
  'demo@pymedu.com'
)
ORDER BY email;
