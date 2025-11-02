import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ServiceReport, VisitReport } from '../types';

type OutputType = 'save' | 'datauristring';

// --- HELPER FUNCTIONS ---

/**
 * Fetches an image from a URL and converts it to a base64 data string.
 * This method uses the `fetch` API to avoid CORS issues that can occur
 * when loading images directly onto a canvas from a different origin.
 * @param url The URL of the image to fetch.
 * @returns A Promise that resolves with the base64 data URL.
 */
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  try {
    // Use fetch to get the image data, which is more robust with CORS.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    
    // Use FileReader to convert the blob to a base64 data URL.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error('FileReader failed to produce a result.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error in getBase64ImageFromUrl for URL: ${url}`, error);
    // Rethrow to be caught by the caller
    throw error;
  }
};


const addHeaderAndFooter = async (doc: jsPDF, logoUrl: string, title: string) => {
    let logoDataUrl: string | null = null;
    if (logoUrl) {
        try {
            // Fetch the image and convert it to base64
            logoDataUrl = await getBase64ImageFromUrl(logoUrl);
        } catch (e) {
            console.error("Failed to fetch or convert logo URL to base64:", e);
        }
    }

    // FIX: Property 'getNumberOfPages' does not exist on type '{...}'. Cast to 'any' to bypass inaccurate type definitions.
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // HEADER
        if (logoDataUrl) {
            try {
                 // Use the fetched base64 data URL
                 doc.addImage(logoDataUrl, 'PNG', 15, 10, 30, 15, undefined, 'FAST');
            } catch (e) {
                console.error("Could not add logo to PDF header:", e);
                doc.text("Logo", 15, 15); // Fallback text
            }
        } else {
            doc.text("Logo", 15, 15); // Fallback if no logoUrl or fetch failed
        }
       
        doc.setFontSize(14).setFont(undefined, 'bold');
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

        // FOOTER
        doc.setFontSize(8);
        const pageStr = `Página ${i} de ${pageCount}`;
        doc.text(pageStr, doc.internal.pageSize.getWidth() / 2, 287, { align: 'center' });
    }
};

const addImageGallery = (doc: jsPDF, images: string[] | undefined, startY: number): number => {
    if (!images || images.length === 0) return startY;

    const margin = 15;
    const padding = 5;
    const imgWidth = (doc.internal.pageSize.width - (2 * margin) - (2 * padding)) / 3;
    const imgHeight = 40;
    const pageHeight = doc.internal.pageSize.height;
    let x = margin;
    let y = startY;

    images.forEach((imgData, index) => {
        if (y + imgHeight + padding > pageHeight - 20) { // Check for footer space
            doc.addPage();
            y = 20;
            x = margin;
        }

        try {
            // Extract format from base64 string, default to JPEG
            const format = (imgData.match(/data:image\/(.+);base64,/) || [,'jpeg'])[1].toUpperCase();
            doc.addImage(imgData, format, x, y, imgWidth, imgHeight, undefined, 'FAST');
        } catch (e) {
            doc.text('Error al cargar imagen', x + 5, y + 20);
            console.error("Error adding image to PDF", e);
        }
        
        x += imgWidth + padding;
        if ((index + 1) % 3 === 0 && index < images.length - 1) {
            x = margin;
            y += imgHeight + padding;
        }
    });
    
    // Return the Y position after the last row of images
    return y + imgHeight + padding;
};

// --- MAIN PDF GENERATORS ---

