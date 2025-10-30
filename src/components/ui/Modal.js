"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Icons_1 = require("./Icons");
var Modal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, title = _a.title, children = _a.children, _b = _a.maxWidth, maxWidth = _b === void 0 ? 'max-w-lg' : _b, _c = _a.hasPadding, hasPadding = _c === void 0 ? true : _c;
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className={"bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ".concat(maxWidth, " transform transition-all overflow-hidden flex flex-col")} onClick={function (e) { return e.stopPropagation(); }}>
        {title && (<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
              <Icons_1.XIcon className="h-6 w-6"/>
            </button>
          </div>)}
        <div className={"".concat(hasPadding ? "p-6" : "", " overflow-y-auto custom-scrollbar")}>
          {children}
        </div>
      </div>
    </div>);
};
exports.default = Modal;
