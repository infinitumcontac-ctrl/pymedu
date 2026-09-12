import { randomUUID, randomBytes } from 'crypto';
import { Router } from 'express';
import db from './db.js';
import { requireAuth } from './auth.js';

const router = Router();
const parseForm = (req, res, next) => {
  req.body = { ...(req.body || {}) };
  let data = '';
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', () => {
    new URLSearchParams(data).forEach((value, key) => {
      req.body[key] = value;
    });
    next();
  });
};

// ════════════════════════════════════════════════════
// Configuración Transbank (Webpay Plus REST v1.2)
// https://www.transbankdevelopers.cl/referencia/webpay
// ════════════════════════════════════════════════════

const TBK_HOSTS = {
  integracion: 'https://webpay3gint.transbank.cl',
  produccion: 'https://webpay3g.transbank.cl',
};

const TBK_ENV = process.env.TBK_ENV || 'integracion';
const COMMERCE_CODE = process.env.TBK_COMMERCE_CODE || '597055555532';
const API_KEY_SECRET =
  process.env.TBK_API_KEY_SECRET ||
  '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PLANES = {
  pro: { nombre: 'Plan Pro', monto: 10000 },
  premium: { nombre: 'Plan Premium', monto: 20000 },
};

function tbkHeaders() {
  return {
    'Tbk-Api-Key-Id': COMMERCE_CODE,
    'Tbk-Api-Key-Secret': API_KEY_SECRET,
    'Content-Type': 'application/json',
  };
}

function tbkHost() {
  return TBK_HOSTS[TBK_ENV] || TBK_HOSTS.integracion;
}

async function tbkFetch(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function crearTransaccionTbk({ buy_order, session_id, amount, return_url }) {
  const res = await tbkFetch(`${tbkHost()}/rswebpaytransaction/api/webpay/v1.2/transactions`, {
    method: 'POST',
    headers: tbkHeaders(),
    body: JSON.stringify({ buy_order, session_id, amount, return_url }),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(`Transbank create ${res.status}: ${detalle}`);
  }
  return res.json();
}

async function confirmarTransaccionTbk(token) {
  const res = await tbkFetch(`${tbkHost()}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
    method: 'PUT',
    headers: tbkHeaders(),
    body: '{}',
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(`Transbank commit ${res.status}: ${detalle}`);
  }
  return res.json();
}

async function activarMembresiaSupabase(usuarioId, plan) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey || !usuarioId) return false;
  const expira = new Date(Date.now() + 30 * 86400000).toISOString();
  const res = await fetch(`${supabaseUrl}/rest/v1/perfiles?id=eq.${usuarioId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ membresia_nivel: plan, membresia_expira: expira }),
  });
  if (!res.ok) {
    console.error('Error actualizando membresia en Supabase:', res.status);
    return false;
  }
  return true;
}

function generarBuyOrder() {
  return `PM-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
}

// ══ Crear transacción ════════════════════════════

router.post('/webpay/crear', requireAuth, async (req, res) => {
  try {
    const { plan, usuario_id, email } = req.body || {};

    const configPlan = PLANES[plan];
    if (!configPlan) {
      return res.status(400).json({ error: 'Plan invalido. Planes disponibles: pro, premium' });
    }
    if (!usuario_id) {
      return res.status(400).json({ error: 'usuario_id es requerido' });
    }

    const buy_order = generarBuyOrder();
    const session_id = randomUUID();

    const transaccion = await crearTransaccionTbk({
      buy_order,
      session_id,
      amount: configPlan.monto,
      return_url: `${process.env.API_PUBLIC_URL || 'http://localhost:4000'}/api/pagos/webpay/retorno`,
    });

    db.prepare(`
      INSERT INTO pagos (id, usuario_id, email, plan, monto, buy_order, session_id, token_ws, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'iniciado')
    `).run(randomUUID(), usuario_id, email || null, plan, configPlan.monto, buy_order, session_id, transaccion.token);

    res.json({
      token_ws: transaccion.token,
      url: transaccion.url,
      monto: configPlan.monto,
      plan,
      buy_order,
    });
  } catch (error) {
    console.error('Error creando transaccion Webpay:', error);
    res.status(502).json({ error: 'No se pudo iniciar el pago con Webpay' });
  }
});

// ══ Retorno desde Webpay ═════════════════════════

// Webpay puede redirigir al usuario por POST o por GET (ej: anulacion/timeout),
// por eso se acepta cualquier metodo y el token se busca en el body o en la query.
router.all('/webpay/retorno', parseForm, async (req, res) => {
  const irAResultado = (estado, extra = '') =>
    res.redirect(303, `${FRONT_URL}/erp/suscripcion/resultado?estado=${encodeURIComponent(estado)}${extra}`);

  console.log(`[webpay] retorno ${req.method} query=${JSON.stringify(req.query)} body=${JSON.stringify(Object.keys(req.body || {}))}`);

  try {
    const tokenWs = (req.body && req.body.token_ws) || req.query.token_ws;
    const tbkToken = (req.body && req.body.TBK_TOKEN) || req.query.TBK_TOKEN;

    // Pago anulado por el usuario o timeout: Webpay envia TBK_TOKEN
    if (tbkToken && !tokenWs) {
      db.prepare(`UPDATE pagos SET estado = 'cancelado', updated_at = datetime('now') WHERE token_ws = ?`)
        .run(tbkToken);
      return irAResultado('cancelado');
    }
    if (!tokenWs) {
      return irAResultado('error');
    }

    const respuesta = await confirmarTransaccionTbk(tokenWs);

    const pago = db.prepare('SELECT * FROM pagos WHERE token_ws = ?').get(tokenWs);
    if (!pago) {
      return irAResultado('error');
    }

    const aprobada = respuesta.status === 'AUTHORIZED' && respuesta.response_code === 0;

    db.prepare(`
      UPDATE pagos SET
        estado = ?,
        codigo_autorizacion = ?,
        tarjeta = ?,
        respuesta_tbk = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      aprobada ? 'pagada' : 'rechazada',
      aprobada ? String(respuesta.authorization_code ?? '') : null,
      respuesta.card_detail?.card_number ? `**** ${respuesta.card_detail.card_number}` : null,
      JSON.stringify(respuesta),
      pago.id,
    );

    if (!aprobada) {
      return irAResultado('rechazado', `&orden=${encodeURIComponent(pago.buy_order)}`);
    }

    await activarMembresiaSupabase(pago.usuario_id, pago.plan);
    return irAResultado('aprobado', `&orden=${encodeURIComponent(pago.buy_order)}`);
  } catch (error) {
    console.error('Error en retorno Webpay:', error);
    return irAResultado('error');
  }
});

// ══ Consultar pago por orden de compra ═══════════

router.get('/:buyOrder', requireAuth, (req, res) => {
  try {
    const pago = db.prepare(`
      SELECT buy_order, usuario_id, email, plan, monto, estado, codigo_autorizacion, tarjeta, created_at, updated_at
      FROM pagos WHERE buy_order = ?
    `).get(req.params.buyOrder);

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    res.json({ data: pago });
  } catch (error) {
    console.error('Error consultando pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
