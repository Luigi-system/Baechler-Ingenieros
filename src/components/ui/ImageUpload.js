"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Icons_1 = require("./Icons");
var ImageUpload = function (_a) {
    var id = _a.id, label = _a.label, files = _a.files, onFilesChange = _a.onFilesChange, _b = _a.multiple, multiple = _b === void 0 ? true : _b;
    var handleFileChange = function (e) {
        if (e.target.files) {
            var newFiles = Array.from(e.target.files);
            onFilesChange(multiple ? __spreadArray(__spreadArray([], files, true), newFiles, true) : newFiles);
            // Reset input value to allow re-uploading the same file
            e.target.value = '';
        }
    };
    var removeFile = function (index) {
        onFilesChange(files.filter(function (_, i) { return i !== index; }));
    };
    return (<div className="mt-2">
            {label && <label className="block text-sm font-medium mb-1">{label}</label>}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-wrap gap-2">
                    {files.map(function (file, index) { return (<div key={index} className="relative group">
                            <img src={URL.createObjectURL(file)} alt="preview" className="h-20 w-20 rounded-md object-cover border border-base-border"/>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button type="button" onClick={function () { return removeFile(index); }} className="text-white rounded-full p-1 bg-error/80 hover:bg-error" aria-label="Remove image">
                                    <Icons_1.XIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>); })}
                     {(multiple || files.length === 0) && (<label htmlFor={id} className="relative cursor-pointer bg-base-100 rounded-md font-medium text-neutral h-20 w-20 flex items-center justify-center border-2 border-dashed border-base-border hover:border-primary transition">
                            <div className="flex flex-col items-center">
                                <Icons_1.PlusIcon className="h-6 w-6"/>
                                <span className="text-xs mt-1">{multiple ? 'Añadir' : 'Subir'}</span>
                            </div>
                            <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" multiple={multiple}/>
                        </label>)}
                </div>
            </div>
        </div>);
};
exports.default = ImageUpload;
