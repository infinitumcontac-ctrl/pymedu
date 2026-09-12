import { useState, useEffect, useCallback, FormEvent } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

const rolConfig: Record<string, { label: string; color: string; icon: string }> = {
  coordinador: { label: 'Coordinador', color: 'bg-purple-100 text-purple-700', icon: 'supervisor_account' },
  mentor: { label: 'Mentor', color: 'bg-teal-100 text-teal-700', icon: 'school' },
  emprendedor: { label: 'Emprendedor', color: 'bg-blue-100 text-blue-700', icon: 'storefront' },
  dueño: { label: 'Dueño', color: 'bg-green-100 text-green-700', icon: 'storefront' },
};

interface SolicitudVinculacion {
  id: string;
  usuario_id: string;
  institucion_id: string;
  estado: string;
  mensaje?: string | null;
  created_at: string;
  perfil?: { nombre_completo: string; email: string } | null;
  institucion?: { nombre: string } | null;
}

interface CodigoInvitacion {
  id: string;
  codigo: string;
  rol: string;
  usos_max: number;
  usos_actuales: number;
  activo: boolean;
  created_at: string;
  expira_at?: string | null;
}

export default function InstUsuarios() {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState({ total: 0, coordinadores: 0, mentores: 0, emprendedores: 0 });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [solicitudes, setSolicitudes] = useState<SolicitudVinculacion[]>([]);
  const [codigos, setCodigos] = useState<CodigoInvitacion[]>([]);
  const [rolInv, setRolInv] = useState('emprendedor');
  const [usosMax, setUsosMax] = useState(1);
  const [ultimoCodigo, setUltimoCodigo] = useState<string | null>(null);
  const [gestionando, setGestionando] = useState(false);

  const fetchData = useCallback(async () => {
    if (!perfil?.institucion_id) return;
    setLoading(true);

    let query = supabase
      .from('perfiles')
      .select('id, email, nombre_completo, rol, activo, membresia_nivel, created_at')
      .eq('institucion_id', perfil.institucion_id)
      .neq('rol', 'superadmin');

    if (filtroRol !== 'todos') query = query.eq('rol', filtroRol);
    if (busqueda) query = query.or(`nombre_completo.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);

    const { data, error } = await query.order('nombre_completo');
    if (error) { console.error('Error cargando usuarios:', error); setLoading(false); return; }
    setUsuarios((data ?? []) as unknown as Record<string, unknown>[]);
    setLoading(false);
  }, [perfil?.institucion_id, busqueda, filtroRol]);

  const fetchStats = useCallback(async () => {
    if (!perfil?.institucion_id) return;
    const { data, error } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('institucion_id', perfil.institucion_id)
      .neq('rol', 'superadmin');
    if (error) { console.error('Error cargando stats:', error); return; }
    const rows = (data ?? []) as { rol: string }[];
    const computados = { total: rows.length, coordinadores: 0, mentores: 0, emprendedores: 0 };
    rows.forEach(r => {
      if (r.rol === 'coordinador') computados.coordinadores++;
      if (r.rol === 'mentor') computados.mentores++;
      if (r.rol === 'emprendedor' || r.rol === 'dueño') computados.emprendedores++;
    });
    setStats(computados);
  }, [perfil?.institucion_id]);

  const fetchSolicitudes = useCallback(async () => {
    if (!perfil?.institucion_id) return;
    const { data, error } = await supabase
      .from('solicitudes_vinculacion')
      .select('id, usuario_id, institucion_id, estado, mensaje, created_at, perfil:perfiles(nombre_completo, email), institucion:instituciones(nombre)')
      .eq('institucion_id', perfil.institucion_id)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });
    if (error) { console.error('Error cargando solicitudes:', error); return; }
    setSolicitudes((data ?? []) as unknown as SolicitudVinculacion[]);
  }, [perfil?.institucion_id]);

  const fetchCodigos = useCallback(async () => {
    if (!perfil?.institucion_id) return;
    const { data, error } = await supabase
      .from('codigos_invitacion')
      .select('*')
      .eq('institucion_id', perfil.institucion_id)
      .order('created_at', { ascending: false });
    if (error) { console.error('Error cargando códigos:', error); return; }
    setCodigos((data ?? []) as CodigoInvitacion[]);
  }, [perfil?.institucion_id]);

  useEffect(() => {
    fetchData();
    fetchStats();
    fetchSolicitudes();
    fetchCodigos();
  }, [fetchData, fetchStats, fetchSolicitudes, fetchCodigos]);

  const responderSolicitud = async (id: string, aprobar: boolean) => {
    setGestionando(true);
    const { error } = await supabase.rpc('aprobar_solicitud', {
      p_solicitud_id: id,
      p_aprobada: aprobar,
    });
    setGestionando(false);
    if (error) {
      alert(`No se pudo ${aprobar ? 'aprobar' : 'rechazar'} la solicitud: ${error.message}`);
      return;
    }
    await fetchSolicitudes();
  };

  const generarCodigo = async (e: FormEvent) => {
    e.preventDefault();
    if (!perfil?.institucion_id) return;
    setGestionando(true);
    const { data, error } = await supabase.rpc('generar_codigo_invitacion', {
      p_institucion_id: perfil.institucion_id,
      p_rol: rolInv,
      p_usos_max: Number(usosMax) || 1,
    });
    setGestionando(false);
    if (error) {
      alert(`No se pudo generar el código: ${error.message}`);
      return;
    }
    if (data) setUltimoCodigo(String(data));
    await fetchCodigos();
  };

  const desactivarCodigo = async (id: string) => {
    setGestionando(true);
    const { error } = await supabase.rpc('desactivar_codigo', { p_codigo_id: id });
    setGestionando(false);
    if (error) { alert(`No se pudo desactivar el código: ${error.message}`); return; }
    await fetchCodigos();
  };

  const copiarCodigo = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      alert(`Código ${codigo} copiado al portapapeles`);
    } catch { /* sin acceso al portapapeles */ }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-purple-500">group</span>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Usuarios de la Institución</h1>
            <p className="text-on-surface-variant">{stats.total} usuarios</p>
          </div>
        </div>
      </div>

      {/* Vinculación: solicitudes y códigos de invitación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitudes de vinculación */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">person_add</span>
              <h2 className="font-extrabold text-on-surface">Solicitudes de vinculación</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">{solicitudes.length} pendientes</span>
          </div>
          <div className="divide-y divide-outline-variant/30">
            {solicitudes.length === 0 ? (
              <p className="p-6 text-sm text-on-surface-variant">
                No hay solicitudes pendientes. Los usuarios que eligen tu institución al registrarse aparecerán aquí.
              </p>
            ) : solicitudes.map((sol) => (
              <div key={sol.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-extrabold">
                      {sol.perfil?.nombre_completo?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface text-sm truncate">{sol.perfil?.nombre_completo ?? 'Usuario'}</p>
                      <p className="text-xs text-on-surface-variant truncate">{sol.perfil?.email ?? ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => responderSolicitud(sol.id, true)}
                      disabled={gestionando}
                      className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => responderSolicitud(sol.id, false)}
                      disabled={gestionando}
                      className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-2">
                  Solicitada el {new Date(sol.created_at).toLocaleString('es-CL')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Códigos de invitación */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-500">card_membership</span>
              <h2 className="font-extrabold text-on-surface">Códigos de invitación</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Los usuarios canjean estos códigos al registrarse y quedan vinculados automáticamente con el rol asignado.
            </p>
          </div>
          <div className="p-4 space-y-4">
            {ultimoCodigo && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-sm font-bold flex items-center justify-between gap-2">
                <span>Nuevo código: <span className="font-black tracking-widest">{ultimoCodigo}</span></span>
                <button onClick={() => copiarCodigo(ultimoCodigo)} className="px-2 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">
                  Copiar
                </button>
              </div>
            )}
            <form onSubmit={generarCodigo} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Rol asignado</label>
                  <select
                    value={rolInv}
                    onChange={(e) => setRolInv(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-surface-container-high focus:border-primary/50 outline-none text-sm"
                  >
                    <option value="emprendedor">Emprendedor</option>
                    <option value="dueño">Dueño</option>
                    <option value="mentor">Mentor</option>
                    <option value="coordinador">Coordinador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Usos máximos</label>
                  <input
                    type="number"
                    min={1}
                    value={usosMax}
                    onChange={(e) => setUsosMax(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border-2 border-surface-container-high focus:border-primary/50 outline-none text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={gestionando}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                Generar código
              </button>
            </form>
            <div className="max-h-56 overflow-y-auto divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30">
              {codigos.length === 0 ? (
                <p className="p-4 text-sm text-on-surface-variant">Aún no generas códigos.</p>
              ) : codigos.map((c) => (
                <div key={c.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-black tracking-widest text-sm ${c.activo ? 'text-teal-600' : 'text-on-surface-variant line-through'}`}>
                        {c.codigo}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${!c.activo ? 'bg-slate-100 text-slate-500' : c.usos_actuales >= c.usos_max ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                        {c.usos_actuales}/{c.usos_max}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">Rol: {c.rol} · {new Date(c.created_at).toLocaleString('es-CL')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => copiarCodigo(c.codigo)} title="Copiar" className="p-1.5 rounded-lg hover:bg-surface-container-high">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">content_copy</span>
                    </button>
                    {c.activo && (
                      <button onClick={() => desactivarCodigo(c.id)} title="Desactivar" className="p-1.5 rounded-lg hover:bg-red-50">
                        <span className="material-symbols-outlined text-sm text-red-500">block</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Coordinadores', value: stats.coordinadores, icon: 'supervisor_account', color: 'bg-purple-500' },
          { label: 'Mentores', value: stats.mentores, icon: 'school', color: 'bg-teal-500' },
          { label: 'Emprendedores', value: stats.emprendedores, icon: 'storefront', color: 'bg-blue-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color} text-white`}>
                <span className="material-symbols-outlined text-lg">{stat.icon}</span>
              </span>
              <span className="text-xs font-bold text-on-surface-variant">{stat.label}</span>
            </div>
            <p className="text-2xl font-extrabold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 min-w-[200px] p-3 rounded-xl border-2 border-surface-container-high focus:border-primary/50 outline-none transition-all text-sm"
          />
          <div className="flex rounded-xl border-2 border-surface-container-high overflow-hidden">
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'coordinador', label: 'Coordinadores' },
              { value: 'mentor', label: 'Mentores' },
              { value: 'emprendedor', label: 'Emprendedores' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFiltroRol(opt.value)}
                className={`px-3 py-2 text-xs font-bold transition-colors ${
                  filtroRol === opt.value ? 'bg-primary text-white' : 'hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="divide-y divide-outline-variant/30">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">Cargando...</div>
          ) : usuarios.map((user) => (
            <div key={user.id as string} className="p-4 hover:bg-surface-container-low/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-sm font-extrabold shrink-0">
                    {(user.nombre_completo as string)?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-on-surface">{user.nombre_completo as string}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rolConfig[user.rol as string]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                        {rolConfig[user.rol as string]?.label ?? user.rol as string}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{user.email as string}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        {!loading && usuarios.length === 0 && (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">person_off</span>
            <p className="mt-3 text-on-surface-variant font-bold">No se encontraron usuarios</p>
          </div>
        )}
      </div>
    </div>
  );
}
