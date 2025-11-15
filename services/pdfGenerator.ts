
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ServiceReport, VisitReport } from '../types';

type OutputType = 'save' | 'datauristring';

// --- HELPER FUNCTIONS ---

/**
 * Fetches an image from a URL and converts it to a base64 data string.
 * This method uses the `fetch` API to avoid CORS issues that can occur
 * when loading images directly onto a canvas from a different origin.
 * It also handles cases where the URL is already a base64 data URI.
 * @param url The URL or data URI of the image to fetch.
 * @returns A Promise that resolves with the base64 data URL.
 */
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  if (url.startsWith('data:image')) {
    return url;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    
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
    throw error;
  }
};

// NEW: Draws the header on the current page. Called by hooks.
const drawHeader = (doc: jsPDF, logoDataUrl: string | null, title: string, options?: { bgColor?: string, textColor?: string }) => {
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', 15, 10, 30, 15, undefined, 'FAST');
        } catch (e) {
            console.error("Could not add logo to PDF header:", e);
            doc.text("Logo", 15, 15);
        }
    } else {
        doc.text("Logo", 15, 15);
    }
   
    const bgColor = options?.bgColor || '#14B8A6';
    const textColor = options?.textColor || '#FFFFFF';

    autoTable(doc, {
        startY: 10,
        margin: { left: 50, right: 15 },
        body: [[{ content: title, styles: { halign: 'center', valign: 'middle', fillColor: bgColor, textColor: textColor, fontStyle: 'bold', minCellHeight: 15 } }]],
        theme: 'grid',
    });
};

// NEW: Loops through all pages at the end to add footers with correct total page count.
const addFooters = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
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
            y = 30; // Start below header margin on new page
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

/**
 * Helper function that takes an image data URL, draws it to a canvas,
 * and returns a new data URL in PNG format. This normalizes all images.
 * @param imageDataUrl The source image data URL (can be any format).
 * @returns A promise that resolves with a PNG data URL.
 */
const convertToPngDataUrl = (imageDataUrl: string): Promise<string> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Image could not be loaded for normalization. It might be corrupt or an unsupported format.'));
    img.src = imageDataUrl;
});


/**
 * Normalizes different image sources (data URI, public URL, raw base64) into a consistent
 * array of PNG data URIs for reliable PDF generation.
 * @param imagesSources An array of image sources.
 * @returns A promise that resolves to an array of PNG data URIs.
 */
const prepareImages = async (imagesSources: (string | null)[] | undefined): Promise<string[]> => {
    if (!imagesSources) return [];

    const validSources = imagesSources.filter((s): s is string => !!s);
    if (validSources.length === 0) return [];

    const imagePromises = validSources.map(async (source) => {
        let dataUrl: string;

        // Step 1: Ensure we have a data URL from any source type.
        if (source.startsWith('http')) {
            dataUrl = await getBase64ImageFromUrl(source);
        } else if (source.startsWith('data:image')) {
            dataUrl = source;
        } else {
            // It's raw base64. Guess the mime type to create a temporary data URL.
            // JPEG base64 strings often start with /9j/.
            const prefix = source.startsWith('/9j/') ? 'data:image/jpeg;base64,' : 'data:image/png;base64,';
            dataUrl = prefix + source;
        }

        // Step 2: Normalize the data URL to PNG format to ensure consistency for the PDF generator.
        return convertToPngDataUrl(dataUrl);
    });

    const results = await Promise.allSettled(imagePromises);
    const images: string[] = [];
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            images.push(result.value);
        } else {
            console.error("Failed to process an image for PDF:", result.reason);
        }
    });
    return images;
};


// --- MAIN PDF GENERATORS ---

