"use client";

/**
 * Componente de prueba para verificar que SVG se renderiza correctamente
 * Este es un gráfico minimalista para debug
 */
export default function TestChart() {
  const data = [10, 25, 15, 30, 20, 35, 28, 40];
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Test de Gráfico SVG</h1>
        
        {/* Test 1: SVG Simple */}
        <div className="card-modern p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. SVG Básico</h2>
          <div className="h-64 bg-gray-100 rounded-xl">
            <svg viewBox="0 0 400 200" className="w-full h-full block">
              <rect width="400" height="200" fill="#f3f4f6" />
              <line x1="50" y1="100" x2="350" y2="100" stroke="#d1d5db" strokeWidth="2" />
              <circle cx="200" cy="100" r="10" fill="#3b82f6" />
              <text x="200" y="120" textAnchor="middle" fill="#374151" fontSize="12">
                Si ves esto, SVG funciona
              </text>
            </svg>
          </div>
        </div>

        {/* Test 2: SVG con Path */}
        <div className="card-modern p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. SVG con Línea de Datos</h2>
          <div className="h-64 bg-gray-100 rounded-xl">
            <svg viewBox="0 0 400 200" className="w-full h-full block">
              <rect width="400" height="200" fill="#f3f4f6" />
              {/* Grid */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="100" x2="400" y2="100" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="150" x2="400" y2="150" stroke="#e5e7eb" strokeWidth="1" />
              
              {/* Línea de datos */}
              <path
                d={data.map((value, i) => {
                  const x = 50 + (i / (data.length - 1)) * 300;
                  const y = 150 - (value / 40) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Puntos */}
              {data.map((value, i) => {
                const x = 50 + (i / (data.length - 1)) * 300;
                const y = 150 - (value / 40) * 100;
                return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />;
              })}
            </svg>
          </div>
        </div>

        {/* Test 3: Información del navegador */}
        <div className="card-modern p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Información del Sistema</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
            <div><strong>Pantalla:</strong> {typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'N/A'}</div>
            <div><strong>DevicePixelRatio:</strong> {typeof window !== 'undefined' ? window.devicePixelRatio : 'N/A'}</div>
            <div><strong>SVG Support:</strong> {typeof document !== 'undefined' && document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? '✅ Sí' : '❌ No'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
