

import type { AIResponse, N8nSettings, TableData, FormField, Action, ImageViewer, FileViewer, VideoPlayer, AudioPlayer, TableComponentData, RecordViewData, ColumnDefinition } from '../types';
import { extractAndParseJson } from '../utils/jsonParser';

/**
 * Envía una consulta estructurada al webhook del agente N8N mediante una solicitud GET o POST.
 * Implementa un mecanismo de reintento para ser robusto frente a errores transitorios o respuestas inesperadas.
 * @param query La consulta en lenguaje natural del usuario.
 * @param userName El nombre del usuario actual.
 * @param n8nSettings El objeto de configuración del agente N8N, que incluye la URL, el método y los encabezados.
 * @param file Cadena opcional de un archivo codificado en base64.
 * @returns La respuesta estructurada de IA del agente.
 */
export const consultarAgente = async (
    query: string,
    userName: string,
    n8nSettings: N8nSettings,
    file: string = ""
): Promise<AIResponse> => {
    
    const { webhookUrl, method, headers } = n8nSettings;

    // 1. Construir el payload en el formato correcto
    const payload = {
        service: "consultaAI",
        content: {
            query,
            params: {
                userName,
                file
            }
        }
    };

    // 2. Configurar el mecanismo de reintentos
    const maxRetries = 5;
    let lastError: any = null;
    let lastRawResponse: any = null; 

    // 3. Iniciar el bucle de reintentos
    for (let i = 0; i < maxRetries; i++) {
        try {
            let response: Response;

            // 4. Realizar la solicitud HTTP según el método configurado
            if (method === 'POST') {
                response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Default, puede ser sobrescrito por los headers del usuario
                        ...headers,
                    },
                    body: JSON.stringify(payload)
                });
            } else { // 'GET'
                const queryString = encodeURIComponent(JSON.stringify(payload));
                const urlWithQuery = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}q=${queryString}`;
                response = await fetch(urlWithQuery, {
                    method: 'GET',
                    headers: headers
                });
            }

            // 5. Manejar respuestas no exitosas
            if (!response.ok) {
                const errorText = await response.text();
                lastError = new Error(`Error en la llamada al Agente N8N (${response.status}): ${errorText}`);
                console.warn(`Intento ${i + 1} fallido:`, lastError.message);
                if (i < maxRetries - 1) {
                    await new Promise(res => setTimeout(res, 1000 * (i + 1))); 
                }
                continue; 
            }

            // 6. Procesar una respuesta exitosa
            const rawJsonResponse = await response.json();
            lastRawResponse = rawJsonResponse; 

            const responseData = Array.isArray(rawJsonResponse) ? rawJsonResponse[0] : rawJsonResponse;

            if (responseData && responseData.status === 'success' && responseData.data && responseData.data.component) {
                console.log("Se detectó el nuevo formato del Agente N8N. Usando el objeto 'component'.");
                return responseData.data.component as AIResponse;
            }

            let contentToProcess: any = null; 
            let textToParse: string | null = null; 

            if (responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                textToParse = responseData.candidates[0].content.parts[0].text;
            }
            else if (responseData?.content?.params?.respuesta) {
                textToParse = responseData.content.params.respuesta;
            }

            if (textToParse && typeof textToParse === 'string') {
                try {
                    contentToProcess = JSON.parse(textToParse);
                } catch (e) {
                    console.warn("El contenido anidado no era un JSON válido, se tratará como texto plano.", e);
                    return { displayText: textToParse };
                }
            } else {
                contentToProcess = rawJsonResponse;
            }


            let uiElementsArray: any[] | null = null;
            let finalDisplayText: string | null = null;
            let aiResponseObject: AIResponse | null = null;

            if (contentToProcess && typeof contentToProcess === 'object' && contentToProcess.displayText !== undefined) {
                aiResponseObject = contentToProcess as AIResponse;
            }
            else if (contentToProcess && typeof contentToProcess === 'object' && Array.isArray(contentToProcess.text)) {
                uiElementsArray = contentToProcess.text;
            } 
            else if (Array.isArray(contentToProcess) && contentToProcess.every((item: any) => typeof item === 'object' && item.type)) {
                uiElementsArray = contentToProcess;
            } 
            else if (typeof contentToProcess === 'string') {
                finalDisplayText = contentToProcess;
            }
            else if (contentToProcess && typeof contentToProcess === 'object' && !Array.isArray(contentToProcess)) {
                 finalDisplayText = JSON.stringify(contentToProcess, null, 2);
            }

            if (aiResponseObject) {
                return aiResponseObject;
            }

            if (Array.isArray(uiElementsArray)) {
                let combinedDisplayText: string[] = [];
                let tableData: TableData | undefined = undefined; 
                let aiResponseForm: FormField[] = [];
                let aiResponseActions: Action[] = [];
                let imageViewer: ImageViewer | undefined = undefined;
                let fileViewer: FileViewer | undefined = undefined;
                let videoPlayer: VideoPlayer | undefined = undefined;
                let audioPlayer: AudioPlayer | undefined = undefined;
                let tableComponent: TableComponentData | undefined = undefined;
                let recordView: RecordViewData | undefined = undefined;
                let listComponent: { title?: string; items: any[]; itemTemplate?: Record<string, any> } | undefined = undefined;

                for (const item of uiElementsArray) {
                    if (item.type === 'label' && item.attributes?.text) {
                        combinedDisplayText.push(item.attributes.text);
                    } 
                    else if (item.type === 'field' && item.attributes?.label) {
                        aiResponseForm.push({
                            type: 'field',
                            name: item.attributes.name || item.attributes.label.toLowerCase().replace(/\s/g, '_'),
                            label: item.attributes.label,
                            inputType: item.attributes.inputType || 'text',
                            placeholder: item.attributes.placeholder || item.attributes.label,
                            value: item.attributes.value,
                        });
                    } else if (item.type === 'checkbox' && item.attributes?.label) {
                        aiResponseForm.push({
                            type: 'checkbox',
                            name: item.attributes.name || item.attributes.label.toLowerCase().replace(/\s/g, '_'),
                            label: item.attributes.label,
                            checked: item.attributes.checked || false,
                            value: item.attributes.checked,
                        });
                    } else if (item.type === 'combobox' && item.attributes?.label && item.attributes?.options) {
                        aiResponseForm.push({
                            type: 'combobox',
                            name: item.attributes.name || item.attributes.label.toLowerCase().replace(/\s/g, '_'),
                            label: item.attributes.label,
                            options: item.attributes.options.map((opt: any) => {
                                if (typeof opt === 'string') return `${opt}: ${opt}`; 
                                return `${opt.value}: ${opt.label}`; 
                            }),
                            placeholder: item.attributes.placeholder || item.attributes.label,
                            selected: item.attributes.selected,
                            value: item.attributes.selected,
                        });
                    } else if (item.type === 'hidden' && item.attributes?.name) {
                        aiResponseForm.push({
                            type: 'hidden',
                            name: item.attributes.name,
                            label: '',
                            value: item.attributes.value,
                        });
                    } else if (item.type === 'file_base64' && item.attributes?.label) {
                        aiResponseForm.push({
                            type: 'file_upload',
                            name: item.attributes.name || item.attributes.label.toLowerCase().replace(/\s/g, '_'),
                            label: item.attributes.label,
                            mimeType: item.attributes.mimeType,
                            placeholder: item.attributes.label,
                        });
                    } 
                    else if (item.type === 'button' && item.attributes?.label && (item.attributes?.action || item.attributes?.prompt)) {
                        aiResponseActions.push({
                            label: item.attributes.label,
                            prompt: item.attributes.prompt || `Ejecuta la acción: "${item.attributes.action}"` +
                                    (item.attributes.api ? ` llamando a la API: "${item.attributes.api}"` : '') +
                                    (item.attributes.method ? ` con el método: "${item.attributes.method}"` : ''),
                            api: item.attributes.api,
                            method: item.attributes.method,
                            style: item.attributes.style || 'primary',
                        });
                    }
                    else if (item.type === 'list' && item.attributes?.items) {
                        listComponent = {
                            title: item.attributes.title,
                            items: item.attributes.items.map((li: any) => li.text || li),
                            itemTemplate: item.attributes.itemTemplate,
                        };
                        if (!listComponent.title && combinedDisplayText.length > 0 && combinedDisplayText[combinedDisplayText.length - 1] !== '') {
                            combinedDisplayText.push('');
                        }
                        if (listComponent.title) {
                            combinedDisplayText.push(`**${listComponent.title}**`);
                        }
                        listComponent.items.forEach((listItem: string) => combinedDisplayText.push(`- ${listItem}`));
                        combinedDisplayText.push('');
                    }
                    else if (item.type === 'image_viewer' && item.attributes?.src) {
                        imageViewer = {
                            src: item.attributes.src,
                            alt: item.attributes.alt || 'Imagen',
                            width: item.attributes.width,
                            height: item.attributes.height,
                            clickAction: item.attributes.clickAction,
                        };
                    } else if (item.type === 'file_viewer' && item.attributes?.src && item.attributes?.fileName && item.attributes?.mimeType) {
                        fileViewer = {
                            src: item.attributes.src,
                            fileName: item.attributes.fileName,
                            mimeType: item.attributes.mimeType,
                            downloadable: item.attributes.downloadable,
                        };
                    } else if (item.type === 'video_player' && item.attributes?.src) {
                        videoPlayer = {
                            src: item.attributes.src,
                            autoplay: item.attributes.autoplay,
                            controls: item.attributes.controls,
                            loop: item.attributes.loop,
                        };
                    } else if (item.type === 'audio_player' && item.attributes?.src) {
                        audioPlayer = {
                            src: item.attributes.src,
                            controls: item.attributes.controls,
                            autoplay: item.attributes.autoplay,
                            loop: item.attributes.loop,
                        };
                    }
                    else if (item.type === 'table' && item.attributes?.columns && item.attributes?.data) {
                        tableComponent = {
                            columns: item.attributes.columns.map((col: any) => {
                                if (typeof col === 'string') {
                                    return { header: col, accessor: col };
                                }
                                return {
                                    header: col.label || col.key,
                                    accessor: col.key,
                                };
                            }),
                            data: item.attributes.data,
                            pagination: item.attributes.pagination,
                            actions: item.attributes.actions?.map((action: any) => ({
                                label: action.label,
                                prompt: action.prompt || `Ejecuta la acción de tabla: "${action.action}" para ${action.api || ''}`,
                                api: action.api,
                                method: action.method,
                                style: action.style || 'primary',
                            })),
                        };
                    } else if (item.type === 'record_view' && item.attributes?.fields) {
                        recordView = {
                            fields: item.attributes.fields.map((field: any) => {
                                const fieldData = field.attributes || field; 
                                return {
                                    label: fieldData.label,
                                    value: fieldData.value,
                                };
                            }),
                            editable: item.attributes.editable,
                        };
                    }
                     else if (item.type === 'list' && item.attributes?.items && !listComponent) { 
                        if (item.attributes?.title) {
                            combinedDisplayText.push(`**${item.attributes.title}**`);
                        }
                        tableData = {
                            headers: ['Item'],
                            rows: item.attributes.items.map((str: string) => [str])
                        };
                    }
                }
                
                const finalAIResponse: AIResponse = {
                    displayText: combinedDisplayText.filter(Boolean).join('\n\n').trim(),
                    actions: aiResponseActions.length > 0 ? aiResponseActions : undefined,
                    form: aiResponseForm.length > 0 ? aiResponseForm : undefined,
                    imageViewer: imageViewer,
                    fileViewer: fileViewer,
                    videoPlayer: videoPlayer,
                    audioPlayer: audioPlayer,
                    tableComponent: tableComponent,
                    recordView: recordView,
                    list: listComponent,
                    table: tableData,
                };

                if (finalAIResponse.displayText.trim() === '' && Object.keys(finalAIResponse).length > 1) {
                     finalAIResponse.displayText = '';
                } else if (finalAIResponse.displayText.trim() === '' && Object.keys(finalAIResponse).length === 1) {
                    finalAIResponse.displayText = 'No se pudo generar una respuesta significativa.';
                }

                return finalAIResponse;

            } else if (finalDisplayText) {
                return { displayText: finalDisplayText } as AIResponse;
            }
            
            lastError = new Error(`Respuesta del agente no estructurada: ${JSON.stringify(rawJsonResponse, null, 2)}`);
            console.warn(`Intento ${i + 1} fallido:`, lastError.message);
            if (i < maxRetries - 1) {
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); 
            }

        } catch (error: any) {
            lastError = error;
            console.error(`Intento ${i + 1} fallido por excepción:`, error);
            if (i < maxRetries - 1) {
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); 
            }
        }
    }
    
    const finalMessage = lastError ? `Error final del agente: ${lastError.message}` : `Respuesta inesperada del agente después de ${maxRetries} intentos: ${JSON.stringify(lastRawResponse || {}, null, 2)}`;
    return {
        displayText: finalMessage,
        statusDisplay: { icon: 'error', title: 'Error del Agente', message: finalMessage }
    };
};
