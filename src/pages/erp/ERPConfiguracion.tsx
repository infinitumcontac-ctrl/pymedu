import { useState } from 'react';
import { useERP } from '../../1.-ERP/context/ERPContext';

export default function ERPConfiguracion() {
  const { configuracionCumplimiento, updatePpmTasa, user } = useERP();
  const [ppm, setPpm] = useState(String(configuracionCumplimiento.ppmTasa));
  const [guardado, setGuardado] = useState(false);

  const guardar = async () => {
    const valor = Number(ppm);
    if (isNaN(valor) || valor < 0) return;
    await updatePpmTasa(valor);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const secciones = [
    {
      titulo: 'Integracion con SII',
      icono: 'cloud_sync',
      items: [
        { label: 'Modo de integracion', valor: configuracionCumplimiento.modoIntegracion },
        { label: 'Ambiente', valor: configuracionCumplimiento.ambiente },
        { label: 'Uso de folios manuales', valor: configuracionCumplimiento.usaFoliosManual ? 'Habilitado' : 'Deshabilitado' },
      ],
    },
    {
      titulo: 'Cumplimiento tributario',
      icono: 'verified_user',
      items: [
        { label: 'Tasa PPM', valor: `${configuracionCumplimiento.ppmTasa}%` },
        { label: 'Declaradores disponibles', valor: 'F29 mensual' },
      ],
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-extrabold text-primary flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl">settings</span>
          Configuracion
        </h2>
        <p className="text-on-surface-variant mt-1 text-sm">Parametros de cumplimiento tributario del ERP.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {secciones.map(s => (
          <div key={s.titulo} className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{s.icono}</span>
              <h3 className="font-bold text-on-surface">{s.titulo}</h3>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {s.items.map(item => (
                <div key={item.label} className="px-5 py-3 flex justify-between items-center">
                  <p className="text-sm font-bold text-on-surface-variant">{item.label}</p>
                  <p className="text-sm font-black text-on-surface">{item.valor}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary">percent</span>
          <div>
            <h3 className="font-bold text-on-surface">Tasa de PPM (Pagos Provisional Mensuales)</h3>
            <p className="text-xs text-on-surface-variant">Ingresa el porcentaje que aparece en tu resolucion de PPM para el calculo del F29.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="number" step="0.1" min="0" max="100" value={ppm}
            onChange={e => setPpm(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-outline-variant/50 rounded-xl text-sm font-bold focus:border-primary outline-none bg-surface-container-lowest text-on-surface" />
          <button onClick={guardar} className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            {guardado ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
        <p><span className="font-black text-on-surface">Cuenta conectada:</span> {user?.email}</p>
      </div>
    </div>
  );
}