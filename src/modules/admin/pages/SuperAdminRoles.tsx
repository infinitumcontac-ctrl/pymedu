import { useState } from 'react';

const roles = [
  {
    id: 'superadmin', nombre: 'Super Admin', color: 'bg-red-500', descripcion: 'Acceso total a la plataforma. Configuración global, auditoría y soporte.',
    permisos: { dashboard: 'rwd', organizaciones: 'rwd', usuarios: 'rwd', planes: 'rwd', roles: 'rwd', config: 'rwd', auditoria: 'rwd', soporte: 'rwd', academia: 'rwd', erp: 'rwd', mentoría: 'rwd', comunidad: 'rwd' },
  },
  {
    id: 'admin_institucional', nombre: 'Admin Institucional', color: 'bg-purple-500', descripcion: 'Administra una institución: usuarios, programas, comunidad y reportes.',
    permisos: { dashboard: 'rw', organizaciones: 'r', usuarios: 'rw', planes: 'r', roles: 'r', config: 'rw', auditoria: 'r', soporte: 'rw', academia: 'r', erp: 'r', mentoría: 'r', comunidad: 'rw' },
  },
  {
    id: 'coordinador', nombre: 'Coordinador', color: 'bg-blue-500', descripcion: 'Gestiona cohortes, asigna mentores y monitorea avance.',
    permisos: { dashboard: 'r', organizaciones: 'none', usuarios: 'r', planes: 'none', roles: 'none', config: 'none', auditoria: 'none', soporte: 'none', academia: 'r', erp: 'none', mentoría: 'rw', comunidad: 'r' },
  },
  {
    id: 'mentor', nombre: 'Mentor', color: 'bg-teal-500', descripcion: 'Acompaña emprendedores: sesiones, tareas, seguimiento.',
    permisos: { dashboard: 'r', organizaciones: 'none', usuarios: 'none', planes: 'none', roles: 'none', config: 'none', auditoria: 'none', soporte: 'none', academia: 'r', erp: 'r', mentoría: 'rw', comunidad: 'r' },
  },
  {
    id: 'emprendedor', nombre: 'Emprendedor', color: 'bg-green-500', descripcion: 'Accede a ERP, academia y mentoría asignada.',
    permisos: { dashboard: 'r', organizaciones: 'none', usuarios: 'none', planes: 'none', roles: 'none', config: 'none', auditoria: 'none', soporte: 'none', academia: 'rw', erp: 'rw', mentoría: 'r', comunidad: 'r' },
  },
];

const permisosLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  organizaciones: 'Organizaciones',
  usuarios: 'Usuarios',
  planes: 'Planes',
  roles: 'Roles',
  config: 'Configuración',
  auditoria: 'Auditoría',
  soporte: 'Soporte',
  academia: 'Academia',
  erp: 'ERP',
  mentoría: 'Mentoría',
  comunidad: 'Comunidad',
};

const permisoConfig: Record<string, { label: string; color: string }> = {
  rwd: { label: 'RWD', color: 'bg-green-100 text-green-700' },
  rw: { label: 'RW', color: 'bg-blue-100 text-blue-700' },
  r: { label: 'R', color: 'bg-slate-100 text-slate-600' },
  none: { label: '—', color: 'bg-surface-container-high text-on-surface-variant/40' },
};

export default function SuperAdminRoles() {
  const [rolSeleccionado, setRolSeleccionado] = useState('superadmin');
  const rol = roles.find(r => r.id === rolSeleccionado)!;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-indigo-500">admin_panel_settings</span>
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Roles y Permisos Maestros</h1>
          <p className="text-on-surface-variant">Define los roles base y la matriz de permisos de la plataforma</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista de roles */}
        <div className="lg:w-64 shrink-0 space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRolSeleccionado(r.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                rolSeleccionado === r.id
                  ? 'bg-primary/10 border-2 border-primary/30 shadow-sm'
                  : 'bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30'
              }`}
            >
              <span className={`h-3 w-3 rounded-full ${r.color} shrink-0`} />
              <div className="min-w-0">
                <p className="font-bold text-on-surface text-sm">{r.nombre}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{r.descripcion}</p>
              </div>
            </button>
          ))}
          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-surface-container-high text-sm font-bold text-on-surface-variant hover:border-primary/30 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            Nuevo Rol
          </button>
        </div>

        {/* Detalle del rol */}
        <div className="flex-1 space-y-6">
          {/* Header del rol */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-4 w-4 rounded-full ${rol.color}`} />
              <h2 className="text-xl font-extrabold text-on-surface">{rol.nombre}</h2>
              <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">edit</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant">{rol.descripcion}</p>
          </div>

          {/* Matriz de permisos */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">lock</span>
              <h3 className="font-extrabold text-on-surface">Matriz de Permisos — {rol.nombre}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="text-left p-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Módulo / Sección</th>
                    <th className="text-center p-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Permiso</th>
                    <th className="text-left p-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {Object.entries(rol.permisos).map(([key, perm]) => (
                    <tr key={key} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-lg">
                            {key === 'dashboard' ? 'dashboard' :
                             key === 'organizaciones' ? 'apartment' :
                             key === 'usuarios' ? 'group' :
                             key === 'planes' ? 'workspace_premium' :
                             key === 'roles' ? 'admin_panel_settings' :
                             key === 'config' ? 'settings' :
                             key === 'auditoria' ? 'fact_check' :
                             key === 'soporte' ? 'support_agent' :
                             key === 'academia' ? 'school' :
                             key === 'erp' ? 'point_of_sale' :
                             key === 'mentoría' ? 'groups' : 'diversity_3'}
                          </span>
                          <span className="font-bold text-on-surface text-sm">{permisosLabels[key]}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${permisoConfig[perm].color}`}>
                          {permisoConfig[perm].label}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-on-surface-variant">
                        {perm === 'rwd' && 'Lectura, escritura y eliminación'}
                        {perm === 'rw' && 'Lectura y escritura'}
                        {perm === 'r' && 'Solo lectura'}
                        {perm === 'none' && 'Sin acceso'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5">
            <h4 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-3">Leyenda de Permisos</h4>
            <div className="flex flex-wrap gap-4">
              {Object.entries(permisoConfig).filter(([k]) => k !== 'none').map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-on-surface-variant">
                    {key === 'rwd' && 'Leer + Escribir + Eliminar'}
                    {key === 'rw' && 'Leer + Escribir'}
                    {key === 'r' && 'Solo Leer'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
