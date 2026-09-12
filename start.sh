#!/bin/bash
# ============================================
# PymEdu - Script de Inicio
# ============================================

echo "🚀 Iniciando PymEdu..."

# Instalar dependencias del servidor si es necesario
if [ ! -d "node_modules" ]; then
  echo "📥 Instalando dependencias..."
  npm install
fi

# Iniciar servidor API en background
echo "🔧 Iniciando servidor API..."
npm run server &
SERVER_PID=$!

# Esperar a que el servidor esté listo
sleep 3

echo ""
echo "============================================"
echo "  ✅ PymEdu está ejecutándose!"
echo "============================================"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:4000"
echo ""
echo "  Base de datos: Supabase (remota)"
echo "  (configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env)"
echo ""
echo "  Cuentas demo:"
echo "    - supadmin@pymedu.com / demo123"
echo "    - admin@colegiosanjose.cl / demo123"
echo "    - coord@colegiosanjose.cl / demo123"
echo "    - mentor@colegiosanjose.cl / demo123"
echo "    - emprendedor@pymedu.com / demo123"
echo ""
echo "  Presiona Ctrl+C para detener todo"
echo "============================================"

# Manejar señal de interrupción
trap "echo '🛑 Deteniendo servicios...'; kill $SERVER_PID; exit 0" INT TERM

# Mantener el script ejecutándose
wait
