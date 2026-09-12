-- ============================================
-- 12. ACTIVAR MEMBRESIA (post-pago)
-- ============================================
-- Problema: tras pagar, SuscripcionResultado intentaba
--   UPDATE perfiles SET membresia_nivel = ...
-- pero NO existe politica RLS de UPDATE en la tabla perfiles
-- (solo SELECT), por lo que la activacion fallaba en silencio
-- y el Dashboard seguia mostrando "Plan Basico (Gratis)".
--
-- Solucion: funcion SECURITY DEFINER que permite a cada usuario
-- autenticado activar (o degradar) SU PROPIA membresia, tocando
-- SOLO las columnas membresia_nivel / membresia_expira.
-- No puede cambiarse rol, ni permisos, ni columnas ajenas.
-- ============================================

CREATE OR REPLACE FUNCTION public.activar_membresia(
  p_nivel text,
  p_expira timestamptz
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.perfiles WHERE id = auth.uid();
  IF v_id IS NULL THEN
    RETURN false;
  END IF;
  IF p_nivel NOT IN ('free', 'pro', 'premium') THEN
    RETURN false;
  END IF;

  UPDATE public.perfiles
  SET membresia_nivel = p_nivel,
      membresia_expira = p_expira
  WHERE id = v_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activar_membresia(text, timestamptz) TO authenticated;