export const generateServiceReport = async (
    report: Partial<ServiceReport>, 
    logoUrl: string, 
    outputType: OutputType = 'save'
): Promise<string | void> => {
    const doc = new jsPDF();
    const pageHeaderMargin = 30;
    let finalY = pageHeaderMargin;

    let logoDataUrl: string | null = null;
    if (logoUrl) {
        try {
            logoDataUrl = await getBase64ImageFromUrl(logoUrl);
        } catch (e) {
            console.error("Failed to fetch or convert logo URL to base64:", e);
        }
    }

    const reportTitle = 'REPORTE DE SERVICIO';

    // Draw header on the first page
    drawHeader(doc, logoDataUrl, reportTitle);

    const commonAutoTableOptions = {
        theme: 'grid' as const,
        margin: { top: pageHeaderMargin },
        didDrawPage: (data: any) => {
            if (data.pageNumber > 1) { // Avoid redrawing on first page
                drawHeader(doc, logoDataUrl, reportTitle);
            }
        }
    };
    
    // --- Image Processing ---
    const [
        problemasImages,
        accionesImages,
        firmaImageArray,
    ] = await Promise.all([
        prepareImages([...(report.fotosProblemasBase64 || []), ...(report.foto_problemas_encontrados || [])]),
        prepareImages([...(report.fotosAccionesBase64 || []), ...(report.foto_acciones_realizadas || [])]),
        prepareImages([...(report.fotoFirmaBase64 ? [report.fotoFirmaBase64] : []), ...(report.foto_firma ? [report.foto_firma] : [])]),
    ]);
    const firmaImage = firmaImageArray.length > 0 ? firmaImageArray[0] : null;


    // --- DETAILS TABLE ---
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: finalY,
        body: [
            [{ content: 'CLIENTE', styles: { fontStyle: 'bold' } }, report.empresa_nombre ?? 'N/A', { content: 'CÓDIGO', styles: { fontStyle: 'bold' } }, report.codigo ?? 'N/A'],
            [{ content: 'RESPONSABLE PLANTA', styles: { fontStyle: 'bold' } }, report.encargado_nombre ?? 'N/A', { content: 'FECHA', styles: { fontStyle: 'bold' } }, report.fecha ? new Date(report.fecha + 'T00:00:00Z').toLocaleDateString('es-ES') : 'N/A'],
            [{ content: 'PLANTA / SEDE', styles: { fontStyle: 'bold' } }, report.enpresa_planta ?? 'N/A', { content: 'HORAS', styles: { fontStyle: 'bold' } }, `E: ${report.hora_entrada ?? '--:--'} - S: ${report.hora_salida ?? '--:--'}`],
            [{ content: 'REALIZADO POR (TÉCNICO)', styles: { fontStyle: 'bold' } }, { content: report.usuario_nombre ?? 'N/A', colSpan: 3 }],
        ],
        styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
    });
    finalY = (doc as any).lastAutoTable.finalY;
    
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: finalY + 2,
        body: [
            [{ content: 'N° SERIE', styles: { fontStyle: 'bold' } }, report.maquina_seria ?? 'N/A', { content: 'MODELO', styles: { fontStyle: 'bold' } }, report.maquina_modelo ?? 'N/A'],
            [{ content: 'MARCA', styles: { fontStyle: 'bold' } }, report.maquina_marca ?? 'N/A', { content: 'LINEA', styles: { fontStyle: 'bold' } }, report.maquina_linea ?? 'N/A'],
        ],
        styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
    });

    finalY = (doc as any).lastAutoTable.finalY;

    // --- DYNAMIC SECTIONS HELPER ---
    const drawSection = (title: string, content: string | undefined, images: string[] | undefined) => {
        autoTable(doc, {
            ...commonAutoTableOptions,
            startY: finalY + 5,
            head: [[title]],
            headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#333' },
            body: [[content || (images && images.length > 0 ? '' : 'N/A')]],
            didParseCell: (data) => {
                 if(data.section === 'body' && (!content || content.trim() === '')){
                    data.cell.styles.minCellHeight = 5;
                 }
            },
        });
        finalY = (doc as any).lastAutoTable.finalY;

        if (images && images.length > 0) {
            finalY = addImageGallery(doc, images, finalY + 3);
        }
    };

    drawSection('PROBLEMAS ENCONTRADOS', report.problemas_encontraados, problemasImages);
    drawSection('ACCIONES REALIZADAS', report.acciones_realizadas, accionesImages);
    drawSection('OBSERVACIONES', report.observaciones, undefined);
    
    // --- FINAL STATUS TABLE ---
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: finalY + 5,
        head: [[{ content: 'ESTADO FINAL', colSpan: 6, styles: { halign: 'center', fillColor: '#EAEAEA', textColor: '#333' } }]],
        body: [
            [
                'OPERATIVO', `(${report.operatio || report.estado_maquina === 'operativo' ? 'X' : ' '})`,
                'INOPERATIVO', `(${!report.operatio && !report.en_prueba || report.estado_maquina === 'inoperativo' ? 'X' : ' '})`,
                'EN PRUEBA', `(${report.en_prueba || report.estado_maquina === 'en_prueba' ? 'X' : ' '})`,
            ]
        ],
        styles: { fontSize: 9, cellPadding: 1.5, halign: 'center' },
    });
    finalY = (doc as any).lastAutoTable.finalY;

    // --- SIGNATURES ---
    let signatureBlockStartY = finalY + 10;
    const signatureImageHeight = 20;
    const signatureTextHeight = 15;
    const signatureBlockHeight = signatureImageHeight + signatureTextHeight;

    if (signatureBlockStartY + signatureBlockHeight > doc.internal.pageSize.height - 20) { // Check space for footer
        doc.addPage();
        signatureBlockStartY = pageHeaderMargin;
    }

    const centerX = doc.internal.pageSize.getWidth() / 2;
    const signatureLineWidth = 70;

    // Draw signature image if it exists, centered above the client signature line
    if (firmaImage) {
        try {
            const imageX = centerX - (60 / 2); // Center image over the signature line
            doc.addImage(firmaImage, 'PNG', imageX, signatureBlockStartY, 60, signatureImageHeight, undefined, 'FAST');
        } catch(e) { console.error("Could not add signature image", e); }
    }
    
    // Y position for the CLIENT's signature line, placed after the image space
    const clientLineY = signatureBlockStartY + signatureImageHeight + 2;
    
    doc.setDrawColor(0); // black
    doc.setLineWidth(0.2);
    // Line for "CONFORMIDAD CLIENTE"
    doc.line(centerX - (signatureLineWidth / 2), clientLineY, centerX + (signatureLineWidth / 2), clientLineY);

    // Add signature text below line
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const encargadoDetails = [
        report.encargado_nombre ?? 'N/A',
        report.encargado_cel ? `Cel: ${report.encargado_cel}` : ''
    ].filter(Boolean).join('\n');
    doc.text(`CONFORMIDAD CLIENTE:\n${encargadoDetails}`, centerX, clientLineY + 5, { align: 'center' });


    addFooters(doc);
    
    if (outputType === 'save') {
        doc.save(`reporte-servicio-${report.codigo || 'NUEVO'}.pdf`);
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
    const pageHeaderMargin = 30;
    let finalY = pageHeaderMargin;

    let logoDataUrl: string | null = null;
    if (logoUrl) {
        try {
            logoDataUrl = await getBase64ImageFromUrl(logoUrl);
        } catch (e) {
            console.error("Failed to fetch or convert logo URL to base64:", e);
        }
    }

    const reportTitle = 'REPORTE DE VISITA';
    const headerOptions = { bgColor: '#FFFFFF', textColor: '#333333' };

    drawHeader(doc, logoDataUrl, reportTitle, headerOptions);

    const commonAutoTableOptions = {
        theme: 'grid' as const,
        margin: { top: pageHeaderMargin },
        didDrawPage: (data: any) => {
            if (data.pageNumber > 1) { // Avoid redrawing on first page
                drawHeader(doc, logoDataUrl, reportTitle, headerOptions);
            }
        }
    };
    
    // --- Image Processing for Visit Report ---
    const [
        observacionesImages,
        sugerenciasImages,
        firmaImageArray,
    ] = await Promise.all([
        prepareImages([...(report.fotosObservacionesBase64 || []), ...(report.foto_observaciones ? [report.foto_observaciones] : [])]),
        prepareImages([...(report.fotosSugerenciasBase64 || []), ...(report.foto_sugerencias ? [report.foto_sugerencias] : [])]),
        prepareImages([...(report.fotoFirmaBase64 ? [report.fotoFirmaBase64] : []), ...(report.firma ? [report.firma] : [])]),
    ]);
    const firmaImage = firmaImageArray.length > 0 ? firmaImageArray[0] : undefined;


    // --- DETAILS TABLE ---
     autoTable(doc, {
        ...commonAutoTableOptions,
        startY: finalY,
        body: [
            [{ content: 'CLIENTE', styles: { fontStyle: 'bold' } }, report.empresa ?? 'N/A'],
            [{ content: 'PLANTA / SEDE', styles: { fontStyle: 'bold' } }, report.planta ?? 'N/A'],
            [{ content: 'FECHA', styles: { fontStyle: 'bold' } }, report.fecha ? new Date(report.fecha + 'T00:00:00Z').toLocaleDateString('es-ES') : 'N/A'],
            [{ content: 'HORAS', styles: { fontStyle: 'bold' } }, `Ingreso: ${report.hora_ingreso ?? '--:--'} - Salida: ${report.hora_salida ?? '--:--'}`],
            [{ content: 'REALIZADO POR (TÉCNICO)', styles: { fontStyle: 'bold' } }, report.usuario?.nombres ?? 'N/A'],
        ],
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 40 } },
    });
    finalY = (doc as any).lastAutoTable.finalY;
    
    // --- CONTACTS TABLE ---
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: finalY + 2,
        head: [[{ content: 'CONTACTOS', colSpan: 2, styles: { halign: 'center', fillColor: '#EAEAEA', textColor: '#333' } }]],
        body: [
            ['Encargado de Planta', `${report.nombre_encargado || 'N/A'} | Cel: ${report.celular_encargado || 'N/A'} | Email: ${report.email_encargado || 'N/A'}`],
            ['Operador de Máquina', `${report.nombre_operador || 'N/A'} | Cel: ${report.celular_operador || 'N/A'}`],
        ],
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
    });
    finalY = (doc as any).lastAutoTable.finalY;


    // --- CHECKLIST & MACHINES ---
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: finalY + 5,
        head: [[{ content: 'CHECKLIST TÉCNICO', colSpan: 6, styles: { halign: 'center', fillColor: '#EAEAEA', textColor: '#333' } }]],
        body: [[
            'Voltaje Estable', `(${report.voltaje_establecido ? 'SI' : 'NO'})`,
            'Presurización', `(${report.presurizacion ? 'SI' : 'NO'})`,
            'Transformador', `(${report.transformador ? 'SI' : 'NO'})`,
        ]],
        styles: { fontSize: 9, cellPadding: 1.5, halign: 'center' },
    });
    finalY = (doc as any).lastAutoTable.finalY;

    if (report.selected_maquinas_pdf && report.selected_maquinas_pdf.length > 0) {
        autoTable(doc, {
            ...commonAutoTableOptions,
            startY: finalY + 5,
            head: [['Máquina (Serie / Modelo / Marca)', 'Observaciones']],
            body: report.selected_maquinas_pdf.map(item => [item.machineLabel, item.observations]),
            styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 'auto' } },
        });
        finalY = (doc as any).lastAutoTable.finalY;
    } else {
        autoTable(doc, {
            ...commonAutoTableOptions,
            startY: finalY + 5,
            head: [['MÁQUINAS ATENDIDAS']],
            body: report.maquinas && report.maquinas.length > 0 ? report.maquinas.map(m => [m]) : [['N/A']],
            styles: { fontSize: 9, cellPadding: 2 },
        });
        finalY = (doc as any).lastAutoTable.finalY;
    }

    // --- DYNAMIC SECTIONS HELPER ---
    const drawSection = (title: string, content: string | undefined, images: string[] | undefined) => {
        autoTable(doc, {
            ...commonAutoTableOptions,
            startY: finalY + 5,
            head: [[title]],
            headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#333' },
            body: [[content || (images && images.length > 0 ? '' : 'N/A')]],
            didParseCell: (data) => {
                 if(data.section === 'body' && (!content || content.trim() === '')){
                    data.cell.styles.minCellHeight = 5;
                 }
            },
        });
        finalY = (doc as any).lastAutoTable.finalY;
        if (images && images.length > 0) {
            finalY = addImageGallery(doc, images, finalY + 3);
        }
    };
    
    drawSection('OBSERVACIONES / FOTOS GENERALES', undefined, observacionesImages);
    drawSection('SUGERENCIAS', report.sugerencias, sugerenciasImages);

    // --- SIGNATURES ---
    let signatureBlockStartY = finalY + 10;
    const signatureImageHeight = 20;
    const signatureTextHeight = 15;
    const signatureBlockHeight = signatureImageHeight + signatureTextHeight;

    if (signatureBlockStartY + signatureBlockHeight > doc.internal.pageSize.height - 20) { // Check space for footer
        doc.addPage();
        signatureBlockStartY = pageHeaderMargin;
    }

    const centerX = doc.internal.pageSize.getWidth() / 2;
    const signatureLineWidth = 70;

    // Draw signature image if it exists, centered above the client signature line
    if (firmaImage) {
        try {
            const imageX = centerX - (60 / 2); // Center image over the signature line
            doc.addImage(firmaImage, 'PNG', imageX, signatureBlockStartY, 60, signatureImageHeight, undefined, 'FAST');
        } catch(e) { console.error("Could not add signature image", e); }
    }
    
    // Y position for the CLIENT's signature line, placed after the image space
    const clientLineY = signatureBlockStartY + signatureImageHeight + 2;
    
    doc.setDrawColor(0); // black
    doc.setLineWidth(0.2);
    // Line for "CONFORMIDAD CLIENTE"
    doc.line(centerX - (signatureLineWidth / 2), clientLineY, centerX + (signatureLineWidth / 2), clientLineY);

    // Add signature text below line
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const encargadoDetails = [
        report.nombre_encargado ?? 'N/A',
        report.celular_encargado ? `Cel: ${report.celular_encargado}` : ''
    ].filter(Boolean).join('\n');
    doc.text(`CONFORMIDAD CLIENTE:\n${encargadoDetails}`, centerX, clientLineY + 5, { align: 'center' });
    
    addFooters(doc);

    if (outputType === 'save') {
        doc.save(`reporte-visita-${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
        return doc.output('datauristring');
    }
};
