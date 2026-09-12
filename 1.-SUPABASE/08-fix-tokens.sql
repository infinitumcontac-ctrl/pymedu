-- ============================================
-- PymEdu - FIX DIRECTO: tokens NULL en auth.users
-- Corrige: "Scan error on column index 3, name 'confirmation_token':
--          converting NULL to string is unsupported"
-- Pegar en: Supabase Dashboard > SQL Editor > New Query > RUN
-- ============================================

-- GoTrue espera '' (string vacío), NO NULL, en estas columnas.
-- email y phone se omiten porque tienen restricción UNIQUE.

UPDATE auth.users
SET confirmation_token      = COALESCE(confirmation_token, ''),
    recovery_token          = COALESCE(recovery_token, ''),
    email_change            = COALESCE(email_change, ''),
    email_change_token_new  = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change            = COALESCE(phone_change, ''),
    phone_change_token      = COALESCE(phone_change_token, ''),
    reauthentication_token  = COALESCE(reauthentication_token, ''),
    raw_app_meta_data       = COALESCE(raw_app_meta_data, '{}'::jsonb),
    raw_user_meta_data      = COALESCE(raw_user_meta_data, '{}'::jsonb);

-- Verificación: ya no debe quedar NINGÚN NULL en esas columnas
SELECT
  email,
  (confirmation_token IS NULL) AS null_confirmation_token,
  (recovery_token IS NULL)     AS null_recovery_token,
  (email_change_token_new IS NULL) AS null_email_change_token_new,
  (raw_app_meta_data IS NULL)  AS null_raw_app_meta_data
FROM auth.users
ORDER BY email;
