import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ServiceReport, VisitReport } from '../types';

// A helper to draw a checkbox
const drawCheckbox = (doc: jsPDF, x: number, y: number, text: string, checked: boolean) => {
    doc.text(`(${checked ? 'X' : ' '})`, x, y);
    doc.text(text, x + 6, y);
};

const loadLogo = async (doc: jsPDF, logoUrl: string) => {
    if (!logoUrl) return;
    try {
        if (logoUrl.startsWith('data:image')) {
            const mimeTypeMatch = logoUrl.match(/data:(image\/[a-z]+);/);
            const format = mimeTypeMatch ? mimeTypeMatch[1].split('/')[1].toUpperCase() : 'PNG';
            doc.addImage(logoUrl, format, 160, 10, 30, 15);
        } else {
            const response = await fetch(logoUrl);
            if (!response.ok) throw new Error(`Failed to fetch logo: ${response.statusText}`);
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise<void>((resolve, reject) => {
                reader.onload = () => {
                    try {
                        const urlPart = logoUrl.split('?')[0];
                        const extension = urlPart.split('.').pop()?.toUpperCase() ?? 'PNG';
                        const format = ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(extension) ? extension : 'PNG';
                        doc.addImage(reader.result as string, format, 160, 10, 30, 15);
                        resolve();
                    } catch (imgError) {
                        reject(imgError);
                    }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(blob);
            });
        }
    } catch (e) {
        console.error("Could not load or add logo to PDF, skipping.", e);
    }
};


export const generateServiceReport = async (
    report: Partial<ServiceReport>, 
    logoUrl: string, 
    outputType: 'save' | 'datauristring' = 'save'
): Promise<string | void> => {
    const doc = new jsPDF();

    // --- HEADER ---
    await loadLogo(doc, logoUrl);
    
    doc.setFontSize(10);
    doc.text('L.+J. BAECHLER INGENIEROS S.A.', 15, 15);
    doc.text('TELF. OFICINA: (51 1) 271 8900', 15, 20);
    doc.text('E-mail: info@baechleringenieros.com', 15, 25);
    doc.text('TELF. ALMACEN: (51 1) 326 1416', 100, 20);
    
    doc.setFontSize(14).setFont(undefined, 'bold');
    doc.text('REPORTES DE SERVICIO', 75, 35);
    doc.text(`N° ${report.codigo_reporte ?? 'N/A'}`, 160, 35);
    doc.setFont(undefined, 'normal');

    // --- DETAILS TABLE ---
    const tableData = [
        ['CLIENTE:', report.empresa?.nombre ?? '', 'FECHA:', report.fecha ? new Date(report.fecha + 'T00:00:00').toLocaleDateString('es-ES') : ''],
        ['RESPONSABLE:', [report.encargado?.nombre, report.encargado?.apellido].filter(Boolean).join(' ') || '', 'MARCA:', report.marca_maquina ?? ''],
        ['EQUIPO: EN GARANTIA ( ) SIN GARANTIA ( )', '', 'MODELO:', report.modelo_maquina ?? ''],
        ['SERVICIO: FACTURADO ( ) NO FACTURADO ( )', '', 'N° DE SERIE:', report.serie_maquina ?? ''],
        ['UBICACION SERVICIO: CLIENTE (X) L.+J. ( )', '', 'LINEA:', report.linea_maquina ?? '']
    ];
    autoTable(doc, {
        startY: 40,
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 1.5,
            valign: 'middle'
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 50 },
            2: { fontStyle: 'bold', cellWidth: 20 },
            3: { cellWidth: 'auto' },
        },
        didParseCell: (data) => {
            if (data.row.index === 2 && data.column.index === 0) data.cell.text = ['EQUIPO: EN GARANTIA         SIN GARANTIA'];
            if (data.row.index === 3 && data.column.index === 0) data.cell.text = ['SERVICIO: FACTURADO         NO FACTURADO'];
            if (data.row.index === 4 && data.column.index === 0) data.cell.text = ['UBICACION SERVICIO: CLIENTE      L.+J.'];
        },
        didDrawCell: (data) => {
             if (data.row.index === 2 && data.column.index === 0) {
                const x = data.cell.x + 40; const y = data.cell.y + 4;
                doc.text(report.con_garantia ? '(X)' : '( )', x, y);
                doc.text(report.sin_garantia ? '(X)' : '( )', x + 27, y);
            }
            if (data.row.index === 3 && data.column.index === 0) {
                const x = data.cell.x + 35; const y = data.cell.y + 4;
                doc.text(report.facturado ? '(X)' : '( )', x, y);
                doc.text(report.no_facturado ? '(X)' : '( )', x + 29, y);
            }
             if (data.row.index === 4 && data.column.index === 0) {
                const x = data.cell.x + 48; const y = data.cell.y + 4;
                doc.text('(X)', x, y); doc.text('( )', x + 16, y);
            }
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    // --- TEXT SECTIONS ---
    const drawSection = (title: string, content: string | undefined, startY: number): number => {
        doc.setFillColor(230, 230, 230);
        doc.rect(14, startY, 182, 7, 'F');
        doc.setFontSize(9).setFont(undefined, 'bold');
        doc.text(title, 15, startY + 5);
        doc.setFontSize(9).setFont(undefined, 'normal');
        const textLines = doc.splitTextToSize(content || '', 180);
        const textHeight = (doc.getTextDimensions(textLines).h) + 8;
        doc.rect(14, startY + 7, 182, textHeight, 'S');
        doc.text(textLines, 15, startY + 12);
        return startY + 7 + textHeight;
    };
    
    finalY = drawSection('PROBLEMA ENCONTRADO:', report.problemas_encontrados, finalY + 5);
    finalY = drawSection('ACCIÓN REALIZADA:', report.acciones_realizadas, finalY + 2);
    
    // --- CONDITION AFTER SERVICE ---
    finalY += 5;
    doc.setFillColor(230, 230, 230);
    doc.rect(14, finalY, 182, 7, 'F');
    doc.setFontSize(9).setFont(undefined, 'bold');
    doc.text('CONDICIÓN DESPUES DEL SERVICIO:', 15, finalY + 5);
    doc.setFont(undefined, 'normal');
    drawCheckbox(doc, 70, finalY + 5, 'OPERATIVO', !!report.operativo);
    drawCheckbox(doc, 110, finalY + 5, 'INOPERATIVO', !!report.inoperativo);
    drawCheckbox(doc, 155, finalY + 5, 'EN PRUEBA', !!report.en_prueba);
    
    finalY += 7;
    finalY = drawSection('OBSERVACIONES / SUGERENCIAS:', report.observaciones, finalY);

    // --- SIGNATURES ---
    finalY += 5;
    const tableBottomData = [
        [
            `RESPONSABLE: ${report.nombre_firmante ?? ''}`, 
            `HORA\nLLEGADA: ${report.entrada ?? ''}\nSALIDA: ${report.salida ?? ''}`,
            `SERVICIO REALIZADO POR: ${report.usuario?.nombres ?? ''}`
        ],
        ['FIRMA:', '', '']
    ];
    autoTable(doc, {
        startY: finalY,
        body: tableBottomData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5, valign: 'top' },
        columnStyles: {
            0: { cellWidth: 70, minCellHeight: 30 },
            1: { cellWidth: 42 },
            2: { cellWidth: 'auto' },
        },
    });
    finalY = (doc as any).lastAutoTable.finalY;

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.text('OFICINA ADMINISTRATIVA: CALLE LOS ANTARES N° 320 OF. 301 - TORRE A - SANTIAGO DE SURCO', 15, 280);
    doc.text('OFICINA TALLER: AV. SANTA ROSA 450 - ATE', 15, 284);
    
    if (outputType === 'save') {
        doc.save(`reporte-${report.codigo_reporte || report.id}.pdf`);
    } else {
        return doc.output('datauristring');
    }
};

export const generateVisitReport = async (
    report: Partial<VisitReport>,
    logoUrl: string,
    outputType: 'save' | 'datauristring' = 'save'
): Promise<string | void> => {
    const doc = new jsPDF();
    let finalY = 10;

    // --- HEADER ---
    await loadLogo(doc, logoUrl);

    doc.setFontSize(10);
    doc.text('L.+J. BAECHLER INGENIEROS S.A.', 15, 15);
    
    doc.setFontSize(14).setFont(undefined, 'bold');
    doc.text('REPORTE DE VISITA', 80, 35);
    doc.text(`N° ${report.codigo_reporte ?? 'N/A'}`, 160, 35);
    doc.setFont(undefined, 'normal');
    finalY = 40;

    // --- DETAILS TABLE ---
    const tableData = [
        ['CLIENTE:', report.empresa?.nombre ?? ''],
        ['PLANTA / SEDE:', report.planta?.nombre ?? ''],
        ['RESPONSABLE:', [report.encargado?.nombre, report.encargado?.apellido].filter(Boolean).join(' ') || ''],
        ['FECHA:', report.fecha ? new Date(report.fecha + 'T00:00:00').toLocaleDateString('es-ES') : ''],
        ['REALIZADO POR:', report.usuario?.nombres ?? '']
    ];
    autoTable(doc, {
        startY: finalY,
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    });
    finalY = (doc as any).lastAutoTable.finalY;

    // --- TEXT SECTIONS HELPER ---
    const drawSection = (title: string, content: string | undefined, startY: number): number => {
        if (startY > 240) {
            doc.addPage();
            startY = 20;
        }
        doc.setFillColor(230, 230, 230);
        doc.rect(14, startY, 182, 7, 'F');
        doc.setFontSize(10).setFont(undefined, 'bold');
        doc.text(title.toUpperCase(), 15, startY + 5);

        doc.setFontSize(9).setFont(undefined, 'normal');
        const textLines = doc.splitTextToSize(content || '', 180);
        const textHeight = (doc.getTextDimensions(textLines).h) + 8;
        doc.rect(14, startY + 7, 182, textHeight, 'S');
        doc.text(textLines, 15, startY + 12);
        return startY + 7 + textHeight;
    };

    finalY = drawSection('Motivo de la Visita', report.motivo_visita, finalY + 5);
    finalY = drawSection('Temas Tratados', report.temas_tratados, finalY + 2);
    finalY = drawSection('Acuerdos', report.acuerdos, finalY + 2);
    finalY = drawSection('Pendientes', report.pendientes, finalY + 2);
    finalY = drawSection('Observaciones', report.observaciones, finalY + 2);

    // --- SIGNATURES ---
    let signatureY = finalY + 15 > 250 ? 20 : 250;
    if (finalY + 15 > 250) {
        doc.addPage();
    }
    
    doc.line(30, signatureY, 90, signatureY);
    doc.text('Firma del Cliente', 45, signatureY + 5);
    doc.text(report.nombre_firmante ?? '', 30, signatureY - 2);

    doc.line(120, signatureY, 180, signatureY);
    doc.text('Firma L.+J. Baechler', 130, signatureY + 5);
    doc.text(report.usuario?.nombres ?? '', 120, signatureY - 2);

    if (outputType === 'save') {
        doc.save(`reporte-visita-${report.codigo_reporte || report.id}.pdf`);
    } else {
        return doc.output('datauristring');
    }
};
