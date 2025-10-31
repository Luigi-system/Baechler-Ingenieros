
import type { AIResponse } from '../types';

/**
 * Sends a structured query to the N8N agent webhook via a GET request.
 * Implements a retry mechanism for robustness against transient errors or unexpected responses.
 * @param query The user's natural language query.
 * @param userName The name of the current user.
 * @param webhookUrl The N8N webhook URL to send the request to.
 * @param file Optional base64 encoded file string.
 * @returns The structured AI response from the agent.
 */
export const consultarAgente = async (
    query: string,
    userName: string,
    webhookUrl: string,
    file: string = ""
): Promise<AIResponse> => {
    
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

    // Stringify and URL-encode the payload to be sent as a query parameter.
    const queryString = encodeURIComponent(JSON.stringify(payload));
    
    // Append the encoded payload as a query parameter 'q'.
    const urlWithQuery = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}q=${queryString}`;

    const maxRetries = 5;
    let lastError: any = null;
    let lastJsonResponse: any = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(urlWithQuery, {
                method: 'GET',
            });

            if (!response.ok) {
                const errorText = await response.text();
                lastError = new Error(`Error en la llamada al Agente N8N (${response.status}): ${errorText}`);
                console.warn(`Intento ${i + 1} fallido:`, lastError.message);
                if (i < maxRetries - 1) {
                    await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
                }
                continue;
            }

            const jsonResponse = await response.json();
            lastJsonResponse = jsonResponse;

            // Check if the response is an array and has the expected nested 'respuesta'
            if (Array.isArray(jsonResponse) && jsonResponse.length > 0 && 
                jsonResponse[0]?.content?.params?.respuesta) {
                
                const responseText = jsonResponse[0].content.params.respuesta;
                return {
                    displayText: responseText,
                };
            }
            
            // If it's not the nested array format, try to interpret it as a direct AIResponse object
            if (jsonResponse.displayText || jsonResponse.table || jsonResponse.chart || jsonResponse.actions || jsonResponse.form || jsonResponse.statusDisplay || jsonResponse.suggestions) {
                return jsonResponse as AIResponse;
            }

            // If the response is not in the expected format, treat as unexpected.
            lastError = new Error(`Respuesta del agente no estructurada: ${JSON.stringify(jsonResponse, null, 2)}`);
            console.warn(`Intento ${i + 1} fallido:`, lastError.message);
            if (i < maxRetries - 1) {
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
            }

        } catch (error: any) {
            lastError = error;
            console.error(`Intento ${i + 1} fallido por excepción:`, error);
            if (i < maxRetries - 1) {
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
            }
        }
    }
    
    // If all retries failed, return a generic unexpected response message with the last observed data/error.
    const finalMessage = lastError ? `Error final del agente: ${lastError.message}` : `Respuesta inesperada del agente después de ${maxRetries} intentos: ${JSON.stringify(lastJsonResponse || {}, null, 2)}`;
    return {
        displayText: finalMessage,
        statusDisplay: { icon: 'error', title: 'Error del Agente', message: finalMessage }
    };
};