export const generateServiceReport = async (
    report: Partial<ServiceReport>, 
    logoUrl: string, 
    outputType: OutputType = 'save'
): Promise<string | void> => {
    const doc = new jsPDF();
    const pageContentStartY = 30;
    let finalY = pageContentStartY;

    // --- DETAILS TABLE ---
    autoTable(doc, {
        startY: finalY,
        body: [
            [{ content: 'CLIENTE', styles: { fontStyle: 'bold' } }, report.empresa?.nombre ?? 'N/A', { content: 'CÓDIGO', styles: { fontStyle: 'bold' } }, report.codigo_reporte ?? 'N/A'],
            [{ content: 'RESPONSABLE', styles: { fontStyle: 'bold' } }, `${report.encargado?.nombre ?? ''} ${report.encargado?.apellido ?? ''}`.trim() || 'N/A', { content: 'FECHA', styles: { fontStyle: 'bold' } }, report.fecha ? new Date(report.fecha + 'T00:00:00Z').toLocaleDateString('es-ES') : 'N/A'],
            [{ content: 'PLANTA / SEDE', styles: { fontStyle: 'bold' } }, report.nombre_planta ?? 'N/A', { content: 'HORAS', styles: { fontStyle: 'bold' } }, `E: ${report.entrada ?? '--:--'} - S: ${report.salida ?? '--:--'}`],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
    });
    finalY = (doc as any).lastAutoTable.finalY;
    
    autoTable(doc, {
        startY: finalY + 2,
        body: [
            [{ content: 'N° SERIE', styles: { fontStyle: 'bold' } }, report.serie_maquina ?? 'N/A', { content: 'MODELO', styles: { fontStyle: 'bold' } }, report.modelo_maquina ?? 'N/A'],
            [{ content: 'MARCA', styles: { fontStyle: 'bold' } }, report.marca_maquina ?? 'N/A', { content: 'LINEA', styles: { fontStyle: 'bold' } }, report.linea_maquina ?? 'N/A'],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
    });

    finalY = (doc as any).lastAutoTable.finalY;

    // --- DYNAMIC SECTIONS HELPER ---
    const drawSection = (title: string, content: string | undefined, images: string[] | undefined) => {
        // Check if there is enough space, otherwise add a new page.
        // 20 for header, 20 for footer, 10 for table header, 10 for text, 45 for one row of images
        if (finalY > doc.internal.pageSize.height - 105) { doc.addPage(); finalY = pageContentStartY; }
        
        autoTable(doc, {
            startY: finalY + 5,
            head: [[title]],
            headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#333' },
            body: [[content || 'N/A']],
            theme: 'grid',
            didDrawPage: (data) => { finalY = data.cursor?.y ?? finalY; }
        });
        finalY = (doc as any).lastAutoTable.finalY;

        if (images && images.length > 0) {
            finalY = addImageGallery(doc, images, finalY + 3);
        }
    };

    drawSection('PROBLEMAS ENCONTRADOS', report.problemas_encontrados, report.fotosProblemasBase64);
    drawSection('ACCIONES REALIZADAS', report.acciones_realizadas, report.fotosAccionesBase64);
    drawSection('OBSERVACIONES', report.observaciones, report.fotosObservacionesBase64);
    
    // --- FINAL STATUS TABLE ---
    if (finalY > doc.internal.pageSize.height - 50) { doc.addPage(); finalY = pageContentStartY; }
    autoTable(doc, {
        startY: finalY + 5,
        head: [[{ content: 'ESTADO FINAL', colSpan: 6, styles: { halign: 'center', fillColor: '#EAEAEA', textColor: '#333' } }]],
        body: [
            [
                'OPERATIVO', `(${report.operativo || report.estado_maquina === 'operativo' ? 'X' : ' '})`,
                'INOPERATIVO', `(${report.inoperativo || report.estado_maquina === 'inoperativo' ? 'X' : ' '})`,
                'EN PRUEBA', `(${report.en_prueba || report.estado_maquina === 'en_prueba' ? 'X' : ' '})`,
            ]
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5, halign: 'center' },
        didDrawPage: (data) => { finalY = data.cursor?.y ?? finalY; }
    });
    finalY = (doc as any).lastAutoTable.finalY;

    // --- SIGNATURES ---
    if (finalY > doc.internal.pageSize.height - 60) { doc.addPage(); finalY = pageContentStartY; }
    
    // Add signature image first to get its position
    if (report.fotoFirmaBase64) {
        try {
            const format = (report.fotoFirmaBase64.match(/data:image\/(.+);base64,/) || [,'jpeg'])[1].toUpperCase();
            doc.addImage(report.fotoFirmaBase64, format, 120, finalY + 10, 60, 20, undefined, 'FAST');
        } catch(e) { console.error("Could not add signature image", e); }
    }

    autoTable(doc, {
        startY: finalY + 5,
        body: [
            [{ content: `REALIZADO POR:\n${report.usuario?.nombres ?? 'N/A'}`, styles: { halign: 'center', } }, { content: `CONFORMIDAD CLIENTE:\n${report.nombre_firmante ?? 'N/A'}`, styles: { halign: 'center' } }],
        ],
        theme: 'grid',
        styles: { minCellHeight: 35, valign: 'bottom', fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { lineWidth: 0.1, lineColor: '#fff' }, // hide all but top line
        didParseCell: (data) => {
            if (data.row.index === 0) {
                data.cell.styles.lineColor = '#000';
            }
        }
    });

    // --- ADD HEADERS AND FOOTERS TO ALL PAGES ---
    await addHeaderAndFooter(doc, logoUrl, 'REPORTE DE SERVICIO');
    
    if (outputType === 'save') {
        doc.save(`reporte-servicio-${report.codigo_reporte || 'NUEVO'}.pdf`);
    } else {
        return doc.output('datauristring');
    }
};

export const generateVisitReport = async (
    report: Partial<VisitReport>,
    logoUrl: string,
    outputType: OutputType = 'save'
): Promise<string | void> => {
    const doc = new jsPDF();
    const pageContentStartY = 30;
    let finalY = pageContentStartY;

    // --- DETAILS TABLE ---
     autoTable(doc, {
        startY: finalY,
        body: [
            [{ content: 'CLIENTE', styles: { fontStyle: 'bold' } }, report.empresa ?? 'N/A'],
            [{ content: 'PLANTA / SEDE', styles: { fontStyle: 'bold' } }, report.planta ?? 'N/A'],
            [{ content: 'FECHA', styles: { fontStyle: 'bold' } }, report.fecha ? new Date(report.fecha + 'T00:00:00Z').toLocaleDateString('es-ES') : 'N/A'],
            [{ content: 'HORAS', styles: { fontStyle: 'bold' } }, `Ingreso: ${report.hora_ingreso ?? '--:--'} - Salida: ${report.hora_salida ?? '--:--'}`],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 40 } },
    });
    finalY = (doc as any).lastAutoTable.finalY;
    
    // --- CONTACTS TABLE ---
    autoTable(doc, {
        startY: finalY + 2,
        head: [[{ content: 'CONTACTOS', colSpan: 2, styles: { halign: 'center', fillColor: '#EAEAEA', textColor: '#333' } }]],
        body: [
            ['Encargado de Planta', `${report.nombre_encargado || 'N/A'} | Cel: ${report.celular_encargado || 'N/A'} | Email: ${report.email_encargado || 'N/A'}`],
            ['Operador de Máquina', `${report.nombre_operador || 'N/A'} | Cel: ${report.celular_operador || 'N/A'}`],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
    });
    finalY = (doc as any).lastAutoTable.finalY;


    // --- CHECKLIST & MACHINES ---
    if (finalY > doc.internal.pageSize.height - 60) { doc.addPage(); finalY = pageContentStartY; }
    autoTable(doc, {
        startY: finalY + 5,
        head: [[{ content: 'CHECKLIST TÉCNICO', colSpan: 6, styles: { halign: 'center', fillColor: '#EAEAEA', textColor: '#333' } }]],
        body: [[
            'Voltaje Estable', `(${report.voltaje_establecido ? 'SI' : 'NO'})`,
            'Presurización', `(${report.presurizacion ? 'SI' : 'NO'})`,
            'Transformador', `(${report.transformador ? 'SI' : 'NO'})`,
        ]],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5, halign: 'center' },
    });
    finalY = (doc as any).lastAutoTable.finalY;

    if (report.selected_maquinas_pdf && report.selected_maquinas_pdf.length > 0) {
        if (finalY > doc.internal.pageSize.height - 80) { // Check space for table header and at least one row
            doc.addPage();
            finalY = pageContentStartY;
        }
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Máquina (Serie / Modelo / Marca)', 'Observaciones']],
            body: report.selected_maquinas_pdf.map(item => [item.machineLabel, item.observations]),
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 'auto' } },
            didDrawPage: (data) => {
                if (data.pageNumber > doc.internal.pages.length) {
                  finalY = pageContentStartY;
                }
            }
        });
        finalY = (doc as any).lastAutoTable.finalY;
    } else {
        autoTable(doc, {
            startY: finalY + 5,
            head: [['MÁQUINAS ATENDIDAS']],
            body: report.maquinas && report.maquinas.length > 0 ? report.maquinas.map(m => [m]) : [['N/A']],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2 },
        });
        finalY = (doc as any).lastAutoTable.finalY;
    }

    // Start subsequent content on a new page.
    doc.addPage();
    finalY = pageContentStartY;


    // --- DYNAMIC SECTIONS HELPER ---
    const drawSection = (title: string, content: string | undefined, images: string[] | undefined) => {
         if (finalY > doc.internal.pageSize.height - 105) { doc.addPage(); finalY = pageContentStartY; }
        autoTable(doc, {
            startY: finalY + 5,
            head: [[title]],
            headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#333' },
            body: [[content || (images && images.length > 0 ? '' : 'N/A')]],
            theme: 'grid',
            didDrawPage: (data) => { finalY = data.cursor?.y ?? finalY; }
        });
        finalY = (doc as any).lastAutoTable.finalY;
        if (images && images.length > 0) {
            finalY = addImageGallery(doc, images, finalY + 3);
        }
    };
    
    drawSection('OBSERVACIONES / FOTOS GENERALES', undefined, report.fotosObservacionesBase64);
    drawSection('SUGERENCIAS', report.sugerencias, report.fotosSugerenciasBase64);

    // --- SIGNATURES ---
    if (finalY > doc.internal.pageSize.height - 60) { doc.addPage(); finalY = pageContentStartY; }
    
    if (report.fotoFirmaBase64) {
        try {
            const format = (report.fotoFirmaBase64.match(/data:image\/(.+);base64,/) || [,'jpeg'])[1].toUpperCase();
            doc.addImage(report.fotoFirmaBase64, format, 120, finalY + 10, 60, 20, undefined, 'FAST');
        } catch(e) { console.error("Could not add signature image", e); }
    }

     autoTable(doc, {
        startY: finalY + 5,
        body: [
            [{ content: `REALIZADO POR:\n${report.usuario?.nombres ?? 'N/A'}`, styles: { halign: 'center' } }, { content: `CONFORMIDAD CLIENTE:\n${report.nombre_encargado ?? 'N/A'}`, styles: { halign: 'center' } }],
        ],
        theme: 'grid',
        styles: { minCellHeight: 35, valign: 'bottom', fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { lineWidth: 0.1, lineColor: '#fff' },
        didParseCell: (data) => {
            if (data.row.index === 0) {
                data.cell.styles.lineColor = '#000';
            }
        }
    });
    
    await addHeaderAndFooter(doc, logoUrl, 'REPORTE DE VISITA');

    if (outputType === 'save') {
        doc.save(`reporte-visita-${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
        return doc.output('datauristring');
    }
};