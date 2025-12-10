export default function SensorDataTable({ data, sensorType }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-dashed border-slate-700 text-center flex flex-col items-center justify-center gap-3">
        <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-slate-400 font-medium">No se encontraron datos para mostrar</p>
      </div>
    );
  }

  // Define columns based on sensor type
  const renderTableHeaders = () => {
    const commonHeaders = (
      <>
        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
          Sensor
        </th>
        <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
          Fecha y Hora
        </th>
      </>
    );

    if (sensorType === 'air') {
      return (
        <>
          {commonHeaders}
          <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">
            CO2 (ppm)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-orange-300 uppercase tracking-wider">
            Temp (°C)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Humedad (%)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">
            Presión (hPa)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ubicación
          </th>
        </>
      );
    } else if (sensorType === 'sound') {
      return (
        <>
          {commonHeaders}
          <th className="px-6 py-4 text-left text-xs font-bold text-red-300 uppercase tracking-wider">
            LAeq (dB)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-yellow-300 uppercase tracking-wider">
            LAI (dB)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-wider">
            LAImax (dB)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-green-300 uppercase tracking-wider">
            Batería (%)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ubicación
          </th>
        </>
      );
    } else if (sensorType === 'underground') {
      return (
        <>
          {commonHeaders}
          <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Distancia (mm)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">
            Estado
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider">
            Posición
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-green-300 uppercase tracking-wider">
            Batería (%)
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ubicación
          </th>
        </>
      );
    }

    return commonHeaders;
  };

  const renderTableRow = (record, index) => {
    const commonCells = (
      <>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
          {record.sensor_name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
          {new Date(record.time).toLocaleString()}
        </td>
      </>
    );

    if (sensorType === 'air') {
      return (
        <tr
          key={index}
          className="hover:bg-white/5 transition-colors duration-150 border-b border-white/5 last:border-0"
        >
          {commonCells}
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-400 tabular-nums">
            {record.co2_ppm?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-400 tabular-nums">
            {record.temperatura_c?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-400 tabular-nums">
            {record.humedad_percent?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-400 tabular-nums">
            {record.presion_hpa?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
            {record.ubicacion || '-'}
          </td>
        </tr>
      );
    } else if (sensorType === 'sound') {
      return (
        <tr
          key={index}
          className="hover:bg-white/5 transition-colors duration-150 border-b border-white/5 last:border-0"
        >
          {commonCells}
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400 tabular-nums">
            {record.laeq_db?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-yellow-400 tabular-nums">
            {record.lai_db?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-pink-400 tabular-nums">
            {record.laimax_db?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400 tabular-nums">
            {record.bateria_percent?.toFixed(0) || '-'}%
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
            {record.ubicacion || '-'}
          </td>
        </tr>
      );
    } else if (sensorType === 'underground') {
      return (
        <tr
          key={index}
          className="hover:bg-white/5 transition-colors duration-150 border-b border-white/5 last:border-0"
        >
          {commonCells}
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-400 tabular-nums">
            {record.distancia_mm?.toFixed(2) || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
             <span className={`px-2 py-1 rounded-full text-xs border ${
                record.estado === 'Lleno' 
                ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
             }`}>
                {record.estado || '-'}
             </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
            {record.posicion || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400 tabular-nums">
            {record.bateria_percent?.toFixed(0) || '-'}%
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
            {record.ubicacion || '-'}
          </td>
        </tr>
      );
    }

    return null;
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden shadow-inner">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-950/50 border-b border-white/10">
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((record, index) => renderTableRow(record, index))}
          </tbody>
        </table>
      </div>

      {/* Footer info in table */}
      {data.length > 0 && (
         <div className="bg-slate-950/30 px-6 py-3 border-t border-white/5 flex justify-end">
            <span className="text-xs text-slate-500 font-mono">
               Renderizado: {new Date().toLocaleTimeString()}
            </span>
         </div>
      )}
    </div>
  );
}
