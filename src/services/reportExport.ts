import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Reading } from './bloodPressure'
import type { Profile } from './profile'

/**
 * Exporta los datos a un archivo CSV.
 */
export function exportToCSV(readings: Reading[], profile: Profile | null) {
  const headers = ['Fecha', 'Hora', 'Sistólica (mmHg)', 'Diastólica (mmHg)', 'Pulso (bpm)']
  const rows = readings.map(r => [
    format(new Date(r.created_at), 'yyyy-MM-dd'),
    format(new Date(r.created_at), 'HH:mm'),
    r.sistolica,
    r.diastolica,
    r.pulso
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  const fileName = profile?.nombre 
    ? `Reporte_${profile.nombre.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`
    : `BPMonitor_${format(new Date(), 'yyyyMMdd')}.csv`

  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Carga una imagen de forma asíncrona para usar en el PDF.
 */
async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error("[Report] 🔥 Error al cargar imagen:", url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Exporta un reporte médico profesional en formato PDF.
 */
export async function exportToPDF(readings: Reading[], profile: Profile | null, userEmail: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // 1. Encabezado
  doc.setFontSize(22)
  doc.setTextColor(15, 23, 42) // Slate 900
  doc.text('Reporte de Presión Arterial', margin, 25)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // Slate 500
  doc.text(`Generado el: ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`, margin, 32)
  
  // 1.5 Foto de Perfil (Si existe)
  if (profile?.avatar_url) {
    const avatarImg = await loadImage(profile.avatar_url);
    if (avatarImg) {
      // Dibujar avatar redondo
      const avatarSize = 25;
      const avatarX = pageWidth - margin - avatarSize;
      const avatarY = 15;
      
      doc.saveGraphicsState();
      // Dibujar imagen (borde cuadrado elegante en esta versión para máxima compatibilidad)
      doc.addImage(avatarImg, 'PNG', avatarX, avatarY, avatarSize, avatarSize);
      doc.restoreGraphicsState();
      
      // Dibujar un borde elegante
      doc.setDrawColor(226, 232, 240);
      doc.rect(avatarX, avatarY, avatarSize, avatarSize);
    }
  }

  doc.setDrawColor(226, 232, 240) // Slate 200
  doc.line(margin, 42, pageWidth - margin, 42)

  // 2. Información del Paciente
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text('Información del Paciente', margin, 54)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const patientName = profile?.nombre || 'No especificado'
  const doctorName = profile?.nombre_medico || 'No especificado'
  
  doc.text(`Nombre: ${patientName}`, margin, 62)
  doc.text(`Email: ${userEmail}`, margin, 68)
  doc.text(`Médico: ${doctorName}`, margin, 74)

  // 3. Resumen Estadístico y Periodo
  if (readings.length > 0) {
    const sortedReadings = [...readings].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const startDate = sortedReadings[0].created_at
    const endDate = sortedReadings[sortedReadings.length - 1].created_at

    const avgSis = Math.round(readings.reduce((acc, curr) => acc + curr.sistolica, 0) / readings.length)
    const avgDia = Math.round(readings.reduce((acc, curr) => acc + curr.diastolica, 0) / readings.length)
    const maxSis = Math.max(...readings.map(r => r.sistolica))
    const minDia = Math.min(...readings.map(r => r.diastolica))

    doc.setFont('helvetica', 'bold')
    doc.text('Resumen del Periodo', pageWidth / 2 + 10, 54)
    doc.setFont('helvetica', 'normal')
    
    // Rango de fechas
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    const periodText = `Periodo: ${format(new Date(startDate), "d MMM", { locale: es })} - ${format(new Date(endDate), "d MMM, yyyy", { locale: es })}`
    doc.text(periodText, pageWidth / 2 + 10, 60)
    
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(`Promedio Sistólica: ${avgSis} mmHg`, pageWidth / 2 + 10, 68)
    doc.text(`Promedio Diastólica: ${avgDia} mmHg`, pageWidth / 2 + 10, 74)
    doc.text(`Rango observado: ${maxSis}/${minDia} mmHg (Máx/Mín)`, pageWidth / 2 + 10, 80)
  }

  // 4. Captura de la Gráfica
  const chartElement = document.getElementById('bp-chart-container')
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = pageWidth - (margin * 2)
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      const chartY = 90
      doc.addImage(imgData, 'PNG', margin, chartY, imgWidth, imgHeight)
      
      // Ajustar la posición de la tabla según la altura de la imagen
      const tableStartY = chartY + imgHeight + 15
      
      // 5. Tabla de Historial
      autoTable(doc, {
        startY: tableStartY,
        head: [['Fecha', 'Hora', 'Sis', 'Dia', 'Pulso', 'Estado']],
        body: readings.map(r => [
          format(new Date(r.created_at), 'dd/MM/yyyy'),
          format(new Date(r.created_at), 'HH:mm'),
          r.sistolica,
          r.diastolica,
          r.pulso,
          r.sistolica >= 140 || r.diastolica >= 90 ? 'Alta' :
          r.sistolica < 120 && r.diastolica < 80 ? 'Normal' : 'Elevada'
        ]),
        headStyles: { fillColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        didDrawPage: () => {
          // Footer en cada página
          doc.setFontSize(8)
          doc.setTextColor(148, 163, 184)
          doc.text(
            'Este reporte es informativo. No sustituye el diagnóstico de un profesional médico.',
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          )
        }
      })
    } catch (error) {
      console.error("Error al capturar la gráfica para el PDF:", error)
      // Si falla la gráfica, solo mostramos la tabla
      autoTable(doc, {
        startY: 90,
        head: [['Fecha', 'Hora', 'Sis', 'Dia', 'Pulso']],
        body: readings.map(r => [
          format(new Date(r.created_at), 'dd/MM/yyyy'),
          format(new Date(r.created_at), 'HH:mm'),
          r.sistolica,
          r.diastolica,
          r.pulso
        ]),
        headStyles: { fillColor: [15, 23, 42] }
      })
    }
  }

  // Limpiar el nombre del paciente para el nombre del archivo (quitar acentos y caracteres raros)
  const sanitizedName = (profile?.nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, '_')
    .slice(0, 30);

  const timestamp = format(new Date(), 'yyyy-MM-dd')
  const baseFileName = sanitizedName || 'Reporte_Salud'
  const finalFileName = `${baseFileName}_${timestamp}.pdf`

  console.log("[Report] 💾 Guardando PDF profesional:", finalFileName)
  
  // Usar doc.save nativo tras limpiar el nombre, es el método más compatible 
  // si el entorno está "sano" (como en la ventana de incógnito)
  doc.save(finalFileName)
}
