import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

const PAGE_SIZE = 20;

const rolConfig: Record<string, { label: string; color: string; icon: string }> = {
  superadmin: { label: 'Super Admin', color: 'bg-red-100 text-red-700', icon: 'shield' },
  admin_institucional: { label: 'Admin Institucional', color: 'bg-purple-100 text-purple-700', icon: 'admin_panel_settings' },
  coordinador: { label: 'Coordinador', color: 'bg-blue-100 text-blue-700', icon: 'supervisor_account' },
  mentor: { label: 'Mentor', color: 'bg-teal-100 text-teal-700', icon: 'school' },
  emprendedor: { label: 'Emprendedor', color: 'bg-green-100 text-green-700', icon: 'storefront' },
  dueño: { label: 'Dueño', color: 'bg-green-100 text-green-700', icon: 'storefront' },
  vendedor: { label: 'Vendedor', color: 'bg-orange-100 text-orange-700', icon: 'point_of_sale' },
  gestor: { label: 'Gestor', color: 'bg-cyan-100 text-cyan-700', icon: 'manage_accounts' },
  encargado_rrhh: { label: 'Enc. RRHH', color: 'bg-pink-100 text-pink-700', icon: 'badge' },
  empleado: { label: 'Empleado', color: 'bg-slate-100 text-slate-700', icon: 'person' },
  contador_externo: { label: 'Contador', color: 'bg-amber-100 text-amber-700', icon: 'calculate' },
};

export default function UsuariosGlobales() {
  const [usuarios, setUsuarios] = useState<Record<string, unknown>[]>([]);
  const [instituciones, setInstituciones] = useState<Record<string, string>[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroInst, setFiltroInst] = useState('todas');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchInstituciones = useCallback(async () => {
    const { data } = await supabase
      .from('instituciones')
      .select('id, nombre')
      .order('nombre');
    setInstituciones((data ?? []) as unknown as Record<string, string>[]);
  }, []);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.from('perfiles').select('rol');
    const counts: Record<string, number> = {};
    ((data ?? []) as { rol: string }[]).forEach(r => {
      counts[r.rol] = (counts[r.rol] || 0) + 1;
    });
    setStats(counts);
  }, []);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);

    const aplicarFiltros = (q: any) => {
      let query = q.neq('rol', 'superadmin');
      if (filtroRol !== 'todos') query = query.eq('rol', filtroRol);
      if (filtroInst !== 'todas') query = query.eq('institucion_id', filtroInst);
      if (busqueda) query = query.or(`nombre_completo.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
      return query;
    };

    const { count, error: errCount } = await aplicarFiltros(
      supabase.from('perfiles').select('id', { count: 'exact', head: true })
    );
    if (errCount) { console.error('Error contando usuarios:', errCount); setLoading(false); return; }
    setTotal(count ?? 0);

    const { data, error: errData } = await aplicarFiltros(
      supabase.from('perfiles').select('id, email, nombre_completo, rol, institucion_id, activo, created_at')
    )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (errData) { console.error('Error cargando usuarios:', errData); setLoading(false); return; }
    setUsuarios((data ?? []) as unknown as Record<string, unknown>[]);
    setHasMore((count ?? 0) > (page + 1) * PAGE_SIZE);
    setLoading(false);
  }, [busqueda, filtroRol, filtroInst, page]);

  useEffect(() => { fetchInstituciones(); fetchStats(); }, [fetchInstituciones, fetchStats]);
  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);
  useEffect(() => { setPage(0); }, [busqueda, filtroRol, filtroInst]);

  const getInstName = (id: string) => instituciones.find(i => i.id === id)?.nombre ?? '—';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-blue-500">group</span>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Todos los Usuarios</h1>
            <p className="text-on-surface-variant">{total} usuarios en {instituciones.length} instituciones</p>
          </div>
        </div>
      </div>

      {/* Stats por rol */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(rolConfig).filter(([k]) => stats[k] > 0).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFiltroRol(filtroRol === key ? 'todos' : key)}
            className={`bg-surface-container-lowest rounded-2xl p-4 border transition-all text-left ${
              filtroRol === key ? 'border-primary/40 shadow-md' : 'border-outline-variant/30 hover:border-primary/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>{stats[key] || 0}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">{config.icon}</span>
            </div>
            <p className="text-xs font-bold text-on-surface-variant">{config.label}</p>
          </button>
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
          <select value={filtroInst} onChange={(e) => setFiltroInst(e.target.value)} className="p-3 rounded-xl border-2 border-surface-container-high outline-none text-sm font-bold">
            <option value="todas">Todas las instituciones</option>
            {instituciones.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </select>
          <div className="text-xs text-on-surface-variant font-bold">
            {total} resultado{total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="text-left p-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Usuario</th>
                <th className="text-left p-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Rol</th>
                <th className="text-left p-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Institución</th>
                <th className="text-left p-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Cargando...</td></tr>
              ) : usuarios.map((u) => (
                <tr key={u.id as string} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-extrabold shrink-0">
                        {(u.nombre_completo as string)?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{u.nombre_completo as string}</p>
                        <p className="text-xs text-on-surface-variant">{u.email as string}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rolConfig[u.rol as string]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                      {rolConfig[u.rol as string]?.label ?? u.rol as string}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-on-surface-variant">
                    {getInstName(u.institucion_id as string)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors" title="Editar">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">edit</span>
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors" title="Cambiar rol">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">swap_horiz</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && usuarios.length === 0 && (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">person_off</span>
            <p className="mt-3 text-on-surface-variant font-bold">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border-2 border-surface-container-high text-sm font-bold disabled:opacity-40 hover:bg-surface-container-high transition-colors"
            >
              Anterior
            </button>
            <button
              disabled={!hasMore}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border-2 border-surface-container-high text-sm font-bold disabled:opacity-40 hover:bg-surface-container-high transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
