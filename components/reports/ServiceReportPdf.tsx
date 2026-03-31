
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { ServiceReport } from '../../types';

const styles = StyleSheet.create({
  page: {
    padding: 15,
    paddingBottom: 50, // Margen compacto para el footer absoluto
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: '#000',
  },
  header: {
    flexDirection: 'column',
    marginBottom: 10,
    borderBottom: '1px solid #000',
    paddingBottom: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  logo: {
    width: 28,

  },
  companyInfoContainer: {
    flexDirection: 'column',
    marginLeft: 5, // Minimal space requested (5)
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 6,
    lineHeight: 1.2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  titleBox: {
    padding: 6,
    width: '60%', // Width of the centered title box
    textAlign: 'center',
    borderRadius: 2,
  },
  titleText: {
    color: '#000000ff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  qrPlaceholder: {
    width: 40,
    height: 40,
    border: '1px solid #CCC',
    marginBottom: 5,
  },
  serialNumber: {
    fontSize: 10,
    color: '#D32F2F',
    fontWeight: 'bold',
  },

  // Section Layouts
  sectionHeader: {
    backgroundColor: '#F3F4F6',
    padding: 3,
    width: '100%',
    border: '1px solid #000',
    marginBottom: -1,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    border: '1px solid #000',
    marginBottom: -1,
  },
  tableCol: {
    borderRight: '1px solid #000',
    padding: 4,
    flex: 1,
    flexDirection: 'row',
  },
  lastCol: {
    borderRightWidth: 0,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 7.5,
    marginRight: 4,
  },
  value: {
    fontSize: 7.5,
    flex: 1,
  },

  // Tri-Column Section
  triColContainer: {
    flexDirection: 'row',
    border: '1px solid #000',
    marginBottom: -1,
  },
  triCol: {
    width: '33.33%',
    flexDirection: 'column',
    borderRight: '1px solid #000',
  },
  lastTriCol: {
    borderRightWidth: 0,
  },
  triColHeader: {
    backgroundColor: '#F3F4F6',
    borderBottom: '1px solid #000',
    padding: 3,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 7.5,
  },
  triColRow: {
    padding: 3,
    paddingLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottom: '1px solid #000',
    minHeight: 18,
  },
  noBottomBorder: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 10,
    height: 10,
    border: '1px solid #000',
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxTick: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 'bold',
  },

  // Big Text Blocks
  textBlockContent: {
    border: '1px solid #000',
    padding: 6,
    minHeight: 40,
    marginBottom: 5,
  },
  textContent: {
    fontSize: 8.5,
    lineHeight: 1.2,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 5,
  },
  imageContainer: {
    marginRight: 10,
    marginBottom: 10,
  },
  reportImage: {
    width: 130,
    height: 'auto',
    border: '1px solid #CCC',
    borderRadius: 2,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '0.5px solid #000',
    paddingTop: 8,
  },
  footerCol: {
    width: '48%',
  },
  footerLabel: {
    fontWeight: 'bold',
    fontSize: 8,
    marginBottom: 2,
  },
  signatureLine: {
    borderTop: '0.5px solid #000',
    marginTop: 5,
    paddingTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  signatureContainer: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 50,
  },
  signatureImage: {
    height: 40,
    width: 'auto',
    marginBottom: 2,
  }
});

interface Props {
  report: Partial<ServiceReport>;
  logoUrl?: string;
  serial?: string;
}

const cleanBase64 = (str: string | null | undefined) => {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('http') || trimmed.startsWith('blob:')) return trimmed;
  // If it's pure base64 (no header), add it
  if (trimmed.length > 50 && !trimmed.includes(' ')) return `data:image/png;base64,${trimmed}`;
  return trimmed;
};

const CheckboxField = ({ checked, label, noBorder }: { checked: boolean; label: string; noBorder?: boolean }) => (
  <View style={[styles.triColRow, noBorder && styles.noBottomBorder]}>
    <View style={styles.checkbox}>
      {checked ? <Text style={styles.checkboxTick}>X</Text> : null}
    </View>
    <Text style={styles.value}>{label}</Text>
  </View>
);

