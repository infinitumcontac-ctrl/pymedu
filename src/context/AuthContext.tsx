import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type Rol =
  | 'superadmin'
  | 'admin_institucional'
  | 'coordinador'
  | 'mentor'
  | 'emprendedor'
  | 'dueño'
  | 'vendedor'
  | 'gestor'
  | 'encargado_rrhh'
  | 'empleado'
  | 'contador_externo'
  | 'demo';

export interface Perfil {
  id: string;
  email: string;
  nombre_completo: string;
  rol: Rol;
  institucion_id?: string;
  reporta_a?: string;
  membresia_nivel: 'free' | 'pro' | 'premium';
  membresia_expira?: string | null;
  segmento_negocio: 'A' | 'B' | 'C';
  acceso_revocado_at?: string | null;
  puede_ver_remuneraciones?: boolean;
  puede_ver_caja?: boolean;
  puede_ver_reportes?: boolean;
  puede_crear_ventas?: boolean;
  puede_crear_gastos?: boolean;
  negocio_nombre?: string;
  negocio_rut?: string;
  negocio_rubro?: string;
  logo_url?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  perfil: Perfil | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<Perfil>;
  signOut: () => Promise<void>;
  puedeHacer: (permiso: string) => boolean;
  recargarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, perfil: null, isLoading: true,
  signIn: async () => { throw new Error('AuthContext no inicializado'); },
  signOut: async () => {},
  puedeHacer: () => false,
  recargarPerfil: async () => {},
});

async function cargarPerfil(userId: string): Promise<Perfil> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    const e = new Error(`Perfil no encontrado (${error.code ?? '?'}: ${error.message})`) as Error & { code?: string };
    e.code = error.code ?? 'PERFIL_NOT_FOUND';
    throw e;
  }
  if (!data) {
    throw new Error('Perfil no encontrado (sin fila para el id)');
  }
  if (data.acceso_revocado_at) {
    throw new Error('Acceso revocado');
  }
  return data as Perfil;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const aplicarSession = async (session: { user: { id: string; email?: string } | null; access_token?: string | null } | null) => {
      if (session?.access_token) {
        localStorage.setItem('pymedu_token', session.access_token);
      }
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email ?? '' };
        try {
          const p = await cargarPerfil(u.id);
          if (!active) return;
          setUser(u);
          setPerfil(p);
        } catch {
          if (!active) return;
          setUser(null);
          setPerfil(null);
          supabase.auth.signOut();
        }
      } else {
        localStorage.removeItem('pymedu_token');
        setUser(null);
        setPerfil(null);
      }
      if (active) setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => aplicarSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      aplicarSession(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<Perfil> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      if (error?.code === 'email_not_confirmed') {
        const err = new Error('Debes confirmar tu correo antes de iniciar sesión') as Error & { code?: string };
        err.code = 'email_not_confirmed';
        throw err;
      }
      throw new Error(error?.message || 'Credenciales inválidas');
    }
    const p = await cargarPerfil(data.user.id);
    if (data.session) {
      localStorage.setItem('pymedu_token', data.session.access_token);
    }
    setUser({ id: data.user.id, email: data.user.email ?? '' });
    setPerfil(p);
    setIsLoading(false);
    return p;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('pymedu_token');
    setUser(null);
    setPerfil(null);
  };

  const recargarPerfil = async () => {
    if (!user) return;
    try {
      setPerfil(await cargarPerfil(user.id));
    } catch {
      // mantiene el perfil actual si la recarga falla
    }
  };

  const puedeHacer = (permiso: string): boolean => {
    if (!perfil) return false;
    if (perfil.rol === 'superadmin') return true;
    if (perfil.rol === 'admin_institucional') return true;
    if (perfil.rol === 'demo') return true;

    const flags = {
      'crear_ventas': perfil.puede_crear_ventas ?? true,
      'crear_gastos': perfil.puede_crear_gastos ?? true,
      'ver_caja': perfil.puede_ver_caja ?? true,
      'ver_reportes': perfil.puede_ver_reportes ?? true,
      'ver_remuneraciones': perfil.puede_ver_remuneraciones ?? true,
    } as Record<string, boolean | undefined>;

    switch (perfil.rol) {
      case 'coordinador':
        return ['ver_mentores', 'ver_emprendedores', 'gestionar_programas'].includes(permiso);
      case 'mentor':
        return ['ver_mis_emprendedores', 'editar_seguimiento', 'ver_academia'].includes(permiso);
      case 'emprendedor':
      case 'dueño':
        // El dueño del negocio siempre puede registrar ventas y gastos.
        // (El esquema de Supabase los creaba en false al registrarse, ocultando
        // 'Ventas' y 'Compras y gastos' del menu ERP para cuentas nuevas.)
        if (permiso === 'crear_ventas' || permiso === 'crear_gastos') return true;
        if (typeof flags[permiso] === 'boolean') return flags[permiso];
        return [
          'ver_mi_perfil', 'editar_mi_negocio', 'ver_academia',
          'ver_inventario', 'ver_clientes', 'ver_proveedores',
          'ver_promociones', 'ver_equipo', 'ver_organigrama',
          'ver_documentos', 'ver_mercados_publicos', 'ver_mentorias',
        ].includes(permiso);
      case 'vendedor':
        return ['crear_ventas', 'ver_clientes', 'ver_mi_perfil'].includes(permiso);
      case 'gestor':
        return [
          'crear_ventas', 'crear_gastos', 'ver_inventario', 'ver_caja',
          'ver_clientes', 'ver_proveedores', 'ver_promociones', 'ver_reportes',
          'ver_mi_perfil', 'ver_academia',
        ].includes(permiso);
      case 'encargado_rrhh':
        return [
          'ver_remuneraciones', 'editar_remuneraciones', 'ver_empleados',
          'ver_equipo', 'ver_organigrama', 'ver_documentos', 'ver_mi_perfil',
        ].includes(permiso);
      case 'empleado':
        return ['ver_mi_perfil', 'ver_remuneraciones', 'ver_academia'].includes(permiso);
      case 'contador_externo':
        return [
          'ver_caja', 'ver_reportes', 'ver_reportes_fiscales', 'ver_contabilidad',
          'ver_clientes', 'ver_proveedores', 'ver_inventario', 'ver_mi_perfil',
        ].includes(permiso);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, perfil, isLoading, signIn, signOut, puedeHacer, recargarPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
