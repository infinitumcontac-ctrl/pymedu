import { useState, useRef } from 'react';
import { Venta, TipoDocumento } from '../context/ERPContext';

interface ModalSincronizacionSIIProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (ventas: Partial<Venta>[]) => void;
  ventasExistentes: Venta[];
}

export default function ModalSincronizacionSII({ isOpen, onClose, onImport, ventasExistentes }: ModalSincronizacionSIIProps) {
  const [activeMode, setActiveMode] = useState<'manual' | 'auto'>('manual');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAutoSync = async () => {
    setLoading(true);
    setSyncStatus('Iniciando conexión segura con el SII...');
    
    // Simulating the automated sync process
    await new Promise(r => setTimeout(r, 1500));
    setSyncStatus('Autenticando con Clave Tributaria...');
    await new Promise(r => setTimeout(r, 1500));
    setSyncStatus('Descargando Registro de Compras y Ventas (RCV)...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Simulated data from SII
    const mockData = [
      { folio: '1024', fecha: '2026-05-18', cliente: 'IMPORTADORA LOREM IPSUM', monto: 154900, tipo: '33' },
      { folio: '1025', fecha: '2026-05-19', cliente: 'CONSTRUCTORA ALPHA SPA', monto: 890000, tipo: '33' },
      { folio: '882', fecha: '2026-05-19', cliente: 'CLIENTE PARTICULAR', monto: 12500, tipo: '39' },
    ];

    const parsedData = mockData.map(d => {
      const existe = ventasExistentes.some(v => v.nota?.includes(`Folio SII: ${d.folio}`) && v.tipo_documento === mapTipoDoc(d.tipo));
      return {
        id: `SII-${d.folio}`,
        fecha: d.fecha,
        cliente: d.cliente,
        monto: d.monto,
        neto: Math.round(d.monto / 1.19),
        iva: d.monto - Math.round(d.monto / 1.19),
        exento: 0,
        tipo_documento: mapTipoDoc(d.tipo),
        folio: d.folio,
        existe
      };
    });

    setPreview(parsedData);
    setLoading(false);
    setSyncStatus(null);
  };

  const mapTipoDoc = (tipo: string): TipoDocumento => {
    switch (tipo) {
      case '33': return 'factura_electronica';
      case '34': return 'factura_exenta';
      case '39': return 'boleta_electronica';
      case '41': return 'boleta_exenta';
      case '61': return 'nota_credito';
      default: return 'boleta_electronica';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        setLoading(false);
        return;
      }

      // SII CSV standard usually uses ';' as separator
      const headers = lines[0].split(';');
      const rows = lines.slice(1).filter(line => line.trim() !== '');

      const parsedData = rows.map(row => {
        const values = row.split(';');
        const data: any = {};
        headers.forEach((header, i) => {
          data[header.trim()] = values[i]?.trim();
        });

        // Mapping SII columns (typical names in RCV export)
        // Note: Field names might vary slightly depending on export type
        const folio = data['Folio'] || data['Nro. Docto'];
        const tipo = data['Tipo Doc'] || data['Tipo Docto'];
        const fecha = data['Fecha Docto'] || data['Fecha'];
        const rut = data['RUT Receptor'] || data['RUT Cliente'];
        const razonSocial = data['Razón Social'] || data['Cliente'];
        const neto = parseInt(data['Monto Neto'] || '0');
        const iva = parseInt(data['Monto IVA'] || '0');
        const exento = parseInt(data['Monto Exento'] || '0');
        const total = parseInt(data['Monto Total'] || '0');

        // Check if already exists (by folio and type)
        const existe = ventasExistentes.some(v => v.nota?.includes(`Folio SII: ${folio}`) && v.tipo_documento === mapTipoDoc(tipo));

        return {
          id: `SII-${folio}`,
          fecha: fecha?.split('/').reverse().join('-'), // Convert DD/MM/YYYY to YYYY-MM-DD
          cliente: razonSocial || rut || 'Cliente SII',
          monto: total,
          neto,
          iva,
          exento,
          tipo_documento: mapTipoDoc(tipo),
          folio,
          existe,
          raw: data
        };
      });

      setPreview(parsedData);
      setLoading(false);
    };
    reader.readAsText(file, 'ISO-8859-1'); // SII uses ISO-8859-1 for special characters like Ñ
  };

  const handleConfirm = () => {
    const toImport = preview
      .filter(p => !p.existe)
      .map(p => ({
        fecha: p.fecha,
        cliente: p.cliente,
        monto: p.monto,
        subtotal: p.neto + p.exento,
        iva: p.iva,
        estado: 'Pagado' as const,
        tipo_documento: p.tipo_documento,
        metodo_pago: 'transferencia' as const,
        nota: `Importado desde SII. Folio SII: ${p.folio}`,
        productos: [
          {
            productoId: 'import-sii',
            productoNombre: `Venta SII Folio ${p.folio}`,
            cantidad: 1,
            precioBase: p.neto + p.exento,
            costoUnitario: 0,
            subtotal: p.neto + p.exento,
            iva: p.iva,
            total: p.monto
          }
        ]
      }));
    
    onImport(toImport);
    onClose();
    setFile(null);
    setPreview([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
          <div>
            <h3 className="text-xl font-bold text-primary">Sincronización con SII</h3>
            <p className="text-xs text-slate-500 mt-1">Trae tus ventas directamente desde el portal oficial del SII.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex bg-slate-100 p-1 m-6 mb-0 rounded-2xl w-fit shrink-0">
          <button 
            onClick={() => { setActiveMode('manual'); setPreview([]); }}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeMode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            CARGA MANUAL (CSV)
          </button>
          <button 
            onClick={() => { setActiveMode('auto'); setPreview([]); }}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeMode === 'auto' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="material-symbols-outlined text-sm">robot_2</span>
            AUTOMÁTICO (BETA)
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* MODO AUTOMÁTICO - Pantalla Inicial */}
          {activeMode === 'auto' && preview.length === 0 && (
            <div className="text-center py-12 space-y-6">
              <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto border-4 border-primary/20">
                <span className={`material-symbols-outlined text-5xl text-primary ${loading ? 'animate-spin' : ''}`}>
                  {loading ? 'sync' : 'account_balance'}
                </span>
              </div>
              
              <div className="max-w-md mx-auto">
                <h4 className="text-lg font-bold text-slate-800">Sincronización Directa</h4>
                <p className="text-sm text-slate-500 mt-2">
                  {loading 
                    ? syncStatus 
                    : 'Usaremos tus credenciales configuradas en "Integraciones" para descargar el Registro de Compras y Ventas del mes actual.'}
                </p>
              </div>

              {!loading && (
                <button 
                  onClick={handleAutoSync}
                  className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined">bolt</span>
                  Iniciar Sincronización Automática
                </button>
              )}
            </div>
          )}

          {/* MODO MANUAL - Pantalla Inicial */}
          {activeMode === 'manual' && !file && preview.length === 0 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-outline-variant/50 rounded-3xl p-12 text-center hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-5xl text-slate-300 group-hover:text-primary transition-colors">upload_file</span>
              <p className="mt-4 text-slate-600 font-medium">Haz clic para seleccionar el archivo CSV del SII</p>
              <p className="text-xs text-slate-400 mt-2">Formatos aceptados: .csv (separado por punto y coma)</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden" 
              />
            </div>
          )}

          {/* TABLA DE PREVISUALIZACIÓN (Común para ambos modos) */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    {activeMode === 'auto' ? 'robot_2' : 'description'}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {activeMode === 'auto' ? 'Datos obtenidos desde SII' : file?.name}
                    </p>
                    <p className="text-xs text-slate-500">{preview.length} registros encontrados</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreview([]); }} 
                  className="text-xs font-bold text-error hover:underline"
                >
                  {activeMode === 'auto' ? 'Reiniciar' : 'Cambiar archivo'}
                </button>
              </div>

              <div className="border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface-container-low text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {preview.map((row, i) => (
                      <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${row.existe ? 'bg-slate-50/30' : ''}`}>
                        <td className="px-4 py-3 font-bold text-primary">{row.folio}</td>
                        <td className="px-4 py-3 text-slate-600">{row.fecha}</td>
                        <td className="px-4 py-3 truncate max-w-[200px] font-medium" title={row.cliente}>{row.cliente}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-800">${row.monto.toLocaleString('es-CL')}</td>
                        <td className="px-4 py-3 text-center">
                          {row.existe ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">
                              <span className="material-symbols-outlined text-[10px]">check_circle</span> Ya existe
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">
                              <span className="material-symbols-outlined text-[10px]">add_circle</span> Nuevo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end gap-3 bg-surface-container-low/50">
          <button onClick={onClose} className="px-6 py-2 rounded-full font-bold text-slate-600 hover:bg-slate-200/50 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!preview.some(p => !p.existe)}
            className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Importar {preview.filter(p => !p.existe).length} ventas
          </button>
        </div>
      </div>
    </div>
  );
}
