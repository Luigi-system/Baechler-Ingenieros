import React from 'react';
import { ImageIcon, XIcon, PlusIcon } from './Icons';

interface ImageUploadProps {
    id: string;
    label: string;
    files: File[];
    onFilesChange: (files: File[]) => void;
    multiple?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
    id, 
    label, 
    files, 
    onFilesChange, 
    multiple = true 
}) => {
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            onFilesChange(multiple ? [...files, ...newFiles] : newFiles);
            // Reset input value to allow re-uploading the same file
            e.target.value = ''; 
        }
    };

    const removeFile = (index: number) => {
        onFilesChange(files.filter((_, i) => i !== index));
    };

    return (
        <div className="mt-2">
            {label && <label className="block text-sm font-medium mb-1">{label}</label>}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <div key={index} className="relative group">
                            <img 
                                src={URL.createObjectURL(file)} 
                                alt="preview" 
                                className="h-20 w-20 rounded-md object-cover border border-base-border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button 
                                    type="button"
                                    onClick={() => removeFile(index)} 
                                    className="text-white rounded-full p-1 bg-error/80 hover:bg-error"
                                    aria-label="Remove image"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                     {(multiple || files.length === 0) && (
                        <label 
                            htmlFor={id} 
                            className="relative cursor-pointer bg-base-100 rounded-md font-medium text-neutral h-20 w-20 flex items-center justify-center border-2 border-dashed border-base-border hover:border-primary transition"
                        >
                            <div className="flex flex-col items-center">
                                <PlusIcon className="h-6 w-6" />
                                <span className="text-xs mt-1">{multiple ? 'Añadir' : 'Subir'}</span>
                            </div>
                            <input 
                                id={id} 
                                name={id} 
                                type="file" 
                                className="sr-only" 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                multiple={multiple} 
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
