// services/agenteService.ts

// Define a client for the external AI "agente" service
export interface AgenteClient {
  sendToAgent: (payload: string | object, webhookUrl: string) => Promise<any>;
}

export const createAgenteClient = (): AgenteClient => {
  return {
    /**
     * Sends a payload to the configured external agent webhook.
     * The webhook is expected to interpret this payload (either a natural language query or structured data for insertion)
     * and return a structured response.
     * @param payload The natural language query from the user (string) or structured data for insertion (object).
     * @param webhookUrl The URL of the external agent webhook.
     * @returns A Promise that resolves with the agent's structured response (expected AIResponse format or raw data).
     */
    sendToAgent: async (payload: string | object, webhookUrl: string) => {
      if (!webhookUrl) throw new Error("Agente webhook URL no está configurado.");
      
      let consultaContent: string | object;

      if (typeof payload === 'string') {
        consultaContent = payload; // Natural language query
      } else if (typeof payload === 'object' && payload !== null) {
        // Structured data for insertion/action, wrap in 'data' key as per instruction
        consultaContent = { "data": payload };
      } else {
        throw new Error("Payload de Agente no válido. Debe ser un string (consulta) o un objeto (datos a guardar).");
      }

      const body = {
        key: "agente", // Fixed key as per user specification
        consulta: consultaContent 
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorDetail = `Agente webhook request failed with status: ${response.status}`;
        try {
            const errorData = await response.json();
            // If errorData is an object, try to extract a message or stringify it
            errorDetail = errorData.error?.message || JSON.stringify(errorData);
        } catch (jsonParseError) {
            // If response.json() fails, fall back to plain text
            const responseText = await response.text();
            errorDetail = `Agente webhook request failed (status: ${response.status}, response: ${responseText.substring(0, 200)}...)`;
        }
        throw new Error(errorDetail);
      }
      
      const text = await response.text();
      try {
        // Attempt to parse the response text as JSON.
        // An empty string will cause an error, which is caught below.
        return JSON.parse(text);
      } catch (e) {
        // If parsing fails, check for common non-JSON webhook responses.
        if (text.trim().toLowerCase() === 'accepted') {
          // This indicates an async webhook. Our app requires a sync response with data.
          throw new Error('El agente aceptó la solicitud pero no devolvió datos de inmediato. La configuración del webhook debe ser ajustada para que devuelva una respuesta JSON síncrona.');
        }
        
        // If the response is not "Accepted" and not valid JSON, it's an unexpected format.
        throw new Error(`Respuesta inesperada del agente (no es JSON): ${text.substring(0, 200)}`);
      }
    }
  };
};