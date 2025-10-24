
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration, Chat } from "@google/genai";
import { SendIcon, SparklesIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabase } from '../../contexts/SupabaseContext';

interface Message {
  sender: 'user' | 'ai' | 'tool';
  content: any;
  toolCallId?: string;
}

const DATABASE_SCHEMA = `
  - Reporte_Servicio (id, created_at, codigo_reporte, fecha, entrada, salida, id_empresa, nombre_planta, id_encargado, serie_maquina, modelo_maquina, marca_maquina, linea_maquina, problemas_encontrados, acciones_realizadas, observaciones, facturado, no_facturado, con_garantia, sin_garantia, operativo, inoperativo, en_prueba, nombre_usuario, celular_usuario, id_usuario)
  - Empresa (id, created_at, nombre, direccion, distrito, ruc)
  - Planta (id, created_at, nombre, direccion, estado, id_empresa)
  - Maquinas (id, created_at, serie, modelo, marca, linea, estado, id_planta, id_empresa)
  - Encargado (id, created_at, nombre, apellido, email, celular, id_planta, id_empresa)
  - Usuarios (id, nombres, email, rol, dni, celular)
  - Roles (id, created_at, nombre)
  - role_permissions (role_id, permission_name)
`;

const SYSTEM_INSTRUCTION = `Eres un asistente experto en bases de datos Supabase. Tu propósito es ayudar a los usuarios a consultar la base de datos de la empresa.
Puedes ejecutar consultas SQL para responder preguntas. El usuario no sabe SQL, así que traduce sus preguntas a consultas SQL válidas.
Usa la función 'queryDatabase' para ejecutar consultas SELECT. Nunca modifiques ni elimines datos.
Resume los resultados para el usuario de una manera clara y amigable. Si los datos son apropiados, preséntalos como una tabla o un gráfico de barras.
Para crear tablas o gráficos, responde con un objeto JSON que contenga 'type' ('table' o 'bar_chart'), 'title' y 'data'. 'data' debe ser un array de objetos.
El esquema de la base de datos es: ${DATABASE_SCHEMA}`;

const queryDatabaseFunction: FunctionDeclaration = {
  name: 'queryDatabase',
  description: 'Ejecuta una consulta SQL SELECT de solo lectura en la base de datos para obtener información.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'La consulta SQL SELECT a ejecutar. Por ejemplo: SELECT nombre, ruc FROM Empresa LIMIT 5;'
      }
    },
    required: ['query']
  }
};

