-- ============================================
-- 11. FIX: Permisos crear_ventas / crear_gastos
-- ============================================
-- Problema: el esquema creaba perfiles con
--   puede_crear_ventas = false
--   puede_crear_gastos = false
-- lo que ocultaba 'Ventas' y 'Compras y gastos' en el menu ERP
-- para cuentas registradas (los perfiles de semilla si quedaban en true).
--
-- Se corrige el default del esquema para nuevos registros y
-- se habilitan estos permisos en los perfiles existentes segun su rol.
-- ============================================

-- 1) Default del esquema para futuros registros
ALTER TABLE public.perfiles
  ALTER COLUMN puede_crear_ventas SET DEFAULT true,
  ALTER COLUMN puede_crear_gastos SET DEFAULT true;

-- 2) Corregir perfiles existentes: dueños y gestores crean ventas y gastos
UPDATE public.perfiles
SET puede_crear_ventas = true,
    puede_crear_gastos = true,
    updated_at = NOW()
WHERE rol IN ('emprendedor', 'dueño', 'gestor');

-- 3) Vendedores solo crean ventas
UPDATE public.perfiles
SET puede_crear_ventas = true,
    updated_at = NOW()
WHERE rol = 'vendedor';