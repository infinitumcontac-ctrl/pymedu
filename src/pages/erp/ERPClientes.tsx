import { useState } from 'react';
import { useERP } from '../../1.-ERP/context/ERPContext';
import ConfirmDeleteModal from '../../1.-ERP/components/ConfirmDeleteModal';
import { cn } from '@/lib/utils';

export default function ERPClientes() {
  const { clientes, addCliente, deleteCliente, getSaldoPendienteVenta, ventas } = useERP();
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState({ nombre: '', rut: '', telefono: '', email: '', comuna: '', limite_credito: '' });

  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('es-CL')}`;

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.rut || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalDeuda = clientes.reduce((a, c) => a + c.deuda, 0);

  const guardar = () => {
    if (!nuevo.nombre.trim()) return;
    addCliente({
      nombre: nuevo.nombre.trim(),
      rut: nuevo.rut || undefined,
      telefono: nuevo.telefono,
      email: nuevo.email,
      comuna: nuevo.comuna || undefined,
      limite_credito: nuevo.limite_credito ? Number(nuevo.limite_credito) : undefined,
    });
    setShowModal(false);
    setNuevo({ nombre: '', rut: '', telefono: '', email: '', comuna: '', limite_credito: '' });
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">groups</span>
            Clientes
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">Administra tus clientes y su deuda pendiente.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-lg">person_add</span>
          Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Total clientes</p>
          <p className="text-3xl font-black text-primary mt-1">{clientes.length}</p>
        </div>
        <div className="bg-secondary/10 p-5 rounded-2xl border border-secondary/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Deuda total</p>
          <p className="text-3xl font-black text-secondary mt-1">{fmt(totalDeuda)}</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Con saldo pendiente</p>
          <p className="text-3xl font-black text-on-surface mt-1">
            {clientes.filter(c => c.deuda > 0).length}
          </p>
        </div>
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
        <input type="text" placeholder="Buscar por nombre, RUT o correo..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border-2 border-outline-variant/50 rounded-xl text-sm focus:border-primary outline-none bg-surface-container-lowest text-on-surface" />
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/20">
              <tr>
                {['Cliente', 'Contacto', 'Ventas', 'Deuda pendiente', 'Limite credito', 'Acciones'].map(h => (
                  <th key={h} className="p-4 text-xs font-bold text-outline uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {clientesFiltrados.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No se encontraron clientes.</td></tr>
              )}
              {clientesFiltrados.map(c => {
                const saldoReal = c.deuda;
                return (
                  <tr key={c.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-on-surface">{c.nombre}</p>
                      {c.rut && <p className="text-xs text-on-surface-variant">{c.rut}</p>}
                    </td>
                    <td className="p-4 text-on-surface-variant text-xs">
                      <p>{c.email || '—'}</p>
                      <p>{c.telefono || '—'}</p>
                    </td>
                    <td className="p-4 font-bold text-on-surface">{c.ventas}</td>
                    <td className="p-4">
                      <span className={cn('font-extrabold', saldoReal > 0 ? 'text-secondary' : 'text-emerald-600')}>
                        {fmt(saldoReal)}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant">{c.limite_credito ? fmt(c.limite_credito) : '—'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => { setItemToDelete(c.id); setDeleteModalOpen(true); }}
                        className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-full hover:bg-error/10">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-primary">Nuevo Cliente</h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {[
                { key: 'nombre' as const, label: 'Nombre / Razon social' },
                { key: 'rut' as const, label: 'RUT (opcional)' },
                { key: 'telefono' as const, label: 'Telefono' },
                { key: 'email' as const, label: 'Email' },
                { key: 'comuna' as const, label: 'Comuna (opcional)' },
                { key: 'limite_credito' as const, label: 'Limite de credito (opcional)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input
                    type={f.key === 'limite_credito' ? 'number' : 'text'}
                    value={nuevo[f.key]}
                    onChange={e => setNuevo({ ...nuevo, [f.key]: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-outline-variant/50 rounded-xl text-sm focus:border-primary outline-none bg-surface-container-lowest text-on-surface"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl border-2 border-outline-variant/50 font-bold text-on-surface-variant">Cancelar</button>
              <button onClick={guardar} disabled={!nuevo.nombre.trim()} className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 disabled:opacity-50">Guardar Cliente</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={() => { if (itemToDelete) deleteCliente(itemToDelete); }}
        title="Eliminar Cliente" />
    </div>
  );
}