# PymEdu - Sistema de Gestión para PYMES

Sistema completo de gestión para pequeñas y medianas empresas, con estructura jerárquica de roles y soporte multi-tenant.

## Características

- **Estructura jerárquica de roles**: SuperAdmin → Admin Institucional → Coordinador → Mentor → Emprendedor
- **Multi-tenant**: Soporte para múltiples instituciones
- **Base de datos escalable**: PostgreSQL administrado con Supabase
- **Autenticación local**: Sin dependencia de servicios externos

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm o yarn
- Proyecto en [Supabase](https://supabase.com) creado

## Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd PymEdu
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Luego completa en `.env` tus credenciales de Supabase (ver sección **Conexión a Supabase**).

### 4. Iniciar servicios
```bash
# Windows PowerShell
.\start.ps1

# Linux/Mac
chmod +x start.sh
./start.sh
```

O manualmente:
```bash
# Iniciar servidor API (en otra terminal)
npm run server

# Iniciar frontend (en otra terminal)
npm run dev
```

## URLs de Servicios

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |

## Conexión a Supabase

El frontend se conecta a Supabase usando `@supabase/supabase-js`. Solo necesitas dos variables en `.env`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-anon-key...
```

### ¿Cómo obtener las keys?

1. Entra a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings → API** (o **Project Settings → API Keys**)
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** (o **API Keys → anon**) → `VITE_SUPABASE_ANON_KEY`

> **Importante**: usa siempre la key `anon` pública en el frontend, nunca la `service_role` (es secreta).

### SQL de la base de datos

Todos los scripts SQL están en la carpeta `1.-SUPABASE/`:

| Archivo | Descripción |
|---------|-------------|
| `00-reset.sql` | Elimina TODO el esquema public + usuarios demo (partir de cero) |
| `01-init.sql` | Estructura de la base de datos |
| `02-seed.sql` | Datos de prueba |
| `03-migrate.sql` | Script de migración |
| `04-supabase-migracion.sql` | Migración completa para Supabase (esquema + RLS + seed) |
| `05-supabase-seed.sql` | Usuarios demo en Supabase Auth |

### Crear la base de datos en Supabase (desde cero)

1. Entra a tu proyecto → **SQL Editor** → **New Query**
2. Pega el contenido de `04-supabase-migracion.sql` y ejecútalo
3. Luego pega y ejecuta `05-supabase-seed.sql` (usuarios demo)

### Resetear y volver a empezar

1. Ejecuta `00-reset.sql` (borra todas las tablas, funciones, policies y usuarios demo)
2. Ejecuta `04-supabase-migracion.sql`
3. Ejecuta `05-supabase-seed.sql`

## Credenciales Demo

| Rol | Email | Password |
|-----|-------|----------|
| Super Admin | supadmin@pymedu.com | `Demo#2026` |
| Admin Institucional | admin@colegiosanjose.cl | `Demo#2026` |
| Coordinador | coord@colegiosanjose.cl | `Demo#2026` |
| Mentor | mentor@colegiosanjose.cl | `Demo#2026` |
| Emprendedor | emprendedor@pymedu.com | `Demo#2026` |
| Demo (todos los roles) | demo@pymedu.com | `Demo#2026` |

> La contraseña de todos los accesos demo es `Demo#2026`. Para activar los botones de acceso rápido de la pantalla de Login deben existir estos usuarios en Supabase (Auth + tabla `perfiles`), creados con `05-supabase-seed.sql`.

## Estructura de Roles

```
SUPERADMIN (ve todo, segmentado por institución)
├── ADMINISTRADOR INSTITUCIONAL 1 (ve su institución)
│   ├── COORDINADOR (ve sus mentores y emprendedores)
│   │   ├── MENTOR (ve sus emprendedores asignados)
│   │   │   └── EMPRENDEDOR (ve solo su perfil/ERP)
│   │   └── MENTOR 2
│   └── COORDINADOR 2
├── ADMINISTRADOR INSTITUCIONAL 2
│   ├── COORDINADOR
│   │   └── MENTOR
│   │       └── EMPRENDEDOR
└── ADMINISTRADOR INSTITUCIONAL 3
    └── ...
```

## Comandos Útiles

```bash
# Iniciar todo
.\start.ps1        # Windows
./start.sh         # Linux/Mac

# Solo frontend
npm run dev

# Solo servidor API
npm run server
```

## Desarrollo

### Estructura del Proyecto

```
PymEdu/
├── 1.-SUPABASE/
│   ├── 01-init.sql           # Estructura de BD
│   ├── 02-seed.sql           # Datos de prueba
│   ├── 03-migrate.sql        # Script de migración
│   ├── 04-supabase-migracion.sql
│   └── 05-supabase-seed.sql
├── src/
│   ├── lib/
│   │   ├── api.ts        # Cliente API local
│   │   └── supabase.ts   # Cliente Supabase (supabase-js)
│   ├── context/
│   │   └── AuthContext.tsx
│   └── ...
├── server/
│   └── src/              # Backend API (Express)
└── package.json
```

### Agregar Nuevos Roles

1. Editar `1.-SUPABASE/01-init.sql`:
```sql
ALTER TABLE perfiles DROP CONSTRAINT perfiles_rol_check;
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check CHECK (rol IN (
  'superadmin', 'admin_institucional', 'coordinador', 
  'mentor', 'emprendedor', 'dueño', 'vendedor', 
  'gestor', 'encargado_rrhh', 'empleado', 'contador_externo',
  'nuevo_rol'  -- Agregar aquí
));
```

2. Actualizar `src/context/AuthContext.tsx`:
```typescript
export type Rol =
  | 'superadmin'
  // ... otros roles
  | 'nuevo_rol';
```

3. Actualizar permisos en `src/context/AuthContext.tsx`:
```typescript
case 'nuevo_rol':
  return ['permiso1', 'permiso2'].includes(permiso);
```

### Consultas Jerárquicas

```sql
-- Obtener todos los subordinados de un usuario
SELECT * FROM obtener_subordinados('id-del-usuario');

-- Verificar permiso de un usuario
SELECT verificar_permiso('id-del-usuario', 'permiso');

-- Ver jerarquía completa
SELECT * FROM vista_jerarquia;
```

## Producción

Para desplegar en producción:

1. Cambiar contraseñas por defecto
2. Configurar HTTPS
3. Configurar backups automáticos
4. Monitoreo y logs

## Licencia

MIT
