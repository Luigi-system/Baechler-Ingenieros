"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Icons_1 = require("./Icons");
var PdfViewerModal = function (_a) {
    var pdfDataUri = _a.pdfDataUri, onClose = _a.onClose;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] transform transition-all flex flex-col" onClick={function (e) { return e.stopPropagation(); }}>
        <div className="flex items-center justify-between p-2 bg-gray-900 rounded-t-xl shrink-0">
          <h3 className="text-lg font-semibold text-white ml-4">Previsualización de PDF</h3>
          <button onClick={onClose} className="p-2 rounded-full text-gray-300 hover:bg-gray-700">
            <Icons_1.XIcon className="h-6 w-6"/>
          </button>
        </div>
        <div className="p-2 flex-grow">
            <iframe src={pdfDataUri} title="PDF Viewer" className="w-full h-full border-0 rounded-b-lg"/>
        </div>
      </div>
    </div>);
};
exports.default = PdfViewerModal;
