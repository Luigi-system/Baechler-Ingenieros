import type { AIResponse, TableData, FormField, Action, ImageViewer, FileViewer, VideoPlayer, AudioPlayer, TableComponentData, RecordViewData, ColumnDefinition } from '../types';
import { extractAndParseJson } from '../utils/jsonParser';

/**
 * Envía una consulta estructurada al webhook del agente N8N mediante una solicitud GET.
 * Implementa un mecanismo de reintento para ser robusto frente a errores transitorios o respuestas inesperadas.
 * @param query La consulta en lenguaje natural del usuario.
 * @param userName El nombre del usuario actual.
 * @param webhookUrl La URL del webhook de N8N a la que se enviará la solicitud.
 * @param file Cadena opcional de un archivo codificado en base64.
 * @returns La respuesta estructurada de IA del agente.
 */
export const consultarAgente = async (
    query: string,
    userName: string,
    webhookUrl: string,
    file: string = ""
): Promise<AIResponse> => {
    
    // 1. Construir el payload: Se crea un objeto JSON con la estructura que espera el agente N8N.
    // Esto incluye la consulta del usuario, su nombre y cualquier archivo adjunto.
    const payload = {
        service: "chatbot",
        content: {
            action: "consultas",
            params: {
                query,
                userName,
                file
            }
        }
    };

    // 2. Serializar y codificar el payload: El objeto JSON se convierte en una cadena de texto (stringify)
    // y luego se codifica para que pueda ser transmitido de forma segura como parte de una URL (URL-encode).
    const queryString = encodeURIComponent(JSON.stringify(payload));
    
    // 3. Formar la URL final: El payload codificado se añade como un parámetro de consulta 'q' a la URL base del webhook.
    // Se verifica si la URL ya tiene parámetros para usar '&' o '?' correctamente.
    const urlWithQuery = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}q=${queryString}`;

    // 4. Configurar el mecanismo de reintentos: Se define un número máximo de intentos y variables para
    // almacenar el último error y la última respuesta cruda, útil para depuración si todos los intentos fallan.
    const maxRetries = 5;
    let lastError: any = null;
    let lastRawResponse: any = null; // Almacena la respuesta cruda para el mensaje de error final.

    // 5. Iniciar el bucle de reintentos: Se itera hasta el número máximo de reintentos.
    for (let i = 0; i < maxRetries; i++) {
        try {
            // 6. Realizar la solicitud HTTP: Se envía la solicitud GET al agente N8N.
            const response = await fetch(urlWithQuery, {
                method: 'GET',
            });

            // 7. Manejar respuestas no exitosas: Si el estado de la respuesta no es 2xx (ej. 404, 500),
            // se considera un error. Se lee el texto del error, se registra y se reintenta después de una espera.
            if (!response.ok) {
                const errorText = await response.text();
                lastError = new Error(`Error en la llamada al Agente N8N (${response.status}): ${errorText}`);
                console.warn(`Intento ${i + 1} fallido:`, lastError.message);
                if (i < maxRetries - 1) {
                    await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Espera exponencial (1s, 2s, 3s...)
                }
                continue; // Pasa al siguiente intento.
            }

            // 8. Procesar una respuesta exitosa: Si la respuesta es 2xx, se intenta decodificar como JSON.
            const rawJsonResponse = await response.json();
            lastRawResponse = rawJsonResponse; // Se guarda la respuesta cruda para depuración.

            let contentToProcess: any = null; // Variable para guardar el contenido principal a procesar.
            let textToParse: string | null = null; // Variable para guardar el texto que podría ser un JSON anidado.

            // 9. Normalizar la respuesta: La respuesta del webhook puede ser un array o un objeto. Se normaliza para trabajar siempre con un objeto.
            const responseData = Array.isArray(rawJsonResponse) ? rawJsonResponse[0] : rawJsonResponse;

            // 10. Extraer contenido anidado: Se intenta extraer el contenido relevante de dos formatos comunes de respuesta del agente.
            // Intento 1: Formato similar a Gemini, donde la respuesta está profundamente anidada.
            if (responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                textToParse = responseData.candidates[0].content.parts[0].text;
            }
            // Intento 2: Formato más antiguo o personalizado de N8N.
            else if (responseData?.content?.params?.respuesta) {
                textToParse = responseData.content.params.respuesta;
            }

            // 11. Decodificar el contenido anidado: Si se encontró un texto que podría ser un JSON (textToParse), se intenta decodificar.
            if (textToParse && typeof textToParse === 'string') {
                try {
                    contentToProcess = JSON.parse(textToParse);
                } catch (e) {
                    // Si falla la decodificación, se asume que es texto plano y se devuelve directamente.
                    console.warn("El contenido anidado no era un JSON válido, se tratará como texto plano.", e);
                    return { displayText: textToParse };
                }
            } else {
                // Si no se encontró contenido anidado, se procesa la respuesta JSON cruda directamente.
                contentToProcess = rawJsonResponse;
            }


            // 12. Analizar el contenido procesado: Se determina la estructura del contenido para mapearlo a un objeto `AIResponse`.
            let uiElementsArray: any[] | null = null; // Contendrá un array de elementos de UI si se detecta.
            let finalDisplayText: string | null = null; // Contendrá texto plano si esa es la respuesta.
            let aiResponseObject: AIResponse | null = null; // Contendrá un objeto `AIResponse` completo si se detecta.

            // Se evalúan varias estructuras posibles de la respuesta del agente.
            // Opción A: La respuesta ya es un objeto `AIResponse` completo.
            if (contentToProcess && typeof contentToProcess === 'object' && contentToProcess.displayText !== undefined) {
                aiResponseObject = contentToProcess as AIResponse;
            }
            // Opción B: La respuesta es un objeto con una clave "text" que contiene el array de elementos de UI.
            else if (contentToProcess && typeof contentToProcess === 'object' && Array.isArray(contentToProcess.text)) {
                uiElementsArray = contentToProcess.text;
            } 
            // Opción C: La respuesta es directamente un array de elementos de UI.
            else if (Array.isArray(contentToProcess) && contentToProcess.every((item: any) => typeof item === 'object' && item.type)) {
                uiElementsArray = contentToProcess;
            } 
            // Opción D: La respuesta es simplemente una cadena de texto.
            else if (typeof contentToProcess === 'string') {
                finalDisplayText = contentToProcess;
            }
            // Opción E: La respuesta es un objeto no reconocido, se convierte a texto para mostrarlo.
            else if (contentToProcess && typeof contentToProcess === 'object' && !Array.isArray(contentToProcess)) {
                 finalDisplayText = JSON.stringify(contentToProcess, null, 2);
            }

            // 13. Devolver la respuesta formateada.
            // Si se encontró un objeto `AIResponse` completo, se devuelve inmediatamente.
            if (aiResponseObject) {
                return aiResponseObject;
            }

            // Si se encontró un array de elementos de UI, se procesa cada elemento.
            if (Array.isArray(uiElementsArray)) {
                // Se inicializan contenedores para cada tipo de componente de la UI.
                let combinedDisplayText: string[] = [];
                let tableData: TableData | undefined = undefined; // Para tablas de formato antiguo.
                let aiResponseForm: FormField[] = [];
                let aiResponseActions: Action[] = [];

                // Contenedores para los nuevos componentes visuales.
                let imageViewer: ImageViewer | undefined = undefined;
                let fileViewer: FileViewer | undefined = undefined;
                let videoPlayer: VideoPlayer | undefined = undefined;
                let audioPlayer: AudioPlayer | undefined = undefined;
                let tableComponent: TableComponentData | undefined = undefined; // Para tablas de formato nuevo y enriquecido.
                let recordView: RecordViewData | undefined = undefined;
                let listComponent: { title?: string; items: any[]; itemTemplate?: Record<string, any> } | undefined = undefined;

                // Se itera sobre cada elemento de UI devuelto por el agente.
                for (const item of uiElementsArray) {
                    // Cada `if/else if` mapea un tipo de elemento del agente a su correspondiente
                    // estructura en el objeto `AIResponse`. Por ejemplo, `item.type === 'label'`
                    // se añade al `displayText`, `item.type === 'field'` se convierte en un
                    // campo de formulario, `item.type === 'table'` en un componente de tabla, etc.
                    // Este es el "traductor" principal entre la respuesta del agente y lo que la UI puede renderizar.
                    
                    // Mapea 'label' a texto simple.
                    if (item.type === 'label' && item.attributes?.text) {
                        combinedDisplayText.push(item.attributes.text);
                    } 
                    // Mapea varios tipos de campos de entrada a un formulario.
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
                                // Maneja opciones como ["string"] y [{value: "val", label: "Label"}].
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
                    // Mapea 'button' a acciones/botones.
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
                    // Mapea 'list' a un componente de lista y también a texto plano para el chat.
                    else if (item.type === 'list' && item.attributes?.items) {
                        listComponent = {
                            title: item.attributes.title,
                            items: item.attributes.items.map((li: any) => li.text || li),
                            itemTemplate: item.attributes.itemTemplate,
                        };
                        // Opcionalmente, se añade también al `displayText` para una representación simple.
                        if (!listComponent.title && combinedDisplayText.length > 0 && combinedDisplayText[combinedDisplayText.length - 1] !== '') {
                            combinedDisplayText.push('');
                        }
                        if (listComponent.title) {
                            combinedDisplayText.push(`**${listComponent.title}**`);
                        }
                        listComponent.items.forEach((listItem: string) => combinedDisplayText.push(`- ${listItem}`));
                        combinedDisplayText.push('');
                    }
                    // Mapea a componentes de visualización de medios.
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
                    // Mapea a componentes de visualización de datos.
                    else if (item.type === 'table' && item.attributes?.columns && item.attributes?.data) {
                        tableComponent = {
                            columns: item.attributes.columns.map((col: any) => {
                                // Maneja columnas definidas como string o como objeto.
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
                    // Fallback para mapear listas antiguas al formato de tabla simple.
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
                
                // 14. Construir el objeto final `AIResponse`: Se ensambla el objeto final con todos
                // los componentes de UI que se hayan extraído.
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

                // 15. Limpieza final: Se asegura de que el `displayText` no esté vacío o sea innecesario.
                if (finalAIResponse.displayText.trim() === '' && Object.keys(finalAIResponse).length > 1) {
                     finalAIResponse.displayText = '';
                } else if (finalAIResponse.displayText.trim() === '' && Object.keys(finalAIResponse).length === 1) {
                    finalAIResponse.displayText = 'No se pudo generar una respuesta significativa.';
                }

                // 16. Éxito: Se devuelve el objeto `AIResponse` bien formado y se sale del bucle de reintentos.
                return finalAIResponse;

            } else if (finalDisplayText) {
                // Si solo se extrajo texto plano, se devuelve en el formato `AIResponse` mínimo.
                return { displayText: finalDisplayText } as AIResponse;
            }
            
            // 17. Manejo de respuesta no reconocida: Si la estructura de la respuesta no coincide con
            // ninguna de las esperadas, se registra un error y se procede al siguiente reintento.
            lastError = new Error(`Respuesta del agente no estructurada: ${JSON.stringify(rawJsonResponse, null, 2)}`);
            console.warn(`Intento ${i + 1} fallido:`, lastError.message);
            if (i < maxRetries - 1) {
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Espera exponencial.
            }

        } catch (error: any) {
            // 18. Manejo de excepciones: Si ocurre un error en la red o al procesar el JSON,
            // se captura, se registra y se procede al siguiente reintento.
            lastError = error;
            console.error(`Intento ${i + 1} fallido por excepción:`, error);
            if (i < maxRetries - 1) {
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Espera exponencial.
            }
        }
    }
    
    // 19. Falla final: Si todos los reintentos fallan, se construye un mensaje de error final
    // utilizando la última información de error o la última respuesta cruda recibida.
    const finalMessage = lastError ? `Error final del agente: ${lastError.message}` : `Respuesta inesperada del agente después de ${maxRetries} intentos: ${JSON.stringify(lastRawResponse || {}, null, 2)}`;
    return {
        displayText: finalMessage,
        statusDisplay: { icon: 'error', title: 'Error del Agente', message: finalMessage }
    };
};