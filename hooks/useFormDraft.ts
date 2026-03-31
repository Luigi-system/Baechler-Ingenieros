import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage form drafts in localStorage and IndexedDB (for files).
 */
export function useFormDraft<T>(
    key: string,
    formData: Partial<T>,
    setFormData: (data: Partial<T> | ((prev: Partial<T>) => Partial<T>)) => void,
    isEnabled: boolean = true,
    fileStates?: { 
        name: string, 
        files: File[], 
        setFiles: (files: File[]) => void 
    }[]
) {
    const isFirstRender = useRef(true);
    const dbName = 'ReportAiDrafts';
    const storeName = 'files';

    // Helper to open IndexedDB
    const openDB = (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    // Initial load
    useEffect(() => {
        if (!isEnabled) return;
        
        const loadDraft = async () => {
            // Load text data from localStorage
            const savedDraft = localStorage.getItem(key);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    setFormData(prev => ({ ...prev, ...parsedDraft }));
                } catch (error) {
                    console.error(`Error loading draft for ${key}:`, error);
                }
            }

            // Load files from IndexedDB
            if (fileStates && fileStates.length > 0) {
                try {
                    const db = await openDB();
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    
                    for (const state of fileStates) {
                        const fileKey = `${key}_files_${state.name}`;
                        const request = store.get(fileKey);
                        request.onsuccess = () => {
                            const blobs = request.result as Blob[] || [];
                            if (blobs.length > 0) {
                                // Re-create File objects from Blobs
                                const restoredFiles = blobs.map((blob, idx) => 
                                    new File([blob], `restored_${state.name}_${idx}.png`, { type: blob.type })
                                );
                                state.setFiles(restoredFiles);
                            }
                        };
                    }
                } catch (e) {
                    console.error("IndexedDB error on load:", e);
                }
            }
            isFirstRender.current = false;
        };

        loadDraft();
    }, [key, isEnabled]);

    // Save on change (Debounced)
    useEffect(() => {
        if (!isEnabled || isFirstRender.current) return;

        const timeoutId = setTimeout(async () => {
            // 1. Save text data to localStorage
            const sanitizedData: any = { ...formData };
            Object.keys(sanitizedData).forEach(k => {
                const val = sanitizedData[k];
                // Strip data URIs again to be safe
                if (typeof val === 'string' && val.startsWith('data:image')) {
                    delete sanitizedData[k];
                }
                if (Array.isArray(val)) {
                    sanitizedData[k] = val.filter(item => typeof item !== 'string' || !item.startsWith('data:image'));
                }
            });
            localStorage.setItem(key, JSON.stringify(sanitizedData));

            // 2. Save files to IndexedDB
            if (fileStates && fileStates.length > 0) {
                try {
                    const db = await openDB();
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    
                    for (const state of fileStates) {
                        const fileKey = `${key}_files_${state.name}`;
                        // IndexedDB can store Blobs/Files directly
                        store.put(state.files, fileKey);
                    }
                } catch (e) {
                    console.error("IndexedDB error on save:", e);
                }
            }
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [formData, key, isEnabled, fileStates]);

    const clearDraft = async () => {
        localStorage.removeItem(key);
        try {
            const db = await openDB();
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            if (fileStates) {
                fileStates.forEach(state => {
                    store.delete(`${key}_files_${state.name}`);
                });
            }
        } catch (e) {
            console.error("IndexedDB error on clear:", e);
        }
    };

    return { clearDraft };
}
