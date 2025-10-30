"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var GoogleAuthContext_1 = require("../../contexts/GoogleAuthContext");
var Icons_1 = require("../ui/Icons");
var Spinner_1 = require("../ui/Spinner");
var GoogleDocViewer = function () {
    var _a = (0, GoogleAuthContext_1.useGoogleAuth)(), isSignedIn = _a.isSignedIn, currentUserEmail = _a.currentUserEmail;
    var _b = (0, react_1.useState)(''), docUrl = _b[0], setDocUrl = _b[1];
    var _c = (0, react_1.useState)(null), embeddedUrl = _c[0], setEmbeddedUrl = _c[1];
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    var extractDocId = function (url) {
        var docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docIdMatch && docIdMatch[1]) {
            return docIdMatch[1];
        }
        return null;
    };
    var handleLoadDocument = function () {
        setError(null);
        setLoading(true);
        setEmbeddedUrl(null);
        if (!isSignedIn) {
            setError("Por favor, conéctate a tu cuenta de Google en 'Configuración > Integraciones > Google Drive' para usar el visualizador.");
            setLoading(false);
            return;
        }
        if (!docUrl.trim()) {
            setError("Por favor, introduce una URL de documento de Google válida.");
            setLoading(false);
            return;
        }
        var docId = extractDocId(docUrl);
        if (docId) {
            // Use the 'edit' mode to allow editing directly
            setEmbeddedUrl("https://docs.google.com/document/d/".concat(docId, "/edit?usp=sharing"));
            setLoading(false);
        }
        else {
            setError("URL de Google Doc inválida. Asegúrate de que sea un enlace de Google Docs.");
            setLoading(false);
        }
    };
    var displayMessage = (0, react_1.useMemo)(function () {
        if (!isSignedIn) {
            return (<div className="flex flex-col items-center justify-center h-full text-neutral-content text-center px-4">
          <Icons_1.DocumentIcon className="h-16 w-16 mb-4 text-primary"/>
          <p className="text-xl font-semibold mb-2">Google Drive no conectado</p>
          <p className="text-sm">Por favor, conéctate a tu cuenta de Google en la sección de integraciones para visualizar y editar documentos.</p>
        </div>);
        }
        if (loading) {
            return (<div className="flex flex-col items-center justify-center h-full text-neutral-content">
          <Spinner_1.default />
          <p className="mt-2 text-sm">Cargando documento...</p>
        </div>);
        }
        if (error) {
            return (<div className="flex flex-col items-center justify-center h-full text-error text-center px-4">
          <Icons_1.DocumentIcon className="h-16 w-16 mb-4 text-error"/>
          <p className="text-xl font-semibold mb-2">Error al cargar documento</p>
          <p className="text-sm">{error}</p>
        </div>);
        }
        if (!embeddedUrl) {
            return (<div className="flex flex-col items-center justify-center h-full text-neutral-content text-center px-4">
          <Icons_1.DocumentIcon className="h-16 w-16 mb-4 text-neutral"/>
          <p className="text-xl font-semibold mb-2">Introduce la URL de un Google Doc</p>
          <p className="text-sm">Pega un enlace de Google Docs (e.g., Google Docs, Sheets, Slides) para empezar a visualizar y editar.</p>
        </div>);
        }
        return null;
    }, [isSignedIn, loading, error, embeddedUrl]);
    return (<div className="flex flex-col h-full space-y-6">
      <div className="flex items-center mb-4">
        <h2 className="text-3xl font-bold text-base-content flex items-center gap-2">
          <Icons_1.DocumentIcon className="h-8 w-8 text-primary"/> Visualizador de Documentos de Google
        </h2>
      </div>

      <div className="bg-base-200 p-6 rounded-xl shadow-lg flex items-center space-x-4 flex-wrap">
        <label htmlFor="doc-url" className="sr-only">URL del Documento de Google</label>
        <input id="doc-url" type="url" value={docUrl} onChange={function (e) { return setDocUrl(e.target.value); }} placeholder="Pega la URL de tu Google Doc aquí (ej. https://docs.google.com/document/d/.../edit)" className="flex-grow min-w-[300px] input-style" disabled={!isSignedIn || loading}/>
        <button onClick={handleLoadDocument} disabled={!isSignedIn || loading || !docUrl.trim()} className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed">
          {loading ? <Spinner_1.default /> : <Icons_1.DocumentIcon className="h-5 w-5"/>}
          {loading ? 'Cargando...' : 'Cargar Documento'}
        </button>
      </div>

      <div className="flex-1 bg-base-200 rounded-xl shadow-lg overflow-hidden flex items-center justify-center">
        {displayMessage ? (displayMessage) : (<iframe src={embeddedUrl || ''} title="Google Document Viewer" className="w-full h-full border-0" allowFullScreen></iframe>)}
      </div>
    </div>);
};
exports.default = GoogleDocViewer;