const ServiceReportPdf = ({ report, logoUrl, serial }: Props) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          {/* FILA 1: LOGO, EMPRESA Y QR/SERIAL */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              {logoUrl && <Image src={logoUrl} style={styles.logo} />}
              <View style={styles.companyInfoContainer}>
                <Text style={styles.companyName}>BAECHLER INGENIEROS S.A.</Text>
                <View style={styles.contactInfo}>
                  <Text>TELÉFONO OFICINA: (51 1) 2718900 / ALMACEN: (51 1) 3261416</Text>
                  <Text>OFICINA ADM: Calle los antares Nro 320 Of. 301 - Torre A - Surco</Text>
                  <Text>OFICINA TALLER: Av Santa rosa 450 - Ate</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              {report.id && (
                <Image 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ type: 'service', id: report.id }))}`}
                  style={styles.qrPlaceholder} 
                />
              )}
              <Text style={styles.serialNumber}>Nº {report.id ? String(report.id).padStart(6, '0') : (serial || report.codigo || "")}</Text>
            </View>
          </View>

          {/* FILA 2: TITULO CENTRADO ABAJO */}
          <View style={styles.headerBottomRow}>
            <View style={styles.titleBox}>
              <Text style={styles.titleText}>REPORTE DE SERVICIO</Text>
            </View>
          </View>
        </View>

        {/* DATOS DEL CLIENTE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.label}>CLIENTE:</Text>
            <Text style={styles.value}>{report.empresa_nombre || ''}</Text>
          </View>
          <View style={[styles.tableCol, styles.lastCol]}>
            <Text style={styles.label}>RUC:</Text>
            <Text style={styles.value}></Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.label}>DISTRITO:</Text>
            <Text style={styles.value}></Text>
          </View>
          <View style={[styles.tableCol, styles.lastCol]}>
            <Text style={styles.label}>PLANTA:</Text>
            <Text style={styles.value}>{report.empresa_planta || ''}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.tableCol, styles.lastCol]}>
            <Text style={styles.label}>DIRECCIÓN:</Text>
            <Text style={styles.value}></Text>
          </View>
        </View>

        {/* TECHNICAL INFO GRID */}
        <View style={styles.triColContainer}>
          {/* COL 1: DATOS DEL EQUIPO */}
          <View style={styles.triCol}>
            <Text style={styles.triColHeader}>DATOS DEL EQUIPO</Text>
            <View style={styles.triColRow}><Text style={styles.label}>MARCA:</Text><Text style={styles.value}>{report.maquina_marca || ''}</Text></View>
            <View style={styles.triColRow}><Text style={styles.label}>MODELO:</Text><Text style={styles.value}>{report.maquina_modelo || ''}</Text></View>
            <View style={styles.triColRow}><Text style={styles.label}>SERIE:</Text><Text style={styles.value}>{report.maquina_serie || ''}</Text></View>
            <View style={[styles.triColRow, styles.noBottomBorder]}><Text style={styles.label}>LINEA:</Text><Text style={styles.value}>{report.maquina_linea || ''}</Text></View>
          </View>

          {/* COL 2: ESTADO DEL EQUIPO */}
          <View style={styles.triCol}>
            <Text style={styles.triColHeader}>ESTADO DEL EQUIPO</Text>
            <CheckboxField checked={report.estado_garantia === 'con_garantia'} label="GARANTÍA" />
            <CheckboxField checked={report.estado_garantia === 'sin_garantia'} label="SIN GARANTÍA" />
            <CheckboxField checked={report.estado_facturacion === 'facturado'} label="FACTURADO" />
            <CheckboxField checked={report.estado_facturacion === 'no_facturado'} label="NO FACTURADO" noBorder={true} />
          </View>

          {/* COL 3: CONDICION DESPUES DEL SERVICIO */}
          <View style={[styles.triCol, styles.lastTriCol]}>
            <Text style={styles.triColHeader}>CONDICIÓN DESPUÉS DEL SERVICIO</Text>
            <CheckboxField checked={report.estado_maquina === 'operativo'} label="OPERATIVO" />
            <CheckboxField checked={report.estado_maquina === 'inoperativo'} label="INOPERATIVO" />
            <CheckboxField checked={report.estado_maquina === 'en_prueba'} label="EN PRUEBA" />
            <View style={[styles.triColRow, styles.noBottomBorder]} />
          </View>
        </View>

        {/* BODY TEXT BLOCKS */}
        <View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>PROBLEMAS ENCONTRADOS:</Text></View>
          <View style={styles.textBlockContent}>
            <Text style={styles.textContent}>{report.problemas_encontrados || ''}</Text>

            {((report as any).fotosProblemasBase64?.length > 0 || report.foto_problemas_encontrados) && (
              <View style={styles.imageGrid}>
                {((report as any).fotosProblemasBase64 || (typeof report.foto_problemas_encontrados === 'string' ? report.foto_problemas_encontrados.split(',') : [])).filter(Boolean).map((imgTag: string, i: number) => (
                  <View key={i} style={styles.imageContainer}>
                    <Image src={cleanBase64(imgTag)} style={styles.reportImage} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>ACCIONES REALIZADAS:</Text></View>
          <View style={styles.textBlockContent}>
            <Text style={styles.textContent}>{report.acciones_realizadas || ''}</Text>

            {((report as any).fotosAccionesBase64?.length > 0 || report.foto_acciones_realizadas) && (
              <View style={styles.imageGrid}>
                {((report as any).fotosAccionesBase64 || (typeof report.foto_acciones_realizadas === 'string' ? report.foto_acciones_realizadas.split(',') : [])).filter(Boolean).map((imgTag: string, i: number) => (
                  <View key={i} style={styles.imageContainer}>
                    <Image key={i} src={cleanBase64(imgTag)} style={styles.reportImage} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>OBSERVACIONES & SUGERENCIAS:</Text></View>
          <View style={styles.textBlockContent}>
            <Text style={styles.textContent}>{report.observaciones || ''}</Text>
          </View>
        </View>

        <View style={{ flexGrow: 1 }} />

        {/* FOOTER - ONLY AT THE BOTTOM OF THE LAST PAGE */}
        <View style={styles.footer} wrap={false}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Servicio Realizado Por: <Text style={styles.value}>{report.usuario_nombre || (report as any).nombre_usuario || ''}</Text></Text>
            <Text style={styles.footerLabel}>Celular: <Text style={styles.value}>{report.usuario_cel || (report as any).celular_usuario || ''}</Text></Text>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <Text style={[styles.footerLabel, { marginRight: 15 }]}>Hora Ingreso: <Text style={styles.value}>{report.hora_entrada || ''}</Text></Text>
              <Text style={styles.footerLabel}>Hora Salida: <Text style={styles.value}>{report.hora_salida || ''}</Text></Text>
            </View>
          </View>

          <View style={styles.footerCol}>
            <View style={styles.signatureContainer}>
              {(report.foto_firma || (report as any).fotoFirmaBase64) && (
                <Image 
                  src={cleanBase64(report.foto_firma || (report as any).fotoFirmaBase64)} 
                  style={styles.signatureImage} 
                />
              )}
              <View style={styles.signatureLine}>
                <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>Firma del Cliente / Encargado</Text>
                <Text style={{ fontSize: 7.5 }}>{report.encargado_nombre || ''}</Text>
              </View>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default ServiceReportPdf;
