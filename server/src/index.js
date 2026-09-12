import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import authRouter, { requireAuth } from './auth.js';
import pagosRouter from './webpay.js';
import db from './db.js';

// Carga el .env de la raiz del proyecto (sin sobrescribir variables ya definidas)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const envPath = path.join(__dirname, '..', '..', '.env');
  const contenido = readFileSync(envPath, 'utf8');
  for (const linea of contenido.split('\n')) {
    const match = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith('VITE_')) continue;
    let valor = match[2].replace(/^["']|["']$/g, '');
    if (!(match[1] in process.env)) process.env[match[1]] = valor;
  }
} catch {
  // .env opcional
}

const app = express();
const PORT = parseInt(process.env.PORT || '4000');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/pagos', pagosRouter);

app.get('/api/instituciones', requireAuth, (_req, res) => {
  try {
    const rows = db.prepare('SELECT id, nombre FROM instituciones ORDER BY nombre').all();
    res.json({ data: rows });
  } catch (error) {
    console.error('Error en /instituciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/perfiles/institucion/:institucionId', requireAuth, (req, res) => {
  try {
    const { institucionId } = req.params;
    const filterRol = req.query.rol;
    const busqueda = req.query.busqueda;

    let sql = `SELECT id, email, nombre_completo, rol, activo, membresia_nivel, created_at
               FROM perfiles WHERE institucion_id = ? AND rol != 'superadmin'`;
    const params = [institucionId];

    if (filterRol && filterRol !== 'todos') {
      params.push(filterRol);
      sql += ` AND rol = ?`;
    }
    if (busqueda) {
      params.push(`%${busqueda}%`);
      sql += ` AND (nombre_completo LIKE ? OR email LIKE ?)`;
      params.push(`%${busqueda}%`);
    }

    sql += ' ORDER BY nombre_completo';
    const rows = db.prepare(sql).all(...params);
    res.json({ data: rows });
  } catch (error) {
    console.error('Error en /perfiles/institucion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/perfiles/stats/institucion/:institucionId', requireAuth, (req, res) => {
  try {
    const { institucionId } = req.params;
    const rows = db.prepare(
      `SELECT rol FROM perfiles WHERE institucion_id = ? AND rol != 'superadmin'`
    ).all(institucionId);

    const stats = { total: rows.length, coordinadores: 0, mentores: 0, emprendedores: 0 };
    rows.forEach(r => {
      if (r.rol === 'coordinador') stats.coordinadores++;
      if (r.rol === 'mentor') stats.mentores++;
      if (r.rol === 'emprendedor' || r.rol === 'dueño') stats.emprendedores++;
    });
    res.json(stats);
  } catch (error) {
    console.error('Error en /perfiles/stats/institucion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/perfiles', requireAuth, (req, res) => {
  try {
    const filterRol = req.query.rol;
    const filterInst = req.query.institucion_id;
    const busqueda = req.query.busqueda;
    const page = parseInt(req.query.page || '0');
    const pageSize = parseInt(req.query.page_size || '20');
    const offset = page * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (filterRol && filterRol !== 'todos') {
      params.push(filterRol);
      where += ` AND rol = ?`;
    }
    if (filterInst && filterInst !== 'todas') {
      params.push(filterInst);
      where += ` AND institucion_id = ?`;
    }
    if (busqueda) {
      params.push(`%${busqueda}%`, `%${busqueda}%`);
      where += ` AND (nombre_completo LIKE ? OR email LIKE ?)`;
    }

    const total = db.prepare(`SELECT COUNT(*) as c FROM perfiles ${where}`).get(...params).c;

    const rows = db.prepare(
      `SELECT id, email, nombre_completo, rol, institucion_id, reporta_a, activo, created_at
       FROM perfiles ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset);

    res.json({ data: rows, total, hasMore: offset + pageSize < total });
  } catch (error) {
    console.error('Error en /perfiles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/perfiles/stats', requireAuth, (_req, res) => {
  try {
    const rows = db.prepare('SELECT rol FROM perfiles').all();
    const counts = { total: rows.length };
    rows.forEach(r => {
      counts[r.rol] = (counts[r.rol] || 0) + 1;
    });
    res.json(counts);
  } catch (error) {
    console.error('Error en /perfiles/stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PymEdu API corriendo en http://0.0.0.0:${PORT}`);
});
