const TICKET = import.meta.env.VITE_MERCADO_PUBLICO_TICKET || '1C04EA61-2DF0-41EC-B56B-F84B67158915';
const BASE_URL = 'https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json';

export interface LicitacionAPI {
  CodigoExterno: string;
  Nombre: string;
  CodigoEstado: number;
  FechaCierre?: string;
}

export interface DetalleLicitacionAPI {
  CodigoExterno: string;
  Nombre: string;
  CodigoEstado: number;
  Descripcion: string;
  FechaCierre: string;
  Estado: string;
  Comprador: {
    NombreOrganismo: string;
    RegionUnidad: string;
  };
  MontoEstimado?: number;
  Items: {
    Listado: Array<{
      NombreProducto: string;
    }>;
  };
}

export const mercadoPublicoService = {
  async getLicitacionesHoy(page = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${BASE_URL}?estado=activas&ticket=${TICKET}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Error fetching licitaciones');
      const data = await response.json();
      return (data.Listado || []) as LicitacionAPI[];
    } catch (error) {
      console.error('Error in getLicitacionesHoy:', error);
      return [];
    }
  },

  async getDetalleLicitacion(codigo: string, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout per attempt

        const response = await fetch(`${BASE_URL}?codigo=${codigo}&ticket=${TICKET}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.Listado && data.Listado.length > 0) {
          return data.Listado[0] as DetalleLicitacionAPI;
        }
        
        // If we get an empty list but no error, maybe it's a temporary API glitch
        if (i < retries) await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${codigo}:`, error);
        if (i === retries) return null;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    return null;
  }
};
