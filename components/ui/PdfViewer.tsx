import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Spinner from './Spinner';

// Standard distribution of pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PdfViewerHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    download: () => void;
    getScale: () => number;
}

interface PdfViewerProps {
    file: string | Blob;
    className?: string;
    showAllPages?: boolean;
    hideToolbar?: boolean;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(({ file, className, showAllPages = true, hideToolbar = false }, ref) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Zoom settings
    const [scale, setScale] = useState<number>(1);
    const minScale = 0.5;
    const maxScale = 2.5;

    useImperativeHandle(ref, () => ({
        zoomIn: () => setScale(prev => Math.min(prev + 0.2, maxScale)),
        zoomOut: () => setScale(prev => Math.max(prev - 0.2, minScale)),
        download: handleDownload,
        getScale: () => scale
    }));

    function onDocumentLoadSuccess({ numPages: totalPages }: { numPages: number }) {
        setNumPages(totalPages);
    }

    useEffect(() => {
        const obs = new ResizeObserver((entries) => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        
        if (containerRef.current) {
            obs.observe(containerRef.current);
            setContainerWidth(containerRef.current.offsetWidth);
        }

        return () => obs.disconnect();
    }, []);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, maxScale));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, minScale));

    const handleDownload = () => {
        if (!file) return;
        const link = document.createElement('a');
        link.href = typeof file === 'string' ? file : URL.createObjectURL(file as Blob);
        link.download = `Documento_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div ref={containerRef} className={`relative w-full h-full flex flex-col items-center bg-base-300 scrollbar-thin scrollbar-thumb-primary/20 ${className}`}>
            <div className="w-full flex-grow overflow-auto flex flex-col items-center">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Spinner className="h-12 w-12 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral animate-pulse">Iniciando Motor de Lectura...</p>
                        </div>
                    }
                    error={
                        <div className="p-12 text-center space-y-4">
                            <div className="p-4 bg-error/10 rounded-full inline-block">
                                <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <p className="text-sm font-black uppercase text-error">Error al renderizar documento</p>
                            <p className="text-xs text-neutral max-w-xs mx-auto">El archivo PDF parece estar dañado o el navegador bloqueó el acceso.</p>
                        </div>
                    }
                    className="flex flex-col items-center gap-6 py-6"
                >
                    {numPages && (
                        showAllPages ? (
                            Array.from(new Array(numPages), (el, index) => (
                                <Page 
                                    key={`page_${index + 1}`} 
                                    pageNumber={index + 1} 
                                    width={containerWidth > 40 ? (containerWidth - 40) * scale : undefined}
                                    className="shadow-2xl border border-base-border rounded-sm overflow-hidden bg-white selection:bg-primary/20"
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    loading={<div className="h-96 w-full bg-base-200 animate-pulse flex items-center justify-center"><Spinner className="h-8 w-8 opacity-20" /></div>}
                                />
                            ))
                        ) : (
                            <Page 
                                pageNumber={1} 
                                width={containerWidth > 40 ? (containerWidth - 40) * scale : undefined}
                                className="shadow-2xl border border-base-border rounded-sm overflow-hidden bg-white"
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                        )
                    )}
                </Document>
            </div>

            {/* Floating Toolbar */}
            {numPages && (
                <div className="fixed md:absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                        <button 
                            type="button"
                            onClick={handleZoomOut} 
                            disabled={scale <= minScale}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 transition-all focus:outline-none"
                            title="Reducir"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                        </button>
                        <span className="text-[10px] font-black text-white w-10 text-center">{Math.round(scale * 100)}%</span>
                        <button 
                            type="button"
                            onClick={handleZoomIn} 
                            disabled={scale >= maxScale}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 transition-all focus:outline-none"
                            title="Aumentar"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest px-2 hidden sm:block">
                        {numPages} {numPages === 1 ? 'PÁG' : 'PÁGS'}
                    </p>

                    <button 
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-content rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-focus transition-all active:scale-95 shadow-lg shadow-primary/20 focus:outline-none"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span className="hidden xs:inline">Descargar</span>
                    </button>
                </div>
            )}
        </div>
    );
});

export default PdfViewer;
