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
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Agente webhook request failed with status: ${response.status}`);
      }
      return response.json(); // Expecting structured JSON from agent
    }
  };
};