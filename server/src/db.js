import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'pymedu.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS instituciones (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      rut TEXT UNIQUE,
      rubro TEXT,
      region TEXT,
      comuna TEXT,
      direccion TEXT,
      logo_url TEXT,
      activa INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS perfiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nombre_completo TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN (
        'superadmin', 'admin_institucional', 'coordinador',
        'mentor', 'emprendedor', 'dueño', 'vendedor',
        'gestor', 'encargado_rrhh', 'empleado', 'contador_externo', 'demo'
      )),
      institucion_id TEXT REFERENCES instituciones(id) ON DELETE SET NULL,
      reporta_a TEXT REFERENCES perfiles(id) ON DELETE SET NULL,
      puede_ver_remuneraciones INTEGER DEFAULT 0,
      puede_ver_caja INTEGER DEFAULT 0,
      puede_ver_reportes INTEGER DEFAULT 0,
      puede_crear_ventas INTEGER DEFAULT 0,
      puede_crear_gastos INTEGER DEFAULT 0,
      notif_email INTEGER DEFAULT 1,
      notif_push INTEGER DEFAULT 0,
      push_token TEXT,
      activo INTEGER DEFAULT 1,
      acceso_revocado_at TEXT,
      negocio_nombre TEXT,
      negocio_rut TEXT,
      negocio_rubro TEXT,
      negocio_giro TEXT,
      negocio_actividad TEXT,
      negocio_region TEXT,
      negocio_comuna TEXT,
      negocio_direccion TEXT,
      membresia_nivel TEXT DEFAULT 'free' CHECK (membresia_nivel IN ('free', 'pro', 'premium')),
      membresia_expira TEXT,
      segmento_negocio TEXT DEFAULT 'C' CHECK (segmento_negocio IN ('A', 'B', 'C')),
      logo_url TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS programas (
      id TEXT PRIMARY KEY,
      institucion_id TEXT NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usuario_programas (
      usuario_id TEXT NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
      programa_id TEXT NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
      rol_en_programa TEXT DEFAULT 'emprendedor',
      fecha_asignacion TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (usuario_id, programa_id)
    );

    CREATE INDEX IF NOT EXISTS idx_perfiles_institucion ON perfiles(institucion_id);
    CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);
    CREATE INDEX IF NOT EXISTS idx_perfiles_reporta ON perfiles(reporta_a);
    CREATE INDEX IF NOT EXISTS idx_perfiles_email ON perfiles(email);

    CREATE TABLE IF NOT EXISTS pagos (
      id TEXT PRIMARY KEY,
      usuario_id TEXT,
      email TEXT,
      plan TEXT NOT NULL,
      monto INTEGER NOT NULL,
      buy_order TEXT UNIQUE NOT NULL,
      session_id TEXT,
      token_ws TEXT,
      estado TEXT DEFAULT 'iniciado',
      codigo_autorizacion TEXT,
      tarjeta TEXT,
      respuesta_tbk TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
  `);
}

export function seedDB() {
  const count = db.prepare('SELECT COUNT(*) as c FROM perfiles').get();
  if (count.c > 0) return;

  const insertInstitucion = db.prepare(
    'INSERT INTO instituciones (id, nombre, rut, rubro, region, comuna) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertPerfil = db.prepare(`
    INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, institucion_id, reporta_a,
      puede_ver_remuneraciones, puede_ver_caja, puede_ver_reportes, puede_crear_ventas, puede_crear_gastos,
      negocio_nombre, membresia_nivel, segmento_negocio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPrograma = db.prepare(
    'INSERT INTO programas (id, institucion_id, nombre, descripcion) VALUES (?, ?, ?, ?)'
  );
  const insertUP = db.prepare(
    'INSERT INTO usuario_programas (usuario_id, programa_id, rol_en_programa) VALUES (?, ?, ?)'
  );

  const seed = db.transaction(() => {
    const pw = bcrypt.hashSync('demo123', 10);

    insertInstitucion.run('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Instituto San Jose', '76.123.456-7', 'Educacion', 'Metropolitana', 'Santiago');
    insertInstitucion.run('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Incubadora Innova', '76.234.567-8', 'Tecnologia', 'Metropolitana', 'Providencia');
    insertInstitucion.run('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Universidad Catolica', '76.345.678-9', 'Educacion', 'Metropolitana', 'Nunoa');

    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'supadmin@pymedu.com', pw, 'Super Admin PymEdu', 'superadmin', null, null, 1,1,1,1,1, null, 'premium', 'A');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'admin@colegiosanjose.cl', pw, 'Admin Instituto San Jose', 'admin_institucional', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 1,1,1,1,1, 'Instituto San Jose', 'premium', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'admin@innova.cl', pw, 'Admin Incubadora Innova', 'admin_institucional', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 1,1,1,1,1, 'Incubadora Innova', 'premium', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'coord@colegiosanjose.cl', pw, 'Maria Gonzalez - Coordinadora', 'coordinador', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 0,0,1,0,0, null, 'pro', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'coord2@colegiosanjose.cl', pw, 'Pedro Alvarez - Coordinador', 'coordinador', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 0,0,1,0,0, null, 'pro', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'mentor@colegiosanjose.cl', pw, 'Carlos Ruiz - Mentor', 'mentor', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 0,0,0,0,0, null, 'pro', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'mentor2@colegiosanjose.cl', pw, 'Ana Martinez - Mentor', 'mentor', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 0,0,0,0,0, null, 'pro', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'mentor3@colegiosanjose.cl', pw, 'Luis Torres - Mentor', 'mentor', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 0,0,0,0,0, null, 'pro', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'emprendedor@pymedu.com', pw, 'Pedro Martinez - Emprendedor', 'emprendedor', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 1,1,1,1,1, 'Pyme Demo Chile', 'premium', 'B');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'emprendedor2@pymedu.com', pw, 'Laura Diaz - Emprendedora', 'emprendedor', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 0,0,1,1,0, 'Artesanias Laura', 'pro', 'C');
    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'emprendedor3@pymedu.com', pw, 'Roberto Sanchez - Emprendedor', 'emprendedor', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 1,1,1,1,1, 'Tech Solutions', 'premium', 'A');

    insertPerfil.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'demo@pymedu.com', pw, 'Usuario Demo - Acceso Completo', 'demo', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 1,1,1,1,1, 'Demo PymEdu', 'premium', 'A');

    insertPrograma.run('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emprendimiento Juvenil', 'Programa de apoyo a jovenes emprendedores');
    insertPrograma.run('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sostenibilidad Local', 'Emprendimientos sustentables');
    insertPrograma.run('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Innovacion Digital', 'Transformacion digital para PYMES');

    insertUP.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'emprendedor');
    insertUP.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'emprendedor');
    insertUP.run('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'emprendedor');
  });

  seed();
}

initDB();
seedDB();

export default db;
