export function exportToCSV(data, filename = "reporte_fichajes.csv") {
  if (!data || data.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  // Definir cabeceras
  const headers = [
    "ID Fichaje",
    "ID Empleado",
    "Fecha",
    "Hora Entrada",
    "Hora Salida",
    "Total Horas",
    "Notas"
  ];

  // Mapear filas usando punto y coma (;) como separador
  const rows = data.map((entry) => {
    const clockInDate = new Date(entry.clock_in);
    const clockOutDate = entry.clock_out ? new Date(entry.clock_out) : null;

    const fecha = clockInDate.toLocaleDateString();
    const horaEntrada = clockInDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const horaSalida = clockOutDate 
      ? clockOutDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) 
      : "En curso";
    
    // Formatear horas (con coma decimal si es para Excel en español)
    const totalHoras = entry.total_hours != null ? entry.total_hours.toFixed(2).replace(".", ",") : "0,00";
    const notas = entry.note ? `"${entry.note.replace(/"/g, '""')}"` : '""';

    return [
      entry.id,
      entry.user_id,
      `"${fecha}"`,
      `"${horaEntrada}"`,
      `"${horaSalida}"`,
      `"${totalHoras}"`,
      notas
    ].join(";");
  });

  // 'sep=;\n' le indica explícitamente a Excel qué separador usar en cualquier idioma
  const csvContent = "\uFEFFsep=;\n" + [headers.join(";"), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Disparar descarga
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}