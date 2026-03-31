
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { VisitReport } from '../../types';

const styles = StyleSheet.create({
  page: {
    padding: 15,
    paddingBottom: 120, // Espacio para el footer absoluto
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
    height: 'auto',
  },
  companyInfoContainer: {
    flexDirection: 'column',
    marginLeft: 5,
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
  headerCenter: {
    flex: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  titleBox: {
    padding: 6,
    width: '60%',
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
  },

  // Big Text Blocks
  textBlockContent: {
    border: '1px solid #000',
    padding: 6,
    minHeight: 120,
    fontSize: 8.5,
    marginBottom: 5,
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
    minHeight: 60,
  },
  signatureImage: {
    height: 50,
    width: 'auto',
    marginBottom: 2,
  }
});

interface Props {
  report: Partial<VisitReport>;
  logoUrl?: string;
  serial?: string;
}

const cleanBase64 = (str: string | null | undefined) => {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  return `data:image/png;base64,${trimmed}`;
};

const VisitReportPdf = ({ report, logoUrl, serial }: Props) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          {/* FILA 1: LOGO, EMPRESA Y QR/SERIAL */}
          <View style={styles.headerTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ type: 'visit', id: report.id }))}`}
                  style={styles.qrPlaceholder} 
                />
              )}
              <Text style={styles.serialNumber}>Nº {report.id ? String(report.id).padStart(6, '0') : (serial || report.codigo || "")}</Text>
            </View>
          </View>

          {/* FILA 2: TITULO */}
          <View style={styles.headerBottomRow}>
            <View style={styles.titleBox}>
              <Text style={styles.titleText}>REPORTE DE VISITA TÉCNICA</Text>
            </View>
          </View>
        </View>

        {/* DATOS GENERALES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE Y VISITA</Text>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.label}>CLIENTE:</Text>
            <Text style={styles.value}>{report.empresa_nombre || ''}</Text>
          </View>
          <View style={[styles.tableCol, styles.lastCol]}>
            <Text style={styles.label}>FECHA:</Text>
            <Text style={styles.value}>{report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.label}>PLANTA / SEDE:</Text>
            <Text style={styles.value}>{report.empresa_planta || ''}</Text>
          </View>
          <View style={[styles.tableCol, styles.lastCol]}>
            <Text style={styles.label}>TÉCNICO:</Text>
            <Text style={styles.value}>{report.usuario_nombre || ''}</Text>
          </View>
        </View>

        {/* MAQUINAS VISITADAS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MÁQUINAS / EQUIPOS EVALUADOS</Text>
        </View>
        {Array.isArray(report.maquinas) && report.maquinas.length > 0 ? (
          report.maquinas.map((maquina, index) => {
            const [label, ...rest] = maquina.split(': ');
            const observations = rest.join(': ');
            return (
              <View key={index} style={styles.tableRow} wrap={false}>
                <View style={[styles.tableCol, styles.lastCol, { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 8 }]}>
                  <Text style={[styles.label, { textTransform: 'uppercase', marginBottom: 4 }]}>
                    • {label}
                  </Text>
                  {observations && (
                    <View style={{ paddingLeft: 12, paddingTop: 2 }}>
                      <Text style={styles.value}>{observations}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, styles.lastCol]}>
              <Text style={styles.value}>
                {typeof report.maquinas === 'string' && report.maquinas.trim() !== '' 
                  ? report.maquinas 
                  : 'No se registraron máquinas.'}
              </Text>
            </View>
          </View>
        )}

        {/* BODY TEXT BLOCKS */}
        <View wrap={false}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>OBSERVACIONES ENCONTRADAS:</Text></View>
          <Text style={styles.textBlockContent}>{report.observaciones || ''}</Text>
          
          {report.fotos_observaciones && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
              {(typeof report.fotos_observaciones === 'string' ? report.fotos_observaciones.split(',') : []).filter(Boolean).map((img, i) => (
                <Image key={i} src={cleanBase64(img)} style={{ width: 130, height: 'auto', marginRight: 10, marginBottom: 10, border: '1px solid #CCC', borderRadius: 2 }} />
              ))}
            </View>
          )}
        </View>

        <View wrap={false}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>SUGERENCIAS Y RECOMENDACIONES:</Text></View>
          <Text style={styles.textBlockContent}>{report.sugerencias || ''}</Text>

          {report.fotos_sugerencias && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
              {(typeof report.fotos_sugerencias === 'string' ? report.fotos_sugerencias.split(',') : []).filter(Boolean).map((img, i) => (
                <Image key={i} src={cleanBase64(img)} style={{ width: 130, height: 'auto', marginRight: 10, marginBottom: 10, border: '1px solid #CCC', borderRadius: 2 }} />
              ))}
            </View>
          )}
        </View>

        <View style={{ flexGrow: 1 }} />

        {/* FOOTER - ONLY AT THE BOTTOM OF THE LAST PAGE */}
        <View style={styles.footer} wrap={false}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Servicio Realizado Por: <Text style={styles.value}>{report.usuario_nombre || ''}</Text></Text>
            <Text style={styles.footerLabel}>Celular: <Text style={styles.value}>{report.usuario_cel || ''}</Text></Text>
          </View>

          <View style={styles.footerCol}>
            <View style={styles.signatureContainer}>
              {report.foto_firma && <Image src={cleanBase64(report.foto_firma)} style={styles.signatureImage} />}
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

export default VisitReportPdf;
