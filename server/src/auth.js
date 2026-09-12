import { randomUUID } from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pymedu-secret-key-change-in-production';

// El frontend se autentica con Supabase Auth, asi que ademas del JWT local
// se validan los access tokens de Supabase contra el endpoint /auth/v1/user.
async function verificarSupabase(token) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  if (!supabaseUrl) {
    console.error('[auth] SUPABASE_URL no configurada en el servidor.');
    return null;
  }
  if (!process.env.SUPABASE_ANON_KEY) {
    console.error('[auth] SUPABASE_ANON_KEY no configurada: Supabase rechazara el token.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const cuerpo = await res.text().catch(() => '');
      console.error(`[auth] Supabase /auth/v1/user HTTP ${res.status}: ${cuerpo.slice(0, 300)}`);
      return null;
    }
    const user = await res.json();
    return user && user.id ? user : null;
  } catch (err) {
    console.error('[auth] Error llamando a Supabase /auth/v1/user:', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function generarToken(perfil) {
  return jwt.sign(
    { id: perfil.id, email: perfil.email, rol: perfil.rol },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function sanitizarPerfil(p) {
  return {
    id: p.id, email: p.email, nombre_completo: p.nombre_completo, rol: p.rol,
    institucion_id: p.institucion_id, reporta_a: p.reporta_a,
    puede_ver_remuneraciones: !!p.puede_ver_remuneraciones,
    puede_ver_caja: !!p.puede_ver_caja,
    puede_ver_reportes: !!p.puede_ver_reportes,
    puede_crear_ventas: !!p.puede_crear_ventas,
    puede_crear_gastos: !!p.puede_crear_gastos,
    membresia_nivel: p.membresia_nivel,
    segmento_negocio: p.segmento_negocio,
    negocio_nombre: p.negocio_nombre, negocio_rut: p.negocio_rut, negocio_rubro: p.negocio_rubro,
    logo_url: p.logo_url, avatar_url: p.avatar_url,
    activo: !!p.activo, acceso_revocado_at: p.acceso_revocado_at,
  };
}

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const perfil = db.prepare('SELECT * FROM perfiles WHERE id = ? AND activo = 1').get(decoded.id);
    if (!perfil) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (perfil.acceso_revocado_at) {
      return res.status(403).json({ error: 'Acceso revocado' });
    }

    req.perfil = perfil;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      // Session iniciada en Supabase Auth: validar el access token con Supabase.
      verificarSupabase(token)
        .then((usuario) => {
          if (!usuario || !usuario.id) {
            console.error('[auth] Token rechazado por Supabase. Prefijo:', token.slice(0, 24), '...');
            return res.status(401).json({ error: 'Token invalido o expirado' });
          }
          req.perfil = { id: usuario.id, email: usuario.email ?? '', rol: 'emprendedor', activo: 1 };
          next();
        })
        .catch((err) => {
          console.error('Error verificando token Supabase:', err);
          res.status(401).json({ error: 'Token invalido o expirado' });
        });
      return;
    }
    console.error('Error verificando token:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export const requireAuth = verificarToken;

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contrasena son requeridos' });
    }

    const perfil = db.prepare('SELECT * FROM perfiles WHERE email = ? AND activo = 1').get(email);
    if (!perfil) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    if (perfil.acceso_revocado_at) {
      return res.status(403).json({ error: 'Acceso revocado' });
    }

    if (!bcrypt.compareSync(password, perfil.password_hash)) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = generarToken(perfil);
    res.json({ token, perfil: sanitizarPerfil(perfil) });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existente = db.prepare('SELECT id FROM perfiles WHERE email = ?').get(email);
    if (existente) {
      return res.status(409).json({ error: 'El email ya esta registrado' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const id = randomUUID();

    db.prepare(`
      INSERT INTO perfiles (id, email, password_hash, nombre_completo, rol, membresia_nivel, segmento_negocio)
      VALUES (?, ?, ?, ?, 'dueno', 'free', 'C')
    `).run(id, email, password_hash, full_name);

    const perfil = db.prepare('SELECT * FROM perfiles WHERE id = ?').get(id);
    const token = generarToken(perfil);

    res.status(201).json({ token, perfil: sanitizarPerfil(perfil) });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  try {
    res.json({ perfil: sanitizarPerfil(req.perfil) });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