const Assistant: React.FC = () => {
  const { supabase } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { themeMode } = useTheme();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    chatRef.current = ai.chats.create({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [queryDatabaseFunction] }],
      },
    });
    setMessages([{ sender: 'ai', content: { type: 'text', data: '¡Hola! Soy tu asistente de datos. ¿Qué información te gustaría consultar hoy?' } }]);
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const queryDatabase = async (query: string) => {
    if (!supabase) throw new Error("Conexión a la base de datos no disponible.");
    // NOTE: In a production environment, executing raw SQL can be risky.
    // It's safer to use a dedicated database function (RPC) that sanitizes inputs.
    // We assume such a function, 'execute_mcp_query', exists for this feature.
    const { data, error } = await supabase.rpc('execute_mcp_query', { query_string: query });
    if (error) throw new Error(`Error en la base de datos: ${error.message}`);
    return data;
  };

  const handleSend = async () => {
    if (input.trim() === '' || isLoading || !chatRef.current) return;
    const userMessage: Message = { sender: 'user', content: { type: 'text', data: input } };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        let response = await chatRef.current.sendMessage(input);

        while (response.functionCalls && response.functionCalls.length > 0) {
            const fc = response.functionCalls[0];
            const toolMessage: Message = { sender: 'tool', content: { type: 'loading', data: 'Consultando base de datos...' }, toolCallId: fc.id };
            setMessages(prev => [...prev, toolMessage]);

            let queryResult;
            try {
                const sqlQuery = fc.args.query;
                queryResult = await queryDatabase(sqlQuery);
            } catch (e: any) {
                queryResult = { error: e.message };
            }
            
            setMessages(prev => prev.map(m => m.toolCallId === fc.id ? { ...m, content: { type: 'result', data: `Resultados obtenidos para la consulta.` } } : m));
            
            response = await chatRef.current.sendMessage(
                [{
                    functionResponse: {
                        name: fc.name,
                        id: fc.id,
                        response: { result: JSON.stringify(queryResult) },
                    },
                }]
            );
        }
        
        // Handle final AI response (text or JSON for chart/table)
        let finalContent = response.text;
        let aiMessageContent;
        try {
            // Check if the response is JSON for table/chart
            aiMessageContent = JSON.parse(finalContent);
        } catch (e) {
            // It's a plain text response
            aiMessageContent = { type: 'text', data: finalContent };
        }
        
        const aiMessage: Message = { sender: 'ai', content: aiMessageContent };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        console.error(error);
        const errorMessage: Message = { sender: 'ai', content: { type: 'text', data: 'Lo siento, he encontrado un error. Por favor, inténtalo de nuevo.' } };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const RenderContent: React.FC<{ content: any }> = ({ content }) => {
    const tickColor = themeMode === 'dark' ? '#9CA3AF' : '#6B7280';
    switch (content.type) {
      case 'text': return <p className="whitespace-pre-wrap">{content.data}</p>;
      case 'loading': return <div className="flex items-center gap-2 italic text-sm text-gray-500 dark:text-gray-400"><Spinner /> {content.data}</div>;
      case 'result': return <p className="italic text-sm text-gray-500 dark:text-gray-400">{content.data}</p>;
      case 'table':
        if (!Array.isArray(content.data) || content.data.length === 0) return <p>No se encontraron datos.</p>;
        return (
          <div>
            {content.title && <h4 className="font-bold mb-2">{content.title}</h4>}
            <div className="overflow-y-auto max-h-80 relative rounded-lg border dark:border-gray-600"><table className="w-full text-left text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10"><tr>{Object.keys(content.data[0] || {}).map(key => <th key={key} className="p-2 font-semibold">{key}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">{content.data.map((row: any, index: number) => (<tr key={index}>{Object.values(row).map((val: any, i: number) => <td key={i} className="p-2 break-words">{String(val)}</td>)}</tr>))}</tbody>
            </table></div>
          </div>
        );
      case 'bar_chart':
        if (!Array.isArray(content.data)) return <p>No hay datos de gráfico disponibles.</p>;
        const keys = Object.keys(content.data[0] || {});
        const nameKey = keys.find(k => typeof content.data[0][k] === 'string') || keys[0];
        const valueKey = keys.find(k => typeof content.data[0][k] === 'number') || keys[1];
        return (
           <div className="h-64 w-full">
             {content.title && <h4 className="font-bold mb-2 text-center">{content.title}</h4>}
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={content.data}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey={nameKey} stroke={tickColor}/>
                 <YAxis stroke={tickColor}/>
                 <Tooltip contentStyle={{ backgroundColor: themeMode === 'dark' ? '#374151' : '#FFF' }}/>
                 <Bar dataKey={valueKey} fill="var(--color-primary)" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        );
      default: return <p>Tipo de contenido no soportado.</p>;
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center shrink-0">
        <SparklesIcon className="h-6 w-6 text-primary mr-2"/>
        <h2 className="text-xl font-bold">Asistente IA (MCP)</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''} ${msg.sender === 'tool' ? 'justify-center' : ''}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><SparklesIcon className="h-5 w-5 text-white"/></div>}
            <div className={`max-w-xl p-3 rounded-2xl ${
                msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' 
                : msg.sender === 'ai' ? 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
                : 'bg-transparent text-center'
            }`}>
              <RenderContent content={msg.content}/>
            </div>
          </div>
        ))}
        {isLoading && !messages.some(m => m.sender === 'tool' && m.content.type === 'loading') && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><Spinner/></div>
             <div className="max-w-lg p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
               <p className="italic">La IA está pensando...</p>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ej: ¿Cuántos reportes facturados hay?"
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-primary focus:border-primary"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading} className="p-3 bg-primary text-white rounded-lg disabled:bg-primary/50 hover:bg-primary-dark transition-colors">
            <SendIcon className="h-5 w-5"/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
