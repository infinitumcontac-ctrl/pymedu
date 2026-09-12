import { supabase } from './supabase';

// En desarrollo (Vite) usa el proxy de vite.config.ts.
// En produccion apunta a la API desplegada (VITE_API_URL, ej: Vercel + Render).
const API_URL = import.meta.env.VITE_API_URL ?? '';

// Devuelve el access token de la sesion Supabase actual (refrescada si hace falta).
async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? null;
  if (token) {
    localStorage.setItem('pymedu_token', token);
  }
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `Error ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder. Verifica que la API esté corriendo e inténtalo de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; perfil: Record<string, unknown> }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, full_name: string) =>
    request<{ token: string; perfil: Record<string, unknown> }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    }),

  me: () =>
    request<{ perfil: Record<string, unknown> }>('/api/auth/me'),

  getInstituciones: () =>
    request<{ data: Record<string, unknown>[] }>('/api/instituciones'),

  getPerfiles: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ data: Record<string, unknown>[]; total: number; hasMore: boolean }>(
      `/api/perfiles${query ? `?${query}` : ''}`
    );
  },

  getPerfilesStats: () =>
    request<Record<string, number>>('/api/perfiles/stats'),

  getPerfilesByInstitucion: (institucionId: string, params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ data: Record<string, unknown>[] }>(
      `/api/perfiles/institucion/${institucionId}${query ? `?${query}` : ''}`
    );
  },

  getPerfilesStatsByInstitucion: (institucionId: string) =>
    request<{ total: number; coordinadores: number; mentores: number; emprendedores: number }>(
      `/api/perfiles/stats/institucion/${institucionId}`
    ),

  crearPagoWebpay: (plan: string, usuario_id: string, email: string) =>
    request<{ token_ws: string; url: string; monto: number; plan: string; buy_order: string }>(
      '/api/pagos/webpay/crear',
      {
        method: 'POST',
        body: JSON.stringify({ plan, usuario_id, email }),
      }
    ),

  getPagoWebpay: (buyOrder: string) =>
    request<{
      data: {
        buy_order: string;
        plan: string;
        monto: number;
        estado: string;
        codigo_autorizacion: string | null;
        tarjeta: string | null;
        created_at: string;
      };
    }>(`/api/pagos/${encodeURIComponent(buyOrder)}`),
};